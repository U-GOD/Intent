/**
 * Check DeepBook Pool State
 * 
 * Usage: pnpm run check-pools
 */

import { SuiClient } from '@mysten/sui.js/client';
import { DeepBookClient } from '@mysten/deepbook-v3';

// Pool IDs
const DEEP_DBUSDC_POOL = '0xe86b991f8632217505fd859445f9803967ac84a9d4a1219065bf191fcb74b622';
const SUI_DBUSDC_POOL = '0x1c19362ca52b8ffd7a33cee805a67d40f31e6ba303753fd3a4cfdfacea7163a5';
const DEEP_SUI_POOL = '0x48c95963e9eac37a316b7ae04a0deb761bcdcc2b67912374d6036e7f0e9bae9f';

async function main() {
    console.log('\n=== Check DeepBook Pools ===\n');

    const rpcUrl = process.env.RPC_URL || 'https://fullnode.testnet.sui.io:443';
    console.log('RPC:', rpcUrl.substring(0, 50) + '...');
    const client = new SuiClient({ url: rpcUrl });
    
    // Check DEEP/SUI Pool (Most likely to be liquid)
    console.log('\n--- Checking DEEP/SUI Pool ---');
    console.log('ID:', DEEP_SUI_POOL);
    try {
        const pool = await client.getObject({
            id: DEEP_SUI_POOL,
            options: { showContent: true }
        });
        
        if (pool.data?.content && 'fields' in pool.data.content) {
            const fields = pool.data.content.fields as any;
            console.log('Pool found!');
            console.log('Bids (Buy DEEP with SUI):', fields.bids);
            console.log('Asks (Sell DEEP for SUI):', fields.asks);
        } else {
            console.log('Pool object structure unknown or not found');
        }
    } catch (e) {
        console.error('Error fetching DEEP/SUI:', (e as Error).message);
    }

    console.log('\n--- Checking SUI/DBUSDC Pool ---');
    console.log('ID:', SUI_DBUSDC_POOL);
    try {
        const pool = await client.getObject({
            id: SUI_DBUSDC_POOL,
            options: { showContent: true }
        });
        
        if (pool.data?.content && 'fields' in pool.data.content) {
            const fields = pool.data.content.fields as any;
            console.log('Pool found!');
            console.log('Bids (Buy Orders) Tree:', fields.bids);
            console.log('Asks (Sell Orders) Tree:', fields.asks);
        }
    } catch (e) {
        console.error('Error fetching SUI/DBUSDC:', (e as Error).message);
    }
}

main().catch(console.error);
