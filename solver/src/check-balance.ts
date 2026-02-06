import { SuiClient } from '@mysten/sui.js/client';
import { Ed25519Keypair } from '@mysten/sui.js/keypairs/ed25519';
import { decodeSuiPrivateKey } from '@mysten/sui.js/cryptography';
import { config } from './config.js';

async function main() {
    console.log('\n=== DIAGNOSTIC: Wallet & Fund Tracer ===');
    const client = new SuiClient({ url: process.env.RPC_URL || 'https://rpc-testnet.suiscan.xyz/' });

    // 1. Solver Wallet (from .env)
    const envKey = process.env.SUI_PRIVATE_KEY;
    if (!envKey) throw new Error("Missing SUI_PRIVATE_KEY in .env");
    const solverKeypair = Ed25519Keypair.fromSecretKey(decodeSuiPrivateKey(envKey).secretKey);
    const solverAddress = solverKeypair.getPublicKey().toSuiAddress();
    
    console.log(`\n[SOLVER WALLET]`);
    console.log(`Address: ${solverAddress}`);
    await logBalance(client, solverAddress);

    // 2. Suiet Wallet (User Provided)
    const suietKeyStr = "suiprivkey1qr4zsmywwfduzx5jqtx3ckftp0wlm7fky03kucveqta4gna4c8f6qqyz5z0";
    try {
        const suietKeypair = Ed25519Keypair.fromSecretKey(decodeSuiPrivateKey(suietKeyStr).secretKey);
        const suietAddress = suietKeypair.getPublicKey().toSuiAddress();
        
        console.log(`\n[SUIET WALLET]`);
        console.log(`Address: ${suietAddress}`);
        await logBalance(client, suietAddress);
    } catch (e: any) {
        console.log("Error decoding Suiet key:", e.message);
    }
}

async function logBalance(client: SuiClient, address: string) {
    const sui = await client.getBalance({ owner: address, coinType: '0x2::sui::SUI' });
    const deepCoins = await client.getCoins({ owner: address, coinType: config.coins.DEEP });
    const deepTotal = deepCoins.data.reduce((sum, c) => sum + BigInt(c.balance), 0n);
    
    console.log(`- SUI: ${Number(sui.totalBalance)/1e9}`);
    console.log(`- DEEP: ${Number(deepTotal)/1e6} (Objects: ${deepCoins.data.length})`);
}

main().catch(console.error);
