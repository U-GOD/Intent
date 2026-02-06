/**
 * Full Event Debug - Query ALL IntentCreated events
 * Uses QuickNode RPC from environment
 */

import { SuiClient } from '@mysten/sui.js/client';
import { config } from './config.js';

async function main() {
    console.log('\n=== FULL EVENT DEBUG (QuickNode) ===\n');
    
    const rpcUrl = process.env.RPC_URL || 'https://rpc-testnet.suiscan.xyz/';
    console.log('RPC:', rpcUrl.substring(0, 50) + '...');
    
    const client = new SuiClient({ url: rpcUrl });
    
    // Test RPC
    const chainId = await client.getChainIdentifier();
    console.log('Chain ID:', chainId);
    console.log('');

    const packageId = config.packageId;
    console.log('Package ID:', packageId);

    const eventType = `${packageId}::intent::IntentCreated`;
    console.log('Event Type:', eventType);
    console.log('');

    try {
        console.log('Querying events...');
        const events = await client.queryEvents({
            query: { MoveEventType: eventType },
            limit: 50,
            order: 'descending',
        });

        console.log('Total events found:', events.data.length);
        console.log('');

        if (events.data.length > 0) {
            console.log('=== INTENTS FOUND ===\n');
            for (let i = 0; i < events.data.length; i++) {
                const event = events.data[i];
                const parsed = event.parsedJson as any;
                console.log(`--- Intent ${i + 1} ---`);
                console.log('Intent ID:', parsed.intent_id);
                console.log('Creator:', parsed.creator);
                console.log('Input:', Number(parsed.input_amount) / 1e9, 'SUI');
                console.log('Min Output:', parsed.min_output);
                console.log('');
                
                // Check if intent still exists
                try {
                    const obj = await client.getObject({ id: parsed.intent_id });
                    if (obj.data) {
                        console.log('Status: ACTIVE - Can be cancelled!');
                        console.log(`Cancel: INTENT_ID=${parsed.intent_id} pnpm run cancel`);
                    } else {
                        console.log('Status: Already filled or cancelled');
                    }
                } catch {
                    console.log('Status: Already filled or cancelled');
                }
                console.log('');
            }
        } else {
            console.log('No IntentCreated events found.');
            console.log('');
            console.log('Possible reasons:');
            console.log('1. Events exist but different package ID was used');
            console.log('2. RPC is not indexing events properly');
            console.log('3. No intents created with this contract');
        }

    } catch (error) {
        console.error('Error:', error);
    }
}

main();
