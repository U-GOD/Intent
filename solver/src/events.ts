/**
 * Event Listener - Subscribes to blockchain events
 * With retry logic for handling transient network errors
 */

import { SuiClient, SuiEvent } from '@mysten/sui.js/client';

export interface IntentCreatedEvent {
    intentId: string;
    creator: string;
    inputType: string;
    inputAmount: bigint;
    outputType: string;
    minOutput: bigint;
    startRate: bigint;
    deadline: bigint;
}

export interface IntentFilledEvent {
    intentId: string;
    solver: string;
    outputAmount: bigint;
    fillRate: bigint;
}

export type EventHandler = (event: IntentCreatedEvent) => Promise<void>;

export class EventListener {
    private client: SuiClient;
    private packageId: string;
    private handlers: EventHandler[] = [];
    private lastCursor: string | null = null;
    private polling: boolean = false;
    private consecutiveErrors: number = 0;
    private maxRetries: number = 5;
    
    constructor(client: SuiClient, packageId: string) {
        this.client = client;
        this.packageId = packageId;
    }
    
    onIntentCreated(handler: EventHandler): void {
        this.handlers.push(handler);
    }
    
    async startPolling(intervalMs: number = 1000): Promise<void> {
        this.polling = true;
        console.log('[EventListener] Started polling for events');
        
        while (this.polling) {
            await this.pollEventsWithRetry();
            // Use longer interval if we've had errors
            const adjustedInterval = this.consecutiveErrors > 0 
                ? intervalMs * Math.min(this.consecutiveErrors + 1, 5)
                : intervalMs;
            await this.sleep(adjustedInterval);
        }
    }
    
    stopPolling(): void {
        this.polling = false;
        console.log('[EventListener] Stopped polling');
    }
    
    private async pollEventsWithRetry(): Promise<void> {
        try {
            await this.pollEvents();
            // Reset error counter on success
            if (this.consecutiveErrors > 0) {
                console.log('[EventListener] Connection restored');
                this.consecutiveErrors = 0;
            }
        } catch (error) {
            this.consecutiveErrors++;
            const isConnReset = error instanceof Error && 
                (error.message.includes('ECONNRESET') || 
                 error.message.includes('fetch failed') ||
                 error.cause?.toString().includes('ECONNRESET'));
            
            if (isConnReset && this.consecutiveErrors <= this.maxRetries) {
                const backoffMs = Math.min(1000 * Math.pow(2, this.consecutiveErrors), 30000);
                console.log(`[EventListener] Connection error (attempt ${this.consecutiveErrors}/${this.maxRetries}), retrying in ${backoffMs/1000}s...`);
                await this.sleep(backoffMs);
            } else if (this.consecutiveErrors > this.maxRetries) {
                console.error('[EventListener] Max retries exceeded, will keep trying with longer intervals');
            } else {
                console.error('[EventListener] Error polling events:', error);
            }
        }
    }
    
    private async pollEvents(): Promise<void> {
        const eventType = `${this.packageId}::intent::IntentCreated`;
        
        const events = await this.client.queryEvents({
            query: { MoveEventType: eventType },
            cursor: this.lastCursor ?? undefined,
            limit: 50,
            order: 'ascending',
        });
        
        if (events.data.length > 0) {
            console.log(`[EventListener] Found ${events.data.length} new events`);
            
            for (const event of events.data) {
                await this.processEvent(event);
            }
            
            if (events.nextCursor) {
                this.lastCursor = events.nextCursor;
            }
        }
    }
    
    private async processEvent(event: SuiEvent): Promise<void> {
        const parsed = event.parsedJson as any;
        
        const intentEvent: IntentCreatedEvent = {
            intentId: parsed.intent_id,
            creator: parsed.creator,
            inputType: parsed.input_type?.name || '',
            inputAmount: BigInt(parsed.input_amount || 0),
            outputType: parsed.output_type?.name || '',
            minOutput: BigInt(parsed.min_output || 0),
            startRate: BigInt(parsed.start_rate || 0),
            deadline: BigInt(parsed.deadline || 0),
        };
        
        console.log('[EventListener] New intent:', intentEvent.intentId);
        
        for (const handler of this.handlers) {
            try {
                await handler(intentEvent);
            } catch (error) {
                console.error('[EventListener] Handler error:', error);
            }
        }
    }
    
    private sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
