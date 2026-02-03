/**
 * Executor Module - Build and submit atomic fill PTBs
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
            const tx = await this.buildAtomicFillPTB(intent, poolId, minOutput);
            
            console.log('[Executor] Submitting atomic fill transaction...');
            
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
    
    /**
     * Builds the complete atomic PTB for filling an intent
     * 
     * Flow:
     * 1. Prepare solver's coins (merge if needed)
     * 2. Swap on DeepBook to get output tokens
     * 3. Call fill_intent with the swapped output tokens
     * 4. Everything is atomic - reverts together if any step fails
     */
    private async buildAtomicFillPTB(
        intent: IntentCreatedEvent,
        poolId: string,
        minOutput: bigint
    ): Promise<TransactionBlock> {
        const tx = new TransactionBlock();
        const address = this.keypair!.getPublicKey().toSuiAddress();
        
        // Step 1: Get solver's coins to use for the swap
        const solverCoins = await this.getSolverCoins(intent.inputType);
        
        if (solverCoins.length === 0) {
            throw new Error(`No ${intent.inputType} coins available`);
        }
        
        // Merge all coins of this type if multiple
        let primaryCoin = tx.object(solverCoins[0]);
        if (solverCoins.length > 1) {
            tx.mergeCoins(primaryCoin, solverCoins.slice(1).map(id => tx.object(id)));
        }
        
        // Step 2: Split the amount needed for swap
        const [swapInputCoin] = tx.splitCoins(primaryCoin, [tx.pure(intent.inputAmount)]);
        
        // Step 3: Swap on DeepBook to get output tokens
        // This calls DeepBook's swap function atomically
        const [outputCoin, unusedInput] = tx.moveCall({
            target: `${config.deepbook.package}::pool::swap_exact_base_for_quote`,
            arguments: [
                tx.object(poolId),
                swapInputCoin,
                tx.pure(minOutput),
                tx.object('0x6'), // Clock
            ],
            typeArguments: [intent.inputType, intent.outputType],
        });
        
        // Step 4: Fill the intent with the swapped output tokens
        // This gives the output to the user and gives escrowed input to solver
        tx.moveCall({
            target: `${config.packageId}::intent::fill_intent`,
            arguments: [
                tx.object(config.registryId),
                tx.object(intent.intentId),
                outputCoin,
                tx.object('0x6'), // Clock
            ],
            typeArguments: [intent.inputType, intent.outputType],
        });
        
        // Step 5: Return any unused input back to solver
        tx.transferObjects([unusedInput], tx.pure(address));
        
        return tx;
    }
    
    /**
     * Get all coins of a specific type owned by the solver
     */
    private async getSolverCoins(coinType: string): Promise<string[]> {
        if (!this.keypair) return [];
        
        const address = this.keypair.getPublicKey().toSuiAddress();
        const coins = await this.client.getCoins({
            owner: address,
            coinType,
        });
        
        return coins.data.map(c => c.coinObjectId);
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
