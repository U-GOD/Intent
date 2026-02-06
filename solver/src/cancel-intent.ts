/**
 * Cancel Intent Script - Recover locked funds
 * 
 * Usage: INTENT_ID=0x... pnpm run cancel
 */

import { SuiClient } from '@mysten/sui.js/client';
import { Ed25519Keypair } from '@mysten/sui.js/keypairs/ed25519';
import { TransactionBlock } from '@mysten/sui.js/transactions';
import { decodeSuiPrivateKey } from '@mysten/sui.js/cryptography';
import { config } from './config.js';

const RPC_URL = 'https://rpc-testnet.suiscan.xyz/';

async function main() {
    const intentId = process.env.INTENT_ID;
    if (!intentId) {
        console.error('Usage: INTENT_ID=0x... pnpm run cancel');
        console.log('\nTo find your intent IDs, check your transaction history on:');
        console.log('https://suiscan.xyz/testnet/account/YOUR_ADDRESS');
        process.exit(1);
    }

    console.log('\n=== SuiIntents Cancel & Refund ===\n');
    console.log('Intent ID:', intentId);

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
    console.log('Your Address:', address);

    // Create client
    const client = new SuiClient({ url: RPC_URL });

    // Get intent object to check it exists
    console.log('\nFetching intent...');
    
    try {
        const intentObj = await client.getObject({
            id: intentId,
            options: { showContent: true, showType: true }
        });

        if (!intentObj.data) {
            console.error('Intent not found! It may have already been filled or cancelled.');
            process.exit(1);
        }

        console.log('Intent found!');
        const intentType = intentObj.data.type || '';
        console.log('Type:', intentType);

        // Extract the generic type parameter (e.g., 0x2::sui::SUI)
        const typeMatch = intentType.match(/Intent<(.+)>/);
        const inputType = typeMatch ? typeMatch[1] : '0x2::sui::SUI';
        console.log('Input Token Type:', inputType);

        const content = intentObj.data.content as any;
        if (content?.fields) {
            console.log('Creator:', content.fields.creator);
            console.log('Input Amount:', Number(content.fields.input_amount) / 1e9, 'SUI');
            
            // Check if caller is the creator
            if (content.fields.creator !== address) {
                console.error('\nError: You are not the creator of this intent!');
                console.error('Only the creator can cancel an intent.');
                process.exit(1);
            }
        }

        // Build cancel transaction
        console.log('\nBuilding cancel transaction...');
        const tx = new TransactionBlock();
        
        tx.moveCall({
            target: `${config.packageId}::intent::cancel_intent`,
            arguments: [
                tx.object(intentId),
                tx.object('0x6'), // Clock
            ],
            typeArguments: [inputType],
        });

        console.log('Executing cancel...');
        const result = await client.signAndExecuteTransactionBlock({
            signer: keypair,
            transactionBlock: tx,
            options: {
                showEffects: true,
                showEvents: true,
            },
        });

        console.log('\n=== SUCCESS! ===');
        console.log('Transaction Digest:', result.digest);
        console.log('Status:', result.effects?.status?.status);
        console.log('\nYour tokens have been refunded!');
        console.log(`View on explorer: https://suiscan.xyz/testnet/tx/${result.digest}`);

    } catch (error) {
        console.error('\nError:', error);
        console.log('\nIf you see "E_NOT_CREATOR", make sure you\'re using the same wallet that created the intent.');
        console.log('If you see "ObjectNotFound", the intent may already be cancelled or filled.');
    }
}

main().catch(console.error);
