import { X, ExternalLink, Loader2 } from 'lucide-react';
import { useUserIntents } from '../hooks/useUserIntents';
import { useCancelIntent } from '../hooks/useCancelIntent';
import type { ToastData } from './Toast';

interface MyIntentsProps {
  isOpen: boolean;
  onClose: () => void;
  onToast: (toast: ToastData) => void;
}

export function MyIntents({ isOpen, onClose, onToast }: MyIntentsProps) {
  const { intents, loading, refetch } = useUserIntents();
  const { cancelIntent, isPending } = useCancelIntent();

  if (!isOpen) return null;

  const formatAmount = (amount: bigint, decimals: number = 9) => {
    return (Number(amount) / Math.pow(10, decimals)).toFixed(4);
  };

  const formatType = (type: string) => {
    if (type.includes('SUI')) return 'SUI';
    if (type.includes('USDC')) return 'USDC';
    if (type.includes('DEEP')) return 'DEEP';
    return type.slice(0, 8) + '...';
  };

  const handleCancel = (intentId: string, inputType: string) => {
    cancelIntent(
      intentId,
      inputType,
      (digest) => {
        onToast({
          type: 'success',
          title: 'Intent Cancelled',
          message: 'Your tokens have been refunded.',
          txDigest: digest,
        });
        refetch();
      },
      (error) => {
        onToast({
          type: 'error',
          title: 'Cancel Failed',
          message: error.message || 'Failed to cancel intent',
        });
      }
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 max-h-[80vh] overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-800">My Intents</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <div className="p-4 overflow-y-auto max-h-[60vh]">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
              <span className="ml-2 text-slate-600">Loading intents...</span>
            </div>
          ) : intents.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              No pending intents found.
            </div>
          ) : (
            <div className="space-y-3">
              {intents.map((intent) => (
                <div
                  key={intent.intentId}
                  className="p-4 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-slate-700">
                      {formatAmount(intent.inputAmount)} {formatType(intent.inputType)} 
                      {' -> '} 
                      {formatType(intent.outputType)}
                    </span>
                    <a
                      href={`https://suiscan.xyz/testnet/object/${intent.intentId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:text-blue-600"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                  <p className="text-xs text-slate-500 mb-3 font-mono truncate">
                    {intent.intentId}
                  </p>
                  <button
                    onClick={() => handleCancel(intent.intentId, intent.inputType)}
                    disabled={isPending}
                    className="w-full py-2 px-4 rounded-lg bg-red-500 hover:bg-red-600 text-white text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Cancelling...
                      </>
                    ) : (
                      'Cancel & Refund'
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-4 border-t border-slate-200 bg-slate-50">
          <button
            onClick={refetch}
            className="w-full py-2 px-4 rounded-lg border border-slate-300 hover:bg-white text-slate-700 text-sm font-medium transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>
    </div>
  );
}
