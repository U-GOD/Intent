/**
 * SuiIntents Solver - Main Entry Point
 */

import { SuiClient, getFullnodeUrl } from '@mysten/sui.js/client';
import { config } from './config.js';
import { EventListener, IntentCreatedEvent } from './events.js';

class Solver {
    private client: SuiClient;
    private eventListener: EventListener;
    private running: boolean = false;
    private pendingIntents: Map<string, IntentCreatedEvent> = new Map();
    
    constructor() {
        const rpcUrl = getFullnodeUrl(config.network);
        this.client = new SuiClient({ url: rpcUrl });
        this.eventListener = new EventListener(this.client, config.packageId);
        
        this.eventListener.onIntentCreated(this.handleNewIntent.bind(this));
    }
    
    async start(): Promise<void> {
        console.log('SuiIntents Solver');
        console.log('=================');
        console.log('Network:', config.network);
        console.log('Package:', config.packageId);
        
        try {
            const chainId = await this.client.getChainIdentifier();
            console.log('[OK] Connected to chain:', chainId);
        } catch (error) {
            console.error('[ERROR] Failed to connect:', error);
            process.exit(1);
        }
        
        this.running = true;
        console.log('[OK] Solver started');
        console.log('[OK] Listening for IntentCreated events...');
        
        await this.eventListener.startPolling(config.solver.pollIntervalMs);
    }
    
    async stop(): Promise<void> {
        console.log('[INFO] Stopping solver...');
        this.running = false;
        this.eventListener.stopPolling();
    }
    
    private async handleNewIntent(event: IntentCreatedEvent): Promise<void> {
        console.log('[INTENT] New intent detected:');
        console.log('  ID:', event.intentId);
        console.log('  Creator:', event.creator);
        console.log('  Input:', event.inputAmount.toString(), event.inputType);
        console.log('  Min Output:', event.minOutput.toString(), event.outputType);
        console.log('  Deadline:', new Date(Number(event.deadline)).toISOString());
        
        this.pendingIntents.set(event.intentId, event);
    }
}

const solver = new Solver();

process.on('SIGINT', async () => {
    await solver.stop();
    process.exit(0);
});

solver.start().catch(console.error);
