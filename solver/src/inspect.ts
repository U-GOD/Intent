import { SuiClient } from '@mysten/sui.js/client';

const RPC_URL = process.env.RPC_URL || 'https://rpc-testnet.suiscan.xyz/';
const INTENT_ID = '0x3360fd2daec4d27772fb0058c92d2d6ebb8de540aacb441ea692f77a04eb72f3';

async function main() {
    const client = new SuiClient({ url: RPC_URL });
    const obj = await client.getObject({
        id: INTENT_ID,
        options: { showContent: true }
    });
    
    if (obj.data?.content && 'fields' in obj.data.content) {
        console.log(JSON.stringify(obj.data.content.fields, null, 2));
    } else {
        console.log('Not found or invalid content');
    }
}

main().catch(console.error);
