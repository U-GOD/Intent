/**
 * Make Market on DeepBook V3
 * 
 * Usage: pnpm run make-market
 */

import { SuiClient } from '@mysten/sui.js/client';
import { Ed25519Keypair } from '@mysten/sui.js/keypairs/ed25519';
import { decodeSuiPrivateKey } from '@mysten/sui.js/cryptography';
import { DeepBookClient } from '@mysten/deepbook-v3';

async function main() {
    console.log('\n=== DeepBook Market Maker ===\n');

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

    // Initialize DeepBook client
    const dbClient = new DeepBookClient({
        address: address,
        env: 'testnet',
        client: client,
    });

    console.log('Checking balances...');
    
    // Check Status
    const balanceManager = dbClient.account; // Assuming default balance manager or implicit
    
    console.log('Placing Limit Order (ASK)...');
    console.log('Selling 10 DEEP for SUI...');
    
    // quantity: Amount of Base to trade (DEEP)
    const quantity = 10_000_000n; // 10 DEEP (6 decimals)
    const price = 0.1; 
    
    try {
        /*
         * placeLimitOrder params:
         * poolKey: string
         * price: number
         * quantity: bigint
         * isBid: boolean (false = ask/sell)
         * expiration?: number
         * orderType?: OrderType
         */
        const tx = await dbClient.placeLimitOrder({
            poolKey: 'DEEP_SUI', 
            price: price,
            quantity: quantity,
            isBid: false, // ASK (Sell DEEP)
            expiration: Date.now() + 1000 * 60 * 60 * 24, // 24 hours
        });

        console.log('Signing transaction...');
        
        const result = await client.signAndExecuteTransaction({
            signer: keypair,
            transaction: tx,
            options: {
                showEffects: true,
            },
        });
        
        console.log('Order Placed!', result.digest);
        console.log(`Explorer: https://suiscan.xyz/testnet/tx/${result.digest}`);
        
    } catch (error: any) {
        console.error('Error placing order:', error.message || error);
    }
}

main().catch(console.error);
