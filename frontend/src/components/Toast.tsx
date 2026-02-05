import { useState, useEffect } from 'react';
import { X, ExternalLink, CheckCircle, AlertCircle } from 'lucide-react';

export interface ToastData {
  type: 'success' | 'error';
  title: string;
  message: string;
  txDigest?: string;
}

interface ToastProps {
  toast: ToastData | null;
  onClose: () => void;
}

export function Toast({ toast, onClose }: ToastProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (toast) {
      setIsVisible(true);
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(onClose, 300);
      }, 8000);
      return () => clearTimeout(timer);
    }
  }, [toast, onClose]);

  if (!toast) return null;

  const explorerUrl = toast.txDigest 
    ? `    https://suiscan.xyz/testnet/tx/${toast.txDigest}?network=testnet`
    : null;

  return (
    <div 
      className={`fixed bottom-6 left-6 z-50 max-w-md transition-all duration-300 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      }`}
    >
      <div className={`rounded-xl shadow-2xl border backdrop-blur-md p-4 ${
        toast.type === 'success' 
          ? 'bg-green-50/95 border-green-200' 
          : 'bg-red-50/95 border-red-200'
      }`}>
        <div className="flex items-start gap-3">
          {toast.type === 'success' ? (
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          )}
          
          <div className="flex-1 min-w-0">
            <p className={`font-semibold text-sm ${
              toast.type === 'success' ? 'text-green-800' : 'text-red-800'
            }`}>
              {toast.title}
            </p>
            <p className={`text-sm mt-1 ${
              toast.type === 'success' ? 'text-green-700' : 'text-red-700'
            }`}>
              {toast.message}
            </p>
            
            {explorerUrl && (
              <a
                href={explorerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 mt-2 text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline"
              >
                View on Sui Explorer
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
          
          <button
            onClick={() => {
              setIsVisible(false);
              setTimeout(onClose, 300);
            }}
            className={`p-1 rounded-lg transition-colors ${
              toast.type === 'success' 
                ? 'hover:bg-green-200/50 text-green-600' 
                : 'hover:bg-red-200/50 text-red-600'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
