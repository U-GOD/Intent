/**
 * Manual Fill Script - Uses Executor to fill intents
 * 
 * Usage: 
 *   npx tsx src/manual-fill.ts <INTENT_ID>
 */

import { SuiClient } from '@mysten/sui.js/client';
import { decodeSuiPrivateKey } from '@mysten/sui.js/cryptography';
import { Executor } from './executor.js';
import { config } from './config.js';
import * as fs from 'fs';

const log = (msg: string) => {
  console.log(msg);
  fs.appendFileSync('debug_log.txt', msg + '\n');
};

const RPC_URL = process.env.RPC_URL || 'https://rpc-testnet.suiscan.xyz/';

async function main() {
    // 1. Try command line arg (argv[2])
    // 2. Try env var INTENT_ID
    const intentId = process.argv[2] || process.env.INTENT_ID;
    
    if (!intentId) {
        console.error('Usage: npx tsx src/manual-fill.ts <INTENT_ID>');
        console.error('   Or: INTENT_ID=0x... pnpm run fill');
        process.exit(1);
    }

    console.log('\n=== SuiIntents Manual Fill ===\n');
    console.log('Intent ID:', intentId);

    // Load private key
    const privateKey = process.env.SUI_PRIVATE_KEY;
    if (!privateKey) {
        console.error('Error: SUI_PRIVATE_KEY not set in .env');
        process.exit(1);
    }

    // Create client and executor
    const client = new SuiClient({ url: RPC_URL });
    const executor = new Executor(client);
    
    // Check if executor is ready
    if (!executor.isReady()) {
        console.error('Executor not ready (check private key)');
        process.exit(1);
    }
    
    console.log('Solver Address:', executor.getAddress());

    // Fetch intent details
    console.log('\nFetching intent details...');
    try {
        const intentObj = await client.getObject({
            id: intentId,
            options: { showContent: true, showType: true }
        });

        if (!intentObj.data || !intentObj.data.content) {
            console.error('Intent not found or invalid! It may have already been filled or cancelled.');
            process.exit(1);
        }

        const content = intentObj.data.content as any;
        const fields = content.fields;
        
        console.log('Intent Type:', intentObj.data.type);
        console.log('Input:', fields.input_amount);
        console.log('Min Output:', fields.min_output);
        console.log('Creator:', fields.creator);
        
        // Hardcoded types for demo reliability for SUI->DEEP
        const inputType = '0x0000000000000000000000000000000000000000000000000000000000000002::sui::SUI';
        const outputType = '0x36dbef866a1d62bf7328989a10fb2f07d769f4ee587c0de4a0a256e57e0a58a8::deep::DEEP';
        
        console.log(`\nForcing Types for Demo: ${inputType} -> ${outputType}`);

        const intentEvent = {
            intentId: intentId,
            creator: fields.creator,
            inputAmount: BigInt(fields.input_amount),
            inputType: inputType,
            outputType: outputType,
            minOutput: BigInt(fields.min_output),
            deadline: BigInt(fields.deadline),
             startRound: 0n,
             decayRate: 0n
        };
        
        console.log(`\nAttempting to fill...`);
        
        // Determine pool ID based on pair
        let poolId = config.deepbook.pools.SUI_DBUSDC; 
        if (
            (inputType.includes('SUI') && outputType.includes('DEEP')) || 
            (inputType.includes('DEEP') && outputType.includes('SUI'))
        ) {
            poolId = config.deepbook.pools.DEEP_SUI;
        }
        
        console.log('Using Pool Logic:', poolId);
        
        const result = await executor.fillIntent(
            intentEvent as any,
            poolId,
            BigInt(fields.min_output)
        );
        
        if (result.success) {
            console.log('\n[SUCCESS] Intent Filled Successfully!');
            console.log('Digest:', result.digest);
            console.log(`Explorer: https://suiscan.xyz/testnet/tx/${result.digest}`);
        } else {
            console.error('\n[FAILED] Fill Failed:', result.error);
        }

    } catch (error: any) {
        log('Error: ' + (error.stack || error.message || error));
    }
}

main().catch(err => log('Fatal: ' + err));
