/**
 * Query Intent Objects Directly
 * Instead of querying events, we query the objects created
 */

import { SuiClient } from '@mysten/sui.js/client';
import { config } from './config.js';

async function main() {
    console.log('\n=== QUERY INTENT OBJECTS DIRECTLY ===\n');
    
    const rpcUrl = process.env.RPC_URL || 'https://rpc-testnet.suiscan.xyz/';
    console.log('RPC:', rpcUrl.substring(0, 50) + '...');
    
    const client = new SuiClient({ url: rpcUrl });
    
    // Get the user's Suiet wallet address from the screenshot
    const suietWallet = '0x16775bf7e1707acd8689f6b5393d899';
    
    console.log('\n--- Checking Registry State ---');
    console.log('Registry ID:', config.registryId);
    
    try {
        const registry = await client.getObject({
            id: config.registryId,
            options: { showContent: true }
        });
        
        if (registry.data?.content && 'fields' in registry.data.content) {
            const fields = registry.data.content.fields as any;
            console.log('Total Intents:', fields.total_intents);
            console.log('Filled Intents:', fields.filled_intents);
        }
    } catch (e) {
        console.log('Could not query registry');
    }

    // Query objects owned by the contract package that are of type Intent
    console.log('\n--- Querying Intent Objects by Type ---');
    const intentType = `${config.packageId}::intent::Intent`;
    console.log('Searching for type:', intentType);
    
    try {
        // Query all objects of Intent type (they're shared/owned objects)
        const objects = await client.getOwnedObjects({
            owner: config.registryId,
            options: { showContent: true, showType: true },
        });
        
        console.log('Objects found:', objects.data.length);
        
        for (const obj of objects.data) {
            if (obj.data?.type?.includes('Intent')) {
                console.log('---');
                console.log('Intent Object:', obj.data.objectId);
                console.log('Type:', obj.data.type);
            }
        }
    } catch (e) {
        console.log('Query failed:', (e as Error).message);
    }

    // Try a different approach - query by sender's transactions
    console.log('\n--- Alternative: Check Transaction History ---');
    console.log('To find your intent IDs, look at your transaction details on SuiScan:');
    console.log('1. Go to: https://suiscan.xyz/testnet/account/YOUR_SUIET_ADDRESS');
    console.log('2. Click on each create_intent transaction');
    console.log('3. Look for "Object Created" in the transaction effects');
    console.log('4. Copy the Intent object ID');
    console.log('5. Use: INTENT_ID=<object_id> pnpm run cancel');
}

main().catch(console.error);
