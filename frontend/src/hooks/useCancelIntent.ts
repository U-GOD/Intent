import { useCurrentAccount, useSignAndExecuteTransaction } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';
import { CONTRACTS } from '../config/contracts';

export function useCancelIntent() {
  const currentAccount = useCurrentAccount();
  const { mutate: signAndExecute, isPending } = useSignAndExecuteTransaction();

  const cancelIntent = (
    intentId: string,
    inputType: string,
    onSuccess?: (digest: string) => void,
    onError?: (error: Error) => void
  ) => {
    if (!currentAccount) {
      onError?.(new Error('Wallet not connected'));
      return;
    }

    try {
      const tx = new Transaction();

      tx.moveCall({
        target: `${CONTRACTS.PACKAGE_ID}::intent::cancel_intent`,
        arguments: [
          tx.object(intentId),
          tx.object('0x6'), // Clock
        ],
        typeArguments: [inputType],
      });

      console.log('Cancelling intent:', intentId);

      signAndExecute(
        { transaction: tx },
        {
          onSuccess: (result) => {
            console.log('Intent cancelled:', result);
            onSuccess?.(result.digest);
          },
          onError: (error) => {
            console.error('Cancel failed:', error);
            onError?.(error);
          },
        },
      );
    } catch (e) {
      console.error('Error cancelling intent:', e);
      onError?.(e as Error);
    }
  };

  return { cancelIntent, isPending };
}
