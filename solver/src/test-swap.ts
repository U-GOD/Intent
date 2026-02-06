/**
 * Make Market on DeepBook V3 (Raw PTB Version)
 * 
 * Usage: pnpm run make-market
 */

import { SuiClient } from '@mysten/sui.js/client';
import { Ed25519Keypair } from '@mysten/sui.js/keypairs/ed25519';
import { TransactionBlock } from '@mysten/sui.js/transactions';
import { decodeSuiPrivateKey } from '@mysten/sui.js/cryptography';
import { config } from './config.js';

// DeepBook V3 Constants
const FLOAT_SCALAR = 1_000_000_000n; // 1e9

async function main() {
    console.log('\n=== DeepBook Market Maker (Raw PTB) ===\n');

    // Load keypair
    const privateKey = process.env.SUI_PRIVATE_KEY;
    if (!privateKey) {
        console.error('Error: SUI_PRIVATE_KEY not set in .env');
        process.exit(1);
    }

    const { schema, secretKey } = decodeSuiPrivateKey(privateKey);
    const keypair = Ed25519Keypair.fromSecretKey(secretKey);
    const address = keypair.getPublicKey().toSuiAddress();
    console.log('Maker Address:', address);

    // Create client
    const rpcUrl = process.env.RPC_URL || 'https://fullnode.testnet.sui.io:443';
    const client = new SuiClient({ url: rpcUrl });

    console.log('Placing Limit Order (ASK) on DEEP/SUI pool...');
    
    // Check DEEP coins
    const coins = await client.getCoins({ 
        owner: address, 
        coinType: config.coins.DEEP 
    });
    
    if (coins.data.length === 0) {
        console.error('No DEEP coins found to sell!');
        process.exit(1);
    }
    
    const tx = new TransactionBlock();
    
    const quantity = 10_000_000n; // 10 DEEP (6 decimals)
    
    // Price: 0.1 SUI per DEEP
    // Scaled price = 0.1 * 1e9 = 100_000_000
    const price = 100_000_000n; 
    
    // Merge coins if needed
    const primaryCoin = tx.object(coins.data[0].coinObjectId);
    if (coins.data.length > 1) {
        tx.mergeCoins(primaryCoin, coins.data.slice(1).map(c => tx.object(c.coinObjectId)));
    }
    
    console.log('Checking SUI -> DEEP swap capability (Rebalancing Test)...');
    
    // Swap 0.1 SUI for DEEP
    const [swapInput] = tx.splitCoins(tx.gas, [tx.pure(100_000_000n)]); // 0.1 SUI
    
    const [unusedSui, deepOutput, unusedDeep2] = tx.moveCall({
        target: `${config.deepbook.package}::pool::swap_exact_quote_for_base`, 
        arguments: [
            tx.object(config.deepbook.pools.DEEP_SUI),
            swapInput, // Quote Coin (SUI)
            tx.splitCoins(tx.gas, [tx.pure(0)]), // DEEP for fees (0)
            tx.pure(0), // Min Output
            tx.object('0x6') // Clock
        ],
        typeArguments: [config.coins.DEEP, config.coins.SUI] // <Base, Quote>
    });
    
    tx.transferObjects([deepOutput], tx.pure(address));
    tx.transferObjects([unusedSui, unusedDeep2], tx.pure(address));
    
    console.log('Submitting Swap Test...');
    
    const result = await client.signAndExecuteTransactionBlock({
            signer: keypair,
            transactionBlock: tx,
            options: {
                showEffects: true,
                showBalanceChanges: true,
            },
    });
    
    console.log('Result:', result.effects?.status?.status);
    if (result.effects?.status?.error) {
        console.error('Error:', result.effects.status.error);
    }
    
    if (result.balanceChanges) {
        console.log('Balance Changes:');
        result.balanceChanges.forEach(bc => {
            const coinName = bc.coinType.split('::').pop();
            const amount = BigInt(bc.amount);
            console.log(`- ${coinName}: ${amount > 0 ? '+' : ''}${amount}`);
        });
    }
}

main().catch(console.error);
