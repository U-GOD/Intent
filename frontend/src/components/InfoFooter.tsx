import { Fuel } from 'lucide-react';

interface InfoFooterProps {
  exchangeRate: string;
  gasFee: string;
}

export function InfoFooter({ exchangeRate, gasFee }: InfoFooterProps) {
  return (
    <div className="mt-6 flex flex-col items-center gap-2 animate-fadeIn">
      <div className="flex items-center gap-2 px-3 py-1.5 bg-white/60 backdrop-blur-sm rounded-full border border-white/50 shadow-sm">
        <span className="flex h-2 w-2 relative">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
        </span>
        <span className="text-xs font-medium text-slate-600">
          Powered by <span className="font-bold text-[#0D1F3C]">DeepBook V3</span>
        </span>
      </div>
      <div className="flex items-center gap-4 text-xs font-medium text-slate-400">
        <span>{exchangeRate}</span>
        <span className="flex items-center gap-1">
          <Fuel className="w-3 h-3" />
          {gasFee}
        </span>
      </div>
    </div>
  );
}
