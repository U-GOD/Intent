/**
 * Get USDC for Solver - Swap DEEP for DBUSDC using DeepBook V3 SDK
 * 
 * Usage: pnpm run get-usdc
 */

import { SuiClient } from '@mysten/sui.js/client';
import { Ed25519Keypair } from '@mysten/sui.js/keypairs/ed25519';
import { Transaction } from '@mysten/sui.js/transactions';
import { decodeSuiPrivateKey } from '@mysten/sui.js/cryptography';
import { DeepBookClient } from '@mysten/deepbook-v3';

// Token types
const DEEP_TYPE = '0x36dbef866a1d62bf7328989a10fb2f07d769f4ee587c0de4a0a256e57e0a58a8::deep::DEEP';
const DBUSDC_TYPE = '0xf7152c05930480cd740d7311b5b8b45c6f488e3a53a11c3f74a6fac36a52e0d7::DBUSDC::DBUSDC';

async function main() {
    console.log('\n=== Swap DEEP for DBUSDC (SDK) ===\n');

    // Load keypair
    const privateKey = process.env.SUI_PRIVATE_KEY;
    if (!privateKey) {
        console.error('Error: SUI_PRIVATE_KEY not set in .env');
        process.exit(1);
    }

    const { schema, secretKey } = decodeSuiPrivateKey(privateKey);
    if (schema !== 'ED25519') {
        console.error('Error: Only ED25519 keys supported');
        process.exit(1);
    }
    const keypair = Ed25519Keypair.fromSecretKey(secretKey);
    const address = keypair.getPublicKey().toSuiAddress();
    console.log('Solver Address:', address);

    // Create client
    const rpcUrl = process.env.RPC_URL || 'https://fullnode.testnet.sui.io:443';
    console.log('RPC:', rpcUrl.substring(0, 50) + '...');
    const client = new SuiClient({ url: rpcUrl });

    // Check balances
    console.log('\nChecking balances...');
    const deepBalance = await client.getBalance({ 
        owner: address, 
        coinType: DEEP_TYPE 
    });
    console.log('DEEP Balance:', Number(deepBalance.totalBalance) / 1e6, 'DEEP');

    const usdcBalance = await client.getBalance({ 
        owner: address, 
        coinType: DBUSDC_TYPE 
    });
    console.log('DBUSDC Balance:', Number(usdcBalance.totalBalance) / 1e6, 'DBUSDC');

    // Amount to swap (50 DEEP)
    const swapAmount = 50_000_000n; // 50 DEEP (6 decimals)
    
    if (BigInt(deepBalance.totalBalance) < swapAmount) {
        console.error('\nNot enough DEEP! Need at least 50 DEEP to swap.');
        process.exit(1);
    }

    console.log('\nInitializing DeepBook client...');
    
    try {
        // Initialize DeepBook client
        const dbClient = new DeepBookClient({
            address: address,
            env: 'testnet',
            client: client,
        });

        console.log('Creating swap transaction...');
        
        // Use the SDK to create the swap
        // The SDK handles all the complexity
        const tx = await dbClient.swap({
            poolKey: 'DEEP_DBUSDC',
            amount: swapAmount,
            minOut: 0n, // Accept any output for now
            deepAmount: 0n, // No extra DEEP for fees (whitelisted pool)
        });

        console.log('Executing swap...');
        
        const result = await client.signAndExecuteTransaction({
            signer: keypair,
            transaction: tx,
            options: {
                showEffects: true,
                showBalanceChanges: true,
            },
        });

        console.log('\n=== SWAP RESULT ===');
        console.log('Transaction:', result.digest);
        console.log('Status:', result.effects?.status?.status);
        
        if (result.balanceChanges) {
            console.log('\nBalance Changes:');
            for (const change of result.balanceChanges) {
                const type = change.coinType.split('::').pop();
                const decimals = type === 'SUI' ? 9 : 6;
                const amount = Number(change.amount) / Math.pow(10, decimals);
                console.log(`  ${type}: ${amount > 0 ? '+' : ''}${amount.toFixed(4)}`);
            }
        }

        console.log(`\nView: https://suiscan.xyz/testnet/tx/${result.digest}`);

        // Check new balance
        const newUsdcBalance = await client.getBalance({ 
            owner: address, 
            coinType: DBUSDC_TYPE 
        });
        console.log('\nNew DBUSDC Balance:', Number(newUsdcBalance.totalBalance) / 1e6, 'DBUSDC');
        
    } catch (error: any) {
        console.error('\nSwap failed:', error.message || error);
        
        // Fallback: Try contacting @tonylee08 for test tokens
        console.log('\n=== ALTERNATIVE ===');
        console.log('The DeepBook DEEP/DBUSDC pool may have liquidity issues.');
        console.log('As per the testnet docs:');
        console.log('  "Please reach out to @tonylee08 on TG for test DBUSDC"');
        console.log('\nOnce you have DBUSDC, the solver can fill SUI->USDC intents!');
    }
}

main().catch(console.error);
