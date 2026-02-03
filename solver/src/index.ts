/**
 * SuiIntents Solver - Main Entry Point
 */

import { SuiClient, getFullnodeUrl } from '@mysten/sui.js/client';
import { config } from './config.js';
import { EventListener, IntentCreatedEvent } from './events.js';
import { PriceEngine } from './price.js';
import { Executor } from './executor.js';

class Solver {
    private client: SuiClient;
    private eventListener: EventListener;
    private priceEngine: PriceEngine;
    private executor: Executor;
    private running: boolean = false;
    private pendingIntents: Map<string, IntentCreatedEvent> = new Map();
    
    constructor() {
        const rpcUrl = getFullnodeUrl(config.network);
        this.client = new SuiClient({ url: rpcUrl });
        this.eventListener = new EventListener(this.client, config.packageId);
        this.priceEngine = new PriceEngine(this.client);
        this.executor = new Executor(this.client);
        
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
        
        if (this.executor.isReady()) {
            const balance = await this.executor.getBalance();
            console.log('[OK] Wallet:', this.executor.getAddress());
            console.log('[OK] Balance:', Number(balance) / 1e9, 'SUI');
        } else {
            console.log('[WARN] No wallet - dry run mode');
        }
        
        const pools = await this.priceEngine.getPools();
        console.log('[OK] DeepBook pools:', pools.length);
        
        this.running = true;
        console.log('[OK] Solver started');
        
        await this.eventListener.startPolling(config.solver.pollIntervalMs);
    }
    
    async stop(): Promise<void> {
        console.log('[INFO] Stopping solver...');
        this.running = false;
        this.eventListener.stopPolling();
    }
    
    private async handleNewIntent(event: IntentCreatedEvent): Promise<void> {
        console.log('[INTENT] New intent:', event.intentId);
        console.log('  Input:', event.inputAmount.toString(), event.inputType);
        console.log('  Min Output:', event.minOutput.toString(), event.outputType);
        
        this.pendingIntents.set(event.intentId, event);
        await this.evaluateAndFill(event);
    }
    
    private async evaluateAndFill(event: IntentCreatedEvent): Promise<void> {
        const poolId = this.findPoolForPair(event.inputType, event.outputType);
        if (!poolId) {
            console.log('[SKIP] No pool for pair');
            return;
        }
        
        const quote = await this.priceEngine.getQuote(poolId, event.inputAmount, true);
        if (!quote) {
            console.log('[SKIP] No quote available');
            return;
        }
        
        const profitable = this.priceEngine.isProfitable(
            event.inputAmount,
            quote.outputAmount,
            event.startRate,
            config.solver.minProfitBps
        );
        
        if (!profitable) {
            console.log('[SKIP] Not profitable');
            return;
        }
        
        console.log('[OK] Profitable intent - filling...');
        
        if (!this.executor.isReady()) {
            console.log('[SKIP] No wallet configured');
            return;
        }
        
        const result = await this.executor.fillIntent(event, poolId, event.minOutput);
        
        if (result.success) {
            console.log('[OK] Intent filled:', result.digest);
            this.pendingIntents.delete(event.intentId);
        } else {
            console.log('[ERROR] Fill failed:', result.error);
        }
    }
    
    private findPoolForPair(inputType: string, outputType: string): string | null {
        if (inputType.includes('SUI') && outputType.includes('USDC')) {
            return config.deepbook.pools.SUI_DBUSDC;
        }
        if (inputType.includes('DEEP') && outputType.includes('SUI')) {
            return config.deepbook.pools.DEEP_SUI;
        }
        return null;
    }
}

const solver = new Solver();

process.on('SIGINT', async () => {
    await solver.stop();
    process.exit(0);
});

solver.start().catch(console.error);
