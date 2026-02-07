import { Infinity, ChevronDown, FileText } from 'lucide-react';
import { ConnectButton } from '@mysten/dapp-kit';

interface NavbarProps {
  onConnect?: () => void;
  isConnected: boolean;
  address?: string;
  onMyIntents?: () => void;
}

export function Navbar({ isConnected, onMyIntents }: NavbarProps) {
  return (
    <nav className="sticky top-0 z-50 w-full px-4 md:px-6 py-4 backdrop-blur-md bg-white/60 border-b border-slate-200/50">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <a href="/" className="flex items-center gap-2 cursor-pointer group">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#4DA2FF] to-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform">
            <Infinity className="w-5 h-5" />
          </div>
          <span className="text-xl font-bold tracking-tight text-[#0D1F3C]">SuiIntents</span>
        </a>

        {/* Tagline */}
        <div className="hidden md:flex items-center">
          <span className="text-sm text-slate-500 font-medium">Intent-Based Trading on Sui</span>
        </div>

        {/* Wallet */}
        <div className="flex items-center gap-3">
          {isConnected && onMyIntents && (
            <button
              onClick={onMyIntents}
              className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-100 cursor-pointer transition-colors border border-slate-200 text-sm font-medium text-slate-600"
            >
              <FileText className="w-4 h-4" />
              <span className="hidden md:inline">My Intents</span>
            </button>
          )}
          
          <div className="hidden md:flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-100 cursor-pointer transition-colors border border-transparent hover:border-slate-200">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-sm font-medium text-slate-600">Sui Testnet</span>
            <ChevronDown className="w-4 h-4 text-slate-400" />
          </div>
          
          <ConnectButton 
            className="!bg-[#4DA2FF] !hover:bg-blue-500 !text-white !font-medium !rounded-xl !border-0 !shadow-lg !shadow-blue-500/20" 
          />
        </div>
      </div>
    </nav>
  );
}
