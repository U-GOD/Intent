/**
 * List User Intents Script - Find all intents created by you
 * 
 * Usage: pnpm run list
 */

import { SuiClient } from '@mysten/sui.js/client';
import { Ed25519Keypair } from '@mysten/sui.js/keypairs/ed25519';
import { decodeSuiPrivateKey } from '@mysten/sui.js/cryptography';
import { config } from './config.js';

const RPC_URL = 'https://rpc-testnet.suiscan.xyz/';

async function main() {
    console.log('\n=== SuiIntents - List Your Intents ===\n');

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
    console.log('RPC:', RPC_URL);
    console.log('Package:', config.packageId);

    // Query intent objects directly owned by sender's transactions
    // Since event indexing is unreliable on public RPCs
    console.log('\nScanning for intents...');
    
    try {
        // Query recent transactions from this sender
        const txs = await client.queryTransactionBlocks({
            filter: { FromAddress: address },
            options: { showEffects: true, showObjectChanges: true },
            limit: 20,
            order: 'descending'
        });

        console.log(`Scanned ${txs.data.length} recent transactions`);
        let found = 0;

        for (const tx of txs.data) {
            // Check if it was a create_intent call
            const changes = tx.objectChanges || [];
            for (const change of changes) {
                if (change.type === 'created' && change.objectType.includes('::intent::Intent<')) {
                    const intentId = change.objectId;
                    
                    // Verify if object still exists and is not cancelled
                    try {
                        const obj = await client.getObject({ 
                            id: intentId,
                            options: { showContent: true } 
                        });
                        
                        if (obj.data) {
                            found++;
                            const type = obj.data.type || '';
                            const inputType = type.split('<')[1]?.split('>')[0] || 'Unknown';
                            const content = obj.data.content as any;
                            const amount = content?.fields?.input_amount || '0';
                            
                            console.log('\n--- ACTIVE INTENT FOUND ---');
                            console.log('ID:', intentId);
                            console.log('Input:', Number(amount)/1e9, 'SUI');
                            console.log(`Cancel Command: INTENT_ID=${intentId} pnpm run cancel`);
                        }
                    } catch (e) {
                        // Object deleted likely means cancelled/filled
                    }
                }
            }
        }

        if (found === 0) {
            console.log('\nNo ACTIVE intents found in recent transactions.');
            console.log('They may have been already cancelled or filled.');
        } else {
            console.log(`\nFound ${found} active intents.`);
        }
    } catch (error) {
        console.error('Error scanning transactions:', error);
    }
}

main().catch(console.error);
