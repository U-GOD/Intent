/**
 * SuiIntents Solver - Main Entry Point
 */

import { SuiClient, getFullnodeUrl } from '@mysten/sui.js/client';
import { config } from './config.js';

class Solver {
    private client: SuiClient;
    private running: boolean = false;
    
    constructor() {
        const rpcUrl = getFullnodeUrl(config.network);
        this.client = new SuiClient({ url: rpcUrl });
    }
    
    async start(): Promise<void> {
        console.log('SuiIntents Solver');
        console.log('=================');
        console.log('Network:', config.network);
        
        // Verify connection
        try {
            const chainId = await this.client.getChainIdentifier();
            console.log('[OK] Connected to chain:', chainId);
        } catch (error) {
            console.error('[ERROR] Failed to connect:', error);
            process.exit(1);
        }
        
        this.running = true;
        console.log('[OK] Solver started');
        
        // Main loop
        while (this.running) {
            await this.tick();
            await this.sleep(config.solver.pollIntervalMs);
        }
    }
    
    async stop(): Promise<void> {
        console.log('[INFO] Stopping solver...');
        this.running = false;
    }
    
    private async tick(): Promise<void> {
    }
    
    private sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Main
const solver = new Solver();

// Handle graceful shutdown
process.on('SIGINT', async () => {
    await solver.stop();
    process.exit(0);
});

solver.start().catch(console.error);
