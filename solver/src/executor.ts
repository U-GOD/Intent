/**
 * Executor Module - Build and submit fill PTBs
 */

import { SuiClient } from '@mysten/sui.js/client';
import { Ed25519Keypair } from '@mysten/sui.js/keypairs/ed25519';
import { TransactionBlock } from '@mysten/sui.js/transactions';
import { decodeSuiPrivateKey } from '@mysten/sui.js/cryptography';
import { config } from './config.js';
import { IntentCreatedEvent } from './events.js';

export interface FillResult {
    success: boolean;
    digest?: string;
    error?: string;
}

export class Executor {
    private client: SuiClient;
    private keypair: Ed25519Keypair | null = null;
    
    constructor(client: SuiClient) {
        this.client = client;
        this.loadKeypair();
    }
    
    private loadKeypair(): void {
        const privateKey = process.env.SUI_PRIVATE_KEY;
        if (!privateKey) {
            console.log('[Executor] No SUI_PRIVATE_KEY - dry run mode');
            return;
        }
        
        try {
            const { schema, secretKey } = decodeSuiPrivateKey(privateKey);
            if (schema !== 'ED25519') {
                throw new Error('Only ED25519 keys supported');
            }
            this.keypair = Ed25519Keypair.fromSecretKey(secretKey);
            console.log('[Executor] Wallet loaded:', this.keypair.getPublicKey().toSuiAddress());
        } catch (error) {
            console.error('[Executor] Failed to load keypair:', error);
        }
    }
    
    async fillIntent(
        intent: IntentCreatedEvent,
        poolId: string,
        minOutput: bigint
    ): Promise<FillResult> {
        if (!this.keypair) {
            return { success: false, error: 'No keypair loaded' };
        }
        
        try {
            const tx = await this.buildFillPTB(intent, poolId, minOutput);
            
            console.log('[Executor] Submitting fill transaction...');
            
            const result = await this.client.signAndExecuteTransactionBlock({
                signer: this.keypair,
                transactionBlock: tx,
                options: {
                    showEffects: true,
                    showEvents: true,
                },
            });
            
            const status = result.effects?.status?.status;
            
            if (status === 'success') {
                console.log('[Executor] Fill successful:', result.digest);
                return { success: true, digest: result.digest };
            } else {
                const error = result.effects?.status?.error || 'Unknown error';
                console.error('[Executor] Fill failed:', error);
                return { success: false, error };
            }
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            console.error('[Executor] Transaction error:', message);
            return { success: false, error: message };
        }
    }
    
    private async buildFillPTB(
        intent: IntentCreatedEvent,
        poolId: string,
        minOutput: bigint
    ): Promise<TransactionBlock> {
        const tx = new TransactionBlock();
        const address = this.keypair!.getPublicKey().toSuiAddress();
        
        const coins = await this.client.getCoins({
            owner: address,
            coinType: config.coins.SUI,
        });
        
        if (coins.data.length === 0) {
            throw new Error('No coins available');
        }
        
        if (coins.data.length > 1) {
            const coinIds = coins.data.map(c => c.coinObjectId);
            tx.mergeCoins(tx.object(coinIds[0]), coinIds.slice(1).map(id => tx.object(id)));
        }
        
        const [swapCoin] = tx.splitCoins(
            tx.object(coins.data[0].coinObjectId),
            [tx.pure(intent.inputAmount)]
        );
        
        tx.moveCall({
            target: `${config.packageId}::intent::fill_intent`,
            arguments: [
                tx.object(config.registryId),
                tx.object(intent.intentId),
                swapCoin,
                tx.object('0x6'),
            ],
            typeArguments: [intent.inputType, intent.outputType],
        });
        
        return tx;
    }
    
    async getBalance(): Promise<bigint> {
        if (!this.keypair) return BigInt(0);
        
        const address = this.keypair.getPublicKey().toSuiAddress();
        const balance = await this.client.getBalance({
            owner: address,
            coinType: config.coins.SUI,
        });
        
        return BigInt(balance.totalBalance);
    }
    
    getAddress(): string | null {
        return this.keypair?.getPublicKey().toSuiAddress() ?? null;
    }
    
    isReady(): boolean {
        return this.keypair !== null;
    }
}
