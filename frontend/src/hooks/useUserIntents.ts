import { useSuiClient, useCurrentAccount } from '@mysten/dapp-kit';
import { useEffect, useState, useCallback } from 'react';
import { CONTRACTS } from '../config/contracts';

export interface UserIntent {
  intentId: string;
  inputType: string;
  inputAmount: bigint;
  outputType: string;
  minOutput: bigint;
  deadline: bigint;
  status: number;
}

export function useUserIntents() {
  const client = useSuiClient();
  const currentAccount = useCurrentAccount();
  const [intents, setIntents] = useState<UserIntent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchIntents = useCallback(async () => {
    if (!currentAccount) {
      setIntents([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Query IntentCreated events for this user
      const events = await client.queryEvents({
        query: {
          MoveEventType: `${CONTRACTS.PACKAGE_ID}::intent::IntentCreated`,
        },
        limit: 50,
        order: 'descending',
      });

      // Filter events by creator (current user)
      const userEvents = events.data.filter((event) => {
        const parsed = event.parsedJson as any;
        return parsed.creator === currentAccount.address;
      });

      // Parse events into UserIntent objects
      const parsedIntents: UserIntent[] = userEvents.map((event) => {
        const parsed = event.parsedJson as any;
        return {
          intentId: parsed.intent_id,
          inputType: parsed.input_type?.name || '0x2::sui::SUI',
          inputAmount: BigInt(parsed.input_amount || 0),
          outputType: parsed.output_type?.name || '',
          minOutput: BigInt(parsed.min_output || 0),
          deadline: BigInt(parsed.deadline || 0),
          status: 0, // We'll need to check on-chain status
        };
      });

      setIntents(parsedIntents);
    } catch (e) {
      console.error('Error fetching intents:', e);
      setError(e instanceof Error ? e.message : 'Failed to fetch intents');
    } finally {
      setLoading(false);
    }
  }, [client, currentAccount]);

  useEffect(() => {
    fetchIntents();
  }, [fetchIntents]);

  return { intents, loading, error, refetch: fetchIntents };
}
