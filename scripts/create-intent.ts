/**
 * Create Intent Script - Test creating an intent on testnet
 */

import { SuiClient, getFullnodeUrl } from '@mysten/sui.js/client';
import { Ed25519Keypair } from '@mysten/sui.js/keypairs/ed25519';
import { TransactionBlock } from '@mysten/sui.js/transactions';
import { decodeSuiPrivateKey } from '@mysten/sui.js/cryptography';

const PACKAGE_ID = '0x0f794d721f36b929ccdc62b4d5e556505064938a95f554c4fd1b86f20e5b3233';
const REGISTRY_ID = '0x7f6c8a5af6cd8109b20eb8605398f9094f6749498413b65f8229ae062e5ca469';
const DBUSDC_TYPE = '0xf7152c05930480cd740d7311b5b8b45c6f488e3a53a11c3f74a6fac36a52e0d7::DBUSDC::DBUSDC';

async function main() {
    const privateKey = process.env.SUI_PRIVATE_KEY;
    if (!privateKey) {
        console.log('Set SUI_PRIVATE_KEY environment variable');
        console.log('Get it with: sui keytool export --key-identity YOUR_ADDRESS');
        process.exit(1);
    }

    const { secretKey } = decodeSuiPrivateKey(privateKey);
    const keypair = Ed25519Keypair.fromSecretKey(secretKey);
    const address = keypair.getPublicKey().toSuiAddress();

    const client = new SuiClient({ url: getFullnodeUrl('testnet') });
    
    console.log('Address:', address);
    
    // Get a coin to use
    const coins = await client.getCoins({ owner: address, coinType: '0x2::sui::SUI' });
    if (coins.data.length === 0) {
        console.log('No SUI coins found');
        process.exit(1);
    }
    
    const coinToUse = coins.data[0];
    console.log('Using coin:', coinToUse.coinObjectId);
    console.log('Coin balance:', Number(coinToUse.balance) / 1e9, 'SUI');

    const tx = new TransactionBlock();
    
    // Split 0.1 SUI for the intent
    const [intentCoin] = tx.splitCoins(tx.gas, [tx.pure(100_000_000)]); // 0.1 SUI
    
    // Create intent: swap SUI for DBUSDC
    tx.moveCall({
        target: `${PACKAGE_ID}::intent::create_intent`,
        arguments: [
            tx.object(REGISTRY_ID),
            intentCoin,
            tx.pure(10500),      // start_rate: 1.05x (105%)
            tx.pure(9500),       // end_rate: 0.95x (95%)
            tx.pure(3600000),    // duration: 1 hour in ms
            tx.object('0x6'),    // Clock
        ],
        typeArguments: ['0x2::sui::SUI', DBUSDC_TYPE],
    });

    console.log('Creating intent...');
    
    const result = await client.signAndExecuteTransactionBlock({
        signer: keypair,
        transactionBlock: tx,
        options: { showEffects: true, showEvents: true },
    });

    console.log('Transaction:', result.digest);
    console.log('Status:', result.effects?.status?.status);
    
    if (result.events && result.events.length > 0) {
        console.log('Events:', JSON.stringify(result.events, null, 2));
    }
}

main().catch(console.error);
