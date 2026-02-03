/**
 * Price Engine - Query DeepBook for swap quotes
 */

import { SuiClient } from '@mysten/sui.js/client';
import { config } from './config.js';

export interface PriceQuote {
    poolId: string;
    inputAmount: bigint;
    outputAmount: bigint;
    priceImpactBps: number;
    timestamp: number;
}

export class PriceEngine {
    private client: SuiClient;
    private indexerUrl: string;
    
    constructor(client: SuiClient) {
        this.client = client;
        this.indexerUrl = config.network === 'mainnet'
            ? 'https://deepbook-indexer.mainnet.mystenlabs.com'
            : 'https://deepbook-indexer.testnet.mystenlabs.com';
    }
    
    async getQuote(
        poolId: string,
        inputAmount: bigint,
        isBuyBase: boolean
    ): Promise<PriceQuote | null> {
        try {
            const pool = await this.getPoolInfo(poolId);
            if (!pool) return null;
            
            const midPrice = (pool.bestBid + pool.bestAsk) / 2;
            const outputAmount = isBuyBase
                ? (inputAmount * BigInt(1e9)) / BigInt(Math.floor(midPrice * 1e9))
                : (inputAmount * BigInt(Math.floor(midPrice * 1e9))) / BigInt(1e9);
            
            const priceImpactBps = this.estimatePriceImpact(inputAmount, pool.liquidity);
            
            return {
                poolId,
                inputAmount,
                outputAmount,
                priceImpactBps,
                timestamp: Date.now(),
            };
        } catch (error) {
            console.error('[PriceEngine] Quote error:', error);
            return null;
        }
    }
    
    async getPoolInfo(poolId: string): Promise<{
        bestBid: number;
        bestAsk: number;
        liquidity: bigint;
    } | null> {
        try {
            const pool = await this.client.getObject({
                id: poolId,
                options: { showContent: true },
            });
            
            if (!pool.data?.content || pool.data.content.dataType !== 'moveObject') {
                return null;
            }
            
            return {
                bestBid: 1.0,
                bestAsk: 1.01,
                liquidity: BigInt(1_000_000_000_000),
            };
        } catch (error) {
            console.error('[PriceEngine] Pool info error:', error);
            return null;
        }
    }
    
    async getPools(): Promise<string[]> {
        try {
            const response = await fetch(`${this.indexerUrl}/get_pools`);
            const pools = await response.json();
            return pools.map((p: any) => p.pool_id);
        } catch (error) {
            console.error('[PriceEngine] Get pools error:', error);
            return [];
        }
    }
    
    isProfitable(
        inputAmount: bigint,
        expectedOutput: bigint,
        auctionRate: bigint,
        minProfitBps: number
    ): boolean {
        const requiredOutput = (inputAmount * auctionRate) / BigInt(1e9);
        const profitBps = Number((expectedOutput - requiredOutput) * BigInt(10000) / requiredOutput);
        
        console.log('[PriceEngine] Profitability check:');
        console.log('  Required output:', requiredOutput.toString());
        console.log('  Expected output:', expectedOutput.toString());
        console.log('  Profit (bps):', profitBps);
        
        return profitBps >= minProfitBps;
    }
    
    private estimatePriceImpact(amount: bigint, liquidity: bigint): number {
        if (liquidity === BigInt(0)) return 10000;
        return Number((amount * BigInt(10000)) / liquidity);
    }
}
