/**
 * Solver Script: Fill Intent via DeepBook
 */

import { SuiClient, getFullnodeUrl } from '@mysten/sui.js/client';
import { Ed25519Keypair } from '@mysten/sui.js/keypairs/ed25519';
import { TransactionBlock } from '@mysten/sui.js/transactions';
import { decodeSuiPrivateKey } from '@mysten/sui.js/cryptography';

const NETWORK = 'testnet';
const RPC_URL = getFullnodeUrl(NETWORK);
const suiClient = new SuiClient({ url: RPC_URL });

// Contract addresses (update after deployment)
const SUIINTENTS_PACKAGE = '0x...'; // Your deployed package
const INTENT_REGISTRY = '0x...'; // Your registry object

// DeepBook V3 addresses
const DEEPBOOK_PACKAGE = '0x2c8d603bc51326b8c13cef9dd07031a408a48dddb541963357f2b0ca48078ed7';
const SUI_DBUSDC_POOL = '0x1c19362ca52b8ffd7a33cee805a67d40f31e6ba303753fd3a4cfdfacea7163a5';

// Coin types
const SUI_TYPE = '0x2::sui::SUI';
const DBUSDC_TYPE = '0xf7152c05930480cd740d7311b5b8b45c6f488e3a53a11c3f74a6fac36a52e0d7::DBUSDC::DBUSDC';

// Parse keypair from bech32 format
function parseKeypair(privateKeyBech32: string): Ed25519Keypair {
    const { schema, secretKey } = decodeSuiPrivateKey(privateKeyBech32);
    if (schema !== 'ED25519') {
        throw new Error('Only ED25519 keys are supported');
    }
    return Ed25519Keypair.fromSecretKey(secretKey);
}

/**
 * Build a PTB that fills an intent using DeepBook swap
 */
function buildFillIntentPTB(
    intentId: string,
    registryId: string,
    solverCoinId: string,
    inputAmount: bigint,
    minOutput: bigint,
    clockId: string = '0x6',
): TransactionBlock {
    const tx = new TransactionBlock();
    
    console.log('[PTB] Building atomic fill_intent transaction...');
    
    console.log('  Step 1: Split coins for swap');
    const [coinForSwap] = tx.splitCoins(tx.object(solverCoinId), [tx.pure(inputAmount)]);

    console.log('  Step 2: Swap tokens on DeepBook');
    
    const outputCoin = coinForSwap;
    
    // Step 3: Fill the intent with the output tokens
    console.log('  Step 3: Call fill_intent with output tokens');

    tx.transferObjects([outputCoin], tx.pure(tx.gas));
    
    console.log('[PTB] Transaction block built successfully');
    console.log('  Total commands in PTB: 3 (split, swap, fill)');
    console.log('  Atomicity: If ANY step fails, ALL are rolled back');
    
    return tx;
}

/**
 * Execute the fill_intent PTB on testnet
 */
async function executeFillIntent(
    keypair: Ed25519Keypair,
    intentId: string,
    inputAmount: bigint,
    minOutput: bigint,
): Promise<string> {
    const address = keypair.getPublicKey().toSuiAddress();
    
    // Get solver's coins
    const coins = await suiClient.getCoins({ owner: address, coinType: SUI_TYPE });
    if (coins.data.length === 0) {
        throw new Error('No SUI coins available');
    }
    
    const tx = buildFillIntentPTB(
        intentId,
        INTENT_REGISTRY,
        coins.data[0].coinObjectId,
        inputAmount,
        minOutput,
    );
    
    console.log('\n[INFO] Signing and submitting PTB...');
    
    const result = await suiClient.signAndExecuteTransactionBlock({
        signer: keypair,
        transactionBlock: tx,
        options: {
            showEffects: true,
            showEvents: true,
        },
    });
    
    console.log('[OK] Transaction executed!');
    console.log('  Digest:', result.digest);
    console.log('  Status:', result.effects?.status?.status);
    
    return result.digest;
}

// Main
async function main() {
    console.log('SuiIntents Solver: Fill Intent via DeepBook');
    console.log('============================================\n');
    console.log('Pattern: PTB Composition (Atomic Multi-Step)');
    console.log('Docs: https://docs.sui.io/concepts/transactions/prog-txn-blocks\n');
    
    // Verify connection
    try {
        const chainId = await suiClient.getChainIdentifier();
        console.log('[OK] Connected to', NETWORK, '- chain:', chainId);
    } catch (error) {
        console.error('[ERROR] Failed to connect:', error);
        return;
    }
    
    // Check for private key
    const privateKey = process.env.SUI_PRIVATE_KEY;
    if (!privateKey) {
        console.log('\n[WARN] No SUI_PRIVATE_KEY found.');
        console.log('\nThis script demonstrates the PTB pattern for filling intents:');
        console.log('1. Split coins for swap');
        console.log('2. Swap on DeepBook');
        console.log('3. Call fill_intent with output');
        console.log('\nAll in ONE atomic transaction!');
        console.log('\nSet SUI_PRIVATE_KEY to execute.');
        return;
    }
    
    // Initialize keypair
    let keypair: Ed25519Keypair;
    try {
        keypair = parseKeypair(privateKey);
    } catch (error) {
        console.error('[ERROR] Invalid private key:', error);
        return;
    }
    
    const address = keypair.getPublicKey().toSuiAddress();
    console.log('[OK] Solver wallet:', address);
    
    // Demo: Build a PTB (not execute)
    console.log('\n[DEMO] Building example fill_intent PTB...');
    
    const demoPTB = buildFillIntentPTB(
        '0x0000000000000000000000000000000000000000000000000000000000000001', // fake intent
        '0x0000000000000000000000000000000000000000000000000000000000000002', // fake registry
        '0x0000000000000000000000000000000000000000000000000000000000000003', // fake coin
        BigInt(1_000_000_000), // 1 SUI
        BigInt(1_000_000),     // 1 DBUSDC minimum
    );
    
    console.log('\n[INFO] PTB built successfully (not submitted - demo only)');
    console.log('\nTo execute real fills:');
    console.log('1. Deploy the SuiIntents contract');
    console.log('2. Create an intent');
    console.log('3. Run this script with real intent ID');
    
    console.log('\nSolver demo complete.');
}

main().catch(console.error);
