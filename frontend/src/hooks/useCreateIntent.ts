import { useSuiClient, useCurrentAccount, useSignAndExecuteTransaction } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';
import { CONTRACTS } from '../config/contracts';
import type { IntentData } from '../components/SwapCard';
import type { Token } from '../config/tokens';

export function useCreateIntent() {
  const suiClient = useSuiClient();
  const currentAccount = useCurrentAccount();
  const { mutate: signAndExecute, isPending } = useSignAndExecuteTransaction();

  const createIntent = (
    data: IntentData, 
    sellToken: Token, 
    buyToken: Token,
    onSuccess?: (digest: string) => void,
    onError?: (error: Error) => void
  ) => {
    if (!currentAccount) {
      onError?.(new Error('Wallet not connected'));
      return;
    }

    try {
      const tx = new Transaction();

      // Convert amounts to smallest unit (MIST for SUI)
      const inputAmountMist = BigInt(
        Math.floor(parseFloat(data.inputAmount) * Math.pow(10, sellToken.decimals))
      );
      
      // Calculate min output based on slippage
      const outputVal = parseFloat(data.outputAmount || data.inputAmount);
      const minOutputMist = BigInt(
        Math.floor(outputVal * (1 - parseFloat(data.slippage) / 100) * Math.pow(10, buyToken.decimals))
      );

      // Parse expiration to milliseconds
      const expirationMap: Record<string, number> = {
        '5m': 5 * 60 * 1000,
        '15m': 15 * 60 * 1000,
        '1h': 60 * 60 * 1000,
        '2h': 2 * 60 * 60 * 1000,
        '6h': 6 * 60 * 60 * 1000,
        '12h': 12 * 60 * 60 * 1000,
        '1d': 24 * 60 * 60 * 1000,
        '3d': 3 * 24 * 60 * 60 * 1000,
        '7d': 7 * 24 * 60 * 60 * 1000,
      };
      const durationMs = expirationMap[data.expiration] || 15 * 60 * 1000;

      // Start rate (for Dutch auction, use min_output as start rate for simplicity)
      const startRate = minOutputMist;

      // Split coin from gas (only works for SUI)
      let inputCoin;
      if (sellToken.type === '0x2::sui::SUI') {
        [inputCoin] = tx.splitCoins(tx.gas, [inputAmountMist]);
      } else {
        onError?.(new Error('Only SUI as input token is supported in this demo'));
        return;
      }

      // Call create_intent<T, U>
      tx.moveCall({
        target: `${CONTRACTS.PACKAGE_ID}::${CONTRACTS.MODULES.INTENT}::create_intent`,
        arguments: [
          tx.object(CONTRACTS.REGISTRY_ID),  // registry: &mut IntentRegistry
          inputCoin,                          // input_coin: Coin<T>
          tx.pure.u64(minOutputMist),         // min_output: u64
          tx.pure.u64(startRate),             // start_rate: u64
          tx.pure.u64(durationMs),            // duration_ms: u64
          tx.object('0x6'),                   // clock: &Clock
        ],
        typeArguments: [sellToken.type, buyToken.type],
      });

      console.log('Building transaction for create_intent...');
      console.log('Input:', data.inputAmount, sellToken.symbol, '=', inputAmountMist.toString(), 'MIST');
      console.log('Min Output:', minOutputMist.toString(), buyToken.symbol);
      console.log('Duration:', durationMs, 'ms');

      signAndExecute(
        { transaction: tx },
        {
          onSuccess: (result) => {
            console.log('Transaction successful:', result);
            onSuccess?.(result.digest);
          },
          onError: (error) => {
            console.error('Transaction failed:', error);
            onError?.(error);
          },
        },
      );
    } catch (e) {
      console.error('Error creating intent:', e);
      onError?.(e as Error);
    }
  };

  return { createIntent, isPending };
}
