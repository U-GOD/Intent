/**
 * Register Solver Script
 * 
 * Registers the solver on-chain by staking SUI tokens.
 * This is required before the solver can fill intents.
 * 
 * Usage: SUI_PRIVATE_KEY=suiprivkey1... pnpm run register
 */

import { SuiClient, getFullnodeUrl } from '@mysten/sui.js/client';
import { Ed25519Keypair } from '@mysten/sui.js/keypairs/ed25519';
import { TransactionBlock } from '@mysten/sui.js/transactions';
import { decodeSuiPrivateKey } from '@mysten/sui.js/cryptography';

// Contract addresses (testnet deployment - V2)
const PACKAGE_ID = '0x746214336352144bc6e048150ce2e9fef183c04671ebae8342f98bc4a77a484f';

// Stake amount: 0.5 SUI for testnet (PRODUCTION: 100 SUI)
const STAKE_AMOUNT = 500_000_000; // 0.5 SUI in MIST

async function main() {
    // Load private key from environment
    const privateKey = process.env.SUI_PRIVATE_KEY;
    if (!privateKey) {
        console.log('Error: Set SUI_PRIVATE_KEY environment variable');
        console.log('   Get it with: sui keytool export --key-identity YOUR_ADDRESS');
        process.exit(1);
    }

    // Initialize keypair and client
    const { secretKey } = decodeSuiPrivateKey(privateKey);
    const keypair = Ed25519Keypair.fromSecretKey(secretKey);
    const address = keypair.getPublicKey().toSuiAddress();
    const client = new SuiClient({ url: getFullnodeUrl('testnet') });
    
    console.log('╔════════════════════════════════════════════╗');
    console.log('║       SuiIntents Solver Registration       ║');
    console.log('╚════════════════════════════════════════════╝');
    console.log('');
    console.log('Solver Address:', address);
    console.log('Stake Amount:  ', STAKE_AMOUNT / 1e9, 'SUI');
    console.log('');

    // Check balance
    const balance = await client.getBalance({ owner: address });
    const suiBalance = Number(balance.totalBalance) / 1e9;
    console.log('Current Balance:', suiBalance.toFixed(4), 'SUI');
    
    if (Number(balance.totalBalance) < STAKE_AMOUNT) {
        console.log(' Insufficient balance. Need at least', STAKE_AMOUNT / 1e9, 'SUI');
        process.exit(1);
    }

    // Build registration transaction
    const tx = new TransactionBlock();
    
    // Split stake amount from gas coin
    const [stakeCoin] = tx.splitCoins(tx.gas, [tx.pure(STAKE_AMOUNT)]);
    
    // Call register function
    tx.moveCall({
        target: `${PACKAGE_ID}::solver_registry::register`,
        arguments: [stakeCoin],
    });

    console.log('Registering solver...');
    
    // Execute transaction
    const result = await client.signAndExecuteTransactionBlock({
        signer: keypair,
        transactionBlock: tx,
        options: {
            showEffects: true,
            showEvents: true,
            showObjectChanges: true,
        },
    });

    console.log('');
    console.log('Transaction:', result.digest);
    console.log('Status:', result.effects?.status?.status);
    
    // Find the created Solver object
    if (result.objectChanges) {
        for (const change of result.objectChanges) {
            if (change.type === 'created' && change.objectType?.includes('Solver')) {
                console.log('');
                console.log(' Solver Registered Successfully!');
                console.log('   Solver ID:', change.objectId);
                console.log('');
                console.log('Save this Solver ID for filling intents.');
            }
        }
    }
    
    // Show event
    if (result.events && result.events.length > 0) {
        const event = result.events[0];
        if (event.type.includes('SolverRegistered')) {
            console.log('');
            console.log('Event:', JSON.stringify(event.parsedJson, null, 2));
        }
    }
}

main().catch(console.error);
