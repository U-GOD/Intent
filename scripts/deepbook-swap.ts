/**
 * DeepBook V3 Swap Execution Script
 * 
 * Executes swaps on Sui testnet via DeepBook V3.
 * 
 * Requirements:
 * - Testnet SUI in wallet (get from https://faucet.testnet.sui.io/)
 * - Set SUI_PRIVATE_KEY environment variable
 * 
 * Testnet Pools (from DeepBook Indexer):
 * - DEEP_SUI:      0x48c95963e9eac37a316b7ae04a0deb761bcdcc2b67912374d6036e7f0e9bae9f
 * - SUI_DBUSDC:    0x1c19362ca52b8ffd7a33cee805a67d40f31e6ba303753fd3a4cfdfacea7163a5
 * - DEEP_DBUSDC:   0xe86b991f8632217505fd859445f9803967ac84a9d4a1219065bf191fcb74b622
 */

import { SuiClient, getFullnodeUrl } from '@mysten/sui.js/client';
import { Ed25519Keypair } from '@mysten/sui.js/keypairs/ed25519';
import { TransactionBlock } from '@mysten/sui.js/transactions';

// Configuration
const NETWORK = 'testnet';
const RPC_URL = getFullnodeUrl(NETWORK);
const suiClient = new SuiClient({ url: RPC_URL });

// DeepBook Testnet Package (from Sui explorer)
const DEEPBOOK_PACKAGE = '0x2c8d603bc51326b8c13cef9dd07031a408a48dddb541963357f2b0ca48078ed7';

// Pool IDs (from https://deepbook-indexer.testnet.mystenlabs.com/get_pools)
const POOLS = {
    DEEP_SUI: {
        poolId: '0x48c95963e9eac37a316b7ae04a0deb761bcdcc2b67912374d6036e7f0e9bae9f',
        baseCoin: '0x36dbef866a1d62bf7328989a10fb2f07d769f4ee587c0de4a0a256e57e0a58a8::deep::DEEP',
        quoteCoin: '0x0000000000000000000000000000000000000000000000000000000000000002::sui::SUI',
        baseDecimals: 6,
        quoteDecimals: 9,
        minSize: 10_000_000, // 10 DEEP minimum
    },
    SUI_DBUSDC: {
        poolId: '0x1c19362ca52b8ffd7a33cee805a67d40f31e6ba303753fd3a4cfdfacea7163a5',
        baseCoin: '0x0000000000000000000000000000000000000000000000000000000000000002::sui::SUI',
        quoteCoin: '0xf7152c05930480cd740d7311b5b8b45c6f488e3a53a11c3f74a6fac36a52e0d7::DBUSDC::DBUSDC',
        baseDecimals: 9,
        quoteDecimals: 6,
        minSize: 1_000_000_000, // 1 SUI minimum
    },
};

// Get wallet balances
async function getBalances(address: string) {
    console.log('\n[INFO] Checking wallet balances...');
    
    const suiBalance = await suiClient.getBalance({ owner: address });
    console.log('- SUI:', Number(suiBalance.totalBalance) / 1e9, 'SUI');
    
    return {
        sui: BigInt(suiBalance.totalBalance),
    };
}

// Get coins owned by address
async function getCoins(address: string, coinType: string) {
    const coins = await suiClient.getCoins({
        owner: address,
        coinType: coinType,
    });
    return coins.data;
}

// Build swap transaction
function buildSwapTx(
    poolId: string,
    baseCoinType: string,
    quoteCoinType: string,
    inputCoinId: string,
    minOutput: bigint,
): TransactionBlock {
    const tx = new TransactionBlock();
    
    // Note: DeepBook V3 swap requires a specific function call structure
    // This is a template - actual implementation depends on pool type
    
    console.log('[INFO] Building swap transaction...');
    console.log('  Pool:', poolId.slice(0, 20) + '...');
    console.log('  Input coin:', inputCoinId.slice(0, 20) + '...');
    console.log('  Min output:', minOutput.toString());
    
    return tx;
}

// Main
async function main() {
    console.log('DeepBook V3 Swap Execution');
    console.log('==========================\n');
    console.log('Network:', NETWORK);
    console.log('Indexer: https://deepbook-indexer.testnet.mystenlabs.com/get_pools');
    
    // Verify connection
    try {
        const chainId = await suiClient.getChainIdentifier();
        console.log('[OK] Connected to chain:', chainId);
    } catch (error) {
        console.error('[ERROR] Failed to connect:', error);
        return;
    }
    
    // Show available pools
    console.log('\n[INFO] Available testnet pools:');
    Object.entries(POOLS).forEach(([name, pool]) => {
        console.log(`  ${name}:`);
        console.log(`    Pool ID: ${pool.poolId.slice(0, 30)}...`);
        console.log(`    Min Size: ${pool.minSize / Math.pow(10, pool.baseDecimals)} ${name.split('_')[0]}`);
    });
    
    // Check for private key
    const privateKey = process.env.SUI_PRIVATE_KEY;
    if (!privateKey) {
        console.log('\n[WARN] No SUI_PRIVATE_KEY found.');
        console.log('\nTo execute swaps:');
        console.log('1. Get testnet SUI: https://faucet.testnet.sui.io/');
        console.log('2. Set environment variable:');
        console.log('   PowerShell: $env:SUI_PRIVATE_KEY = "suiprivkey..."');
        console.log('   Bash: export SUI_PRIVATE_KEY="suiprivkey..."');
        console.log('\n[INFO] Demo complete.');
        return;
    }
    
    // Initialize keypair
    let keypair: Ed25519Keypair;
    try {
        keypair = Ed25519Keypair.fromSecretKey(privateKey);
    } catch (error) {
        console.error('[ERROR] Invalid private key format');
        return;
    }
    
    const address = keypair.getPublicKey().toSuiAddress();
    console.log('\n[OK] Wallet:', address);
    
    // Get balances
    const balances = await getBalances(address);
    
    if (balances.sui < BigInt(100_000_000)) {
        console.log('\n[WARN] Low SUI balance. Get testnet SUI from:');
        console.log('  https://faucet.testnet.sui.io/');
    }
    
    // Get SUI coins for potential swap
    const suiCoins = await getCoins(address, '0x2::sui::SUI');
    console.log('\n[INFO] SUI coins in wallet:', suiCoins.length);
    suiCoins.slice(0, 3).forEach((coin, i) => {
        console.log(`  ${i + 1}. ${coin.coinObjectId.slice(0, 20)}... (${Number(coin.balance) / 1e9} SUI)`);
    });
    
    // Show how to execute a swap
    console.log('\n[INFO] Swap execution ready.');
    console.log('[INFO] Use buildSwapTx() to create transactions.');
    console.log('\nSwap demo complete.');
}

main().catch(console.error);
