/**
 * Event Listener - Subscribes to blockchain events
 */

import { SuiClient, SuiEvent } from '@mysten/sui.js/client';
import { config } from './config.js';

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
            await this.pollEvents();
            await this.sleep(intervalMs);
        }
    }
    
    stopPolling(): void {
        this.polling = false;
        console.log('[EventListener] Stopped polling');
    }
    
    private async pollEvents(): Promise<void> {
        try {
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
        } catch (error) {
            console.error('[EventListener] Error polling events:', error);
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
