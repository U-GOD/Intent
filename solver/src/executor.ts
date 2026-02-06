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
     */
    private async buildAtomicFillPTB(
        intent: IntentCreatedEvent,
        poolId: string,
        minOutput: bigint
    ): Promise<TransactionBlock> {
        const tx = new TransactionBlock();
        const address = this.keypair!.getPublicKey().toSuiAddress();
        
        // Check if we can fill directly from inventory (e.g. we have DEEP)
        const solverCoins = await this.getSolverCoins(intent.outputType);
        let outputCoin;
        
        // Simple Inventory Logic: If we have the output coin, use it directly! 
        // This is perfect for SUI -> DEEP flow where we have DEEP inventory
        // (For production we might want to swap anyway to rebalance, but for demo this is safer)
        // Check for specific pair logic
        const isSuiToDeep = intent.inputType.includes('sui::SUI') && intent.outputType.includes('deep::DEEP');

        if (solverCoins.length > 0 && !isSuiToDeep) {
            console.log('[Executor] Direct Fill: Using inventory for', intent.outputType);
            
            const primaryCoin = tx.object(solverCoins[0]);
            if (solverCoins.length > 1) {
                tx.mergeCoins(primaryCoin, solverCoins.slice(1).map(id => tx.object(id)));
            }
            // Split the exact amount needed for the user
            [outputCoin] = tx.splitCoins(primaryCoin, [tx.pure(minOutput)]);
            
        } else {
            // Swap Logic (DeepBook)
            console.log('[Executor] Swap Fill: Swapping on DeepBook for', intent.outputType);

            // 1. Prepare Input Coin (to sell)
            let swapInputCoin;
            if (intent.inputType === '0x2::sui::SUI' || intent.inputType.includes('::sui::SUI')) {
                 let amountToSwap = intent.inputAmount;
                 if (isSuiToDeep) {
                     // Safety Strategy: Swap input + 10% buffer
                     // Prevents "Whale Drain" while ensuring fill if price is reasonable.
                     // If price is terrible, the transaction will fail (as it should).
                     amountToSwap = intent.inputAmount * 110n / 100n; 
                     console.log('[Executor] Safety Strategy: Swapping', amountToSwap, 'SUI (+10%)');
                 }
                 [swapInputCoin] = tx.splitCoins(tx.gas, [tx.pure(amountToSwap)]);
            } else {
                const inputCoins = await this.getSolverCoins(intent.inputType);
                if (inputCoins.length === 0) {
                    throw new Error(`No ${intent.inputType} coins available for swap`);
                }
                let primaryCoin = tx.object(inputCoins[0]);
                if (inputCoins.length > 1) {
                    tx.mergeCoins(primaryCoin, inputCoins.slice(1).map(id => tx.object(id)));
                }
                [swapInputCoin] = tx.splitCoins(primaryCoin, [tx.pure(intent.inputAmount)]);
            }

            // 2. Prepare DEEP for fees
            const deepCoins = await this.getSolverCoins(config.coins.DEEP);
            let deepCoin;
            if (deepCoins.length > 0) {
                deepCoin = tx.object(deepCoins[0]);
            } else {
                if (isSuiToDeep) {
                     throw new Error("No DEEP tokens found for fees!");
                }
                [deepCoin] = tx.splitCoins(tx.gas, [tx.pure(0)]);
            }
            
            // 3. Execute Swap
            let targetFunc = `${config.deepbook.package}::pool::swap_exact_base_for_quote`;
            let typeArgs = [intent.inputType, intent.outputType];
            let outputIndex = 1; // Default: Output is Quote (Index 1)

            if (isSuiToDeep) {
                // SUI->DEEP: selling Quote (SUI) to buy Base (DEEP).
                targetFunc = `${config.deepbook.package}::pool::swap_exact_quote_for_base`;
                typeArgs = [intent.outputType, intent.inputType]; // <Base, Quote>
                outputIndex = 0; // Output is Base (Index 0)
            }

            console.log(`[Executor] Swap Func: ${targetFunc}`);
            
            const result = tx.moveCall({
                target: targetFunc,
                arguments: [
                    tx.object(poolId),
                    swapInputCoin,
                    deepCoin,
                    tx.pure(minOutput),
                    tx.object('0x6'), // Clock
                ],
                typeArguments: typeArgs,
            });
            
            // Assign output based on function
            if (outputIndex === 0) {
                 outputCoin = result[0]; // Base
                 // Transfer remainders: [1] = Deep, [2] = Quote
                 tx.transferObjects([result[1], result[2]], tx.pure(address));
            } else {
                 outputCoin = result[1]; // Quote
                 // Transfer remainders: [0] = Base, [2] = Deep?
                 tx.transferObjects([result[0], result[2]], tx.pure(address));
            }
        }

        // 4. Fill the Intent
        // This gives outputCoin to user, and solver gets the escrowed inputCoin
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
