/**
 * DeepBook V3 Pool Query Script
 */

import { SuiClient, getFullnodeUrl } from '@mysten/sui.js/client';

const NETWORK = 'testnet';
const RPC_URL = getFullnodeUrl(NETWORK);
const suiClient = new SuiClient({ url: RPC_URL });

async function main() {
    console.log('DeepBook V3 Pool Query Tool');
    console.log('================================\n');
    console.log('Network:', NETWORK);
    console.log('RPC:', RPC_URL, '\n');
    
    try {
        const chainId = await suiClient.getChainIdentifier();
        console.log('[OK] Connected to chain:', chainId);
        
        const checkpoint = await suiClient.getLatestCheckpointSequenceNumber();
        console.log('[OK] Latest checkpoint:', checkpoint);
        
        console.log('\nNote: To query DeepBook pools, use the DeepBook Indexer API');
        console.log('or direct RPC calls to specific pool objects.');
        console.log('See: https://docs.sui.io/standards/deepbookv3');
        
    } catch (error) {
        console.error('Error connecting to Sui:', error);
    }
    
    console.log('\nQuery complete.');
}

main().catch(console.error);
