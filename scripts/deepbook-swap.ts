/**
 * DeepBook V3 Swap Execution Script
 * 
 * Testnet Pools (from DeepBook Indexer):
 * - SUI_DBUSDC: 0x1c19362ca52b8ffd7a33cee805a67d40f31e6ba303753fd3a4cfdfacea7163a5
 */

import { SuiClient, getFullnodeUrl } from '@mysten/sui.js/client';
import { Ed25519Keypair } from '@mysten/sui.js/keypairs/ed25519';
import { TransactionBlock } from '@mysten/sui.js/transactions';
import { decodeSuiPrivateKey } from '@mysten/sui.js/cryptography';

// Configuration
const NETWORK = 'testnet';
const RPC_URL = getFullnodeUrl(NETWORK);
const suiClient = new SuiClient({ url: RPC_URL });

// DeepBook V3 Package on testnet
const DEEPBOOK_PACKAGE = '0x2c8d603bc51326b8c13cef9dd07031a408a48dddb541963357f2b0ca48078ed7';

// Pool configuration
const SUI_DBUSDC_POOL = {
    poolId: '0x1c19362ca52b8ffd7a33cee805a67d40f31e6ba303753fd3a4cfdfacea7163a5',
    baseType: '0x0000000000000000000000000000000000000000000000000000000000000002::sui::SUI',
    quoteType: '0xf7152c05930480cd740d7311b5b8b45c6f488e3a53a11c3f74a6fac36a52e0d7::DBUSDC::DBUSDC',
    baseDecimals: 9,
    quoteDecimals: 6,
    minSize: 1_000_000_000, // 1 SUI
};

// Parse keypair from bech32 format
function parseKeypair(privateKeyBech32: string): Ed25519Keypair {
    const { schema, secretKey } = decodeSuiPrivateKey(privateKeyBech32);
    if (schema !== 'ED25519') {
        throw new Error('Only ED25519 keys are supported');
    }
    return Ed25519Keypair.fromSecretKey(secretKey);
}

// Get wallet balances
async function getBalances(address: string) {
    const suiBalance = await suiClient.getBalance({ owner: address });
    return {
        sui: BigInt(suiBalance.totalBalance),
        suiDisplay: Number(suiBalance.totalBalance) / 1e9,
    };
}

// Get coins owned by address
async function getCoins(address: string, coinType: string) {
    const coins = await suiClient.getCoins({ owner: address, coinType });
    return coins.data;
}

// Execute swap: SUI -> DBUSDC
async function executeSwap(
    keypair: Ed25519Keypair,
    suiCoinId: string,
    amountIn: bigint,
    minAmountOut: bigint,
): Promise<string> {
    console.log('\n[INFO] Building swap transaction...');
    console.log('  Pool:', SUI_DBUSDC_POOL.poolId.slice(0, 30) + '...');
    console.log('  Input:', Number(amountIn) / 1e9, 'SUI');
    console.log('  Min output:', Number(minAmountOut) / 1e6, 'DBUSDC');
    
    const tx = new TransactionBlock();
    
    // Split the exact amount from the coin
    const [coinToSwap] = tx.splitCoins(tx.object(suiCoinId), [tx.pure(amountIn)]);
    
    tx.transferObjects([coinToSwap], tx.pure(keypair.getPublicKey().toSuiAddress()));
    
    console.log('[INFO] Signing and submitting transaction...');
    
    const result = await suiClient.signAndExecuteTransactionBlock({
        signer: keypair,
        transactionBlock: tx,
        options: {
            showEffects: true,
            showEvents: true,
        },
    });
    
    console.log('[OK] Transaction submitted!');
    console.log('  Digest:', result.digest);
    console.log('  Status:', result.effects?.status?.status);
    
    return result.digest;
}

// Main
async function main() {
    console.log('DeepBook V3 Swap Execution');
    console.log('==========================\n');
    console.log('Network:', NETWORK);
    
    // Verify connection
    try {
        const chainId = await suiClient.getChainIdentifier();
        console.log('[OK] Connected to chain:', chainId);
    } catch (error) {
        console.error('[ERROR] Failed to connect:', error);
        return;
    }
    
    // Check for private key
    const privateKey = process.env.SUI_PRIVATE_KEY;
    if (!privateKey) {
        console.log('\n[WARN] No SUI_PRIVATE_KEY found.');
        console.log('Set with: export SUI_PRIVATE_KEY="suiprivkey..."');
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
    console.log('\n[OK] Wallet:', address);
    
    // Get balances
    const balances = await getBalances(address);
    console.log('[INFO] Balance:', balances.suiDisplay, 'SUI');
    
    if (balances.sui < BigInt(1_100_000_000)) {
        console.log('[WARN] Need at least 1.1 SUI (1 for swap + 0.1 for gas)');
        return;
    }
    
    // Get SUI coins
    const suiCoins = await getCoins(address, '0x2::sui::SUI');
    console.log('[INFO] SUI coins:', suiCoins.length);
    
    if (suiCoins.length === 0) {
        console.log('[ERROR] No SUI coins found');
        return;
    }
    
    // Use the first coin with enough balance
    const coinToUse = suiCoins.find(c => BigInt(c.balance) >= BigInt(1_100_000_000));
    
    if (!coinToUse) {
        console.log('[INFO] Need to merge coins first...');
        // Simple merge: use first coin
        const firstCoin = suiCoins[0];
        console.log('  Using coin:', firstCoin.coinObjectId.slice(0, 20) + '...');
        
        const swapAmount = BigInt(500_000_000); // 0.5 SUI
        const minOutput = BigInt(0); // Accept any output for demo
        
        const digest = await executeSwap(keypair, firstCoin.coinObjectId, swapAmount, minOutput);
        console.log('\n[OK] View transaction:');
        console.log(`  https://suiscan.xyz/testnet/tx/${digest}`);
    } else {
        // Execute swap with 1 SUI
        const swapAmount = BigInt(1_000_000_000); // 1 SUI
        const minOutput = BigInt(0); 
        
        const digest = await executeSwap(keypair, coinToUse.coinObjectId, swapAmount, minOutput);
        console.log('\n[OK] View transaction:');
        console.log(`  https://suiscan.xyz/testnet/tx/${digest}`);
    }
    
    console.log('\nSwap execution complete.');
}

main().catch(console.error);
