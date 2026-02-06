import { SuiClient } from '@mysten/sui.js/client';

const RPC_URL = process.env.RPC_URL || 'https://rpc-testnet.suiscan.xyz/';
const TX_ID = '5UkJhZ5DJbCEcXreRuWXsjjfrE8MzigECgT6U';

async function main() {
    console.log(`Analyzing Transaction: ${TX_ID}`);
    
    const client = new SuiClient({ url: RPC_URL });
    const tx = await client.getTransactionBlock({
        digest: TX_ID,
        options: {
            showEffects: true,
            showBalanceChanges: true,
            showObjectChanges: true,
            showInput: true
        }
    });

    console.log('\n--- Balance Changes ---');
    if (tx.balanceChanges) {
        tx.balanceChanges.forEach(bc => {
            const coin = bc.coinType.split('::').pop();
            const amount = BigInt(bc.amount);
            // Convert MIST/Base units to readable
            const readable = Number(amount) / (coin === 'SUI' ? 1e9 : 1e6); 
            console.log(`Owner: ${bc.owner}`);
            if (typeof bc.owner === 'object') console.log(`  (Object: ${JSON.stringify(bc.owner)})`);
            console.log(`  ${coin}: ${amount > 0 ? '+' : ''}${readable} (${amount})`);
        });
    }

    console.log('\n--- Object Changes (Deep only) ---');
    if (tx.objectChanges) {
        tx.objectChanges.forEach(oc => {
            if (oc.type === 'mutated' || oc.type === 'created' || oc.type === 'transferred') {
                 if (oc.objectType.includes('deep::DEEP')) {
                     console.log(`${oc.type.toUpperCase()} DEEP Object: ${oc.objectId}`);
                     // We can't see the value/balance here easily without fetching object, 
                     // but balanceChanges is the source of truth.
                 }
            }
        });
    }
}

main().catch(console.error);
