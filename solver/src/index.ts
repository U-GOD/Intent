/**
 * SuiIntents Solver - Production Bot
 */

import { SuiClient, getFullnodeUrl } from '@mysten/sui.js/client';
import { config } from './config.js';
import { EventListener, IntentCreatedEvent } from './events.js';
import { PriceEngine } from './price.js';
import { Executor } from './executor.js';

interface Stats {
    started: Date;
    intentsReceived: number;
    intentsFilled: number;
    intentsFailed: number;
    intentsSkipped: number;
}

class Solver {
    private client: SuiClient;
    private eventListener: EventListener;
    private priceEngine: PriceEngine;
    private executor: Executor;
    private running: boolean = false;
    private pendingIntents: Map<string, IntentCreatedEvent> = new Map();
    private stats: Stats;
    
    constructor() {
        // Use QuickNode RPC from env, fallback to suiscan
        const rpcUrl = process.env.RPC_URL || 'https://rpc-testnet.suiscan.xyz/';
        console.log('  Using RPC:', rpcUrl.substring(0, 50) + '...');
        this.client = new SuiClient({ url: rpcUrl });
        this.eventListener = new EventListener(this.client, config.packageId);
        this.priceEngine = new PriceEngine(this.client);
        this.executor = new Executor(this.client);
        this.stats = {
            started: new Date(),
            intentsReceived: 0,
            intentsFilled: 0,
            intentsFailed: 0,
            intentsSkipped: 0,
        };
        
        this.eventListener.onIntentCreated(this.handleNewIntent.bind(this));
    }
    
    async start(): Promise<void> {
        console.log('');
        console.log('  SuiIntents Solver Bot');
        console.log('  =====================');
        console.log('');
        console.log('  Network:', config.network);
        console.log('  Package:', config.packageId);
        console.log('  Min Profit:', config.solver.minProfitBps, 'bps');
        console.log('');
        
        try {
            const chainId = await this.client.getChainIdentifier();
            console.log('  [OK] Chain:', chainId);
        } catch (error) {
            console.error('  [X] Connection failed');
            process.exit(1);
        }
        
        if (this.executor.isReady()) {
            const balance = await this.executor.getBalance();
            console.log('  [OK] Wallet:', this.executor.getAddress()?.slice(0, 20) + '...');
            console.log('  [OK] Balance:', (Number(balance) / 1e9).toFixed(4), 'SUI');
        } else {
            console.log('  [!] No wallet - dry run mode');
        }
        
        const pools = await this.priceEngine.getPools();
        console.log('  [OK] Pools:', pools.length, 'available');
        
        console.log('');
        console.log('  Bot is running. Press Ctrl+C to stop.');
        console.log('  =====================================');
        console.log('');
        
        this.running = true;
        await this.eventListener.startPolling(config.solver.pollIntervalMs);
    }
    
    async stop(): Promise<void> {
        this.running = false;
        this.eventListener.stopPolling();
        
        console.log('');
        console.log('  Solver Statistics');
        console.log('  -----------------');
        console.log('  Runtime:', this.getRuntime());
        console.log('  Intents received:', this.stats.intentsReceived);
        console.log('  Intents filled:', this.stats.intentsFilled);
        console.log('  Intents failed:', this.stats.intentsFailed);
        console.log('  Intents skipped:', this.stats.intentsSkipped);
        console.log('');
    }
    
    private getRuntime(): string {
        const ms = Date.now() - this.stats.started.getTime();
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        
        if (hours > 0) return `${hours}h ${minutes % 60}m`;
        if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
        return `${seconds}s`;
    }
    
    private async handleNewIntent(event: IntentCreatedEvent): Promise<void> {
        this.stats.intentsReceived++;
        
        const shortId = event.intentId.slice(0, 16) + '...';
        console.log(`[${new Date().toISOString()}] Intent: ${shortId}`);
        
        this.pendingIntents.set(event.intentId, event);
        await this.evaluateAndFill(event);
    }
    
    private async evaluateAndFill(event: IntentCreatedEvent): Promise<void> {
        const poolId = this.findPoolForPair(event.inputType, event.outputType);
        if (!poolId) {
            console.log('  -> Skipped: no pool for pair');
            this.stats.intentsSkipped++;
            return;
        }
        
        const quote = await this.priceEngine.getQuote(poolId, event.inputAmount, true);
        if (!quote) {
            console.log('  -> Skipped: no quote');
            this.stats.intentsSkipped++;
            return;
        }
        
        const profitable = this.priceEngine.isProfitable(
            event.inputAmount,
            quote.outputAmount,
            event.startRate,
            config.solver.minProfitBps
        );
        
        if (!profitable) {
            console.log('  -> Skipped: not profitable');
            this.stats.intentsSkipped++;
            return;
        }
        
        if (!this.executor.isReady()) {
            console.log('  -> Skipped: no wallet');
            this.stats.intentsSkipped++;
            return;
        }
        
        console.log('  -> Filling...');
        const result = await this.executor.fillIntent(event, poolId, event.minOutput);
        
        if (result.success) {
            console.log('  -> Filled:', result.digest?.slice(0, 20) + '...');
            this.stats.intentsFilled++;
            this.pendingIntents.delete(event.intentId);
        } else {
            console.log('  -> Failed:', result.error);
            this.stats.intentsFailed++;
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
