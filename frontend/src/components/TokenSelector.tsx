import { Search, X } from 'lucide-react';
import { useState } from 'react';
import { TOKENS } from '../config/tokens';
import type { Token } from '../config/tokens';

interface TokenSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (token: Token) => void;
  selectedToken?: Token;
}

export function TokenSelector({ isOpen, onClose, onSelect, selectedToken }: TokenSelectorProps) {
  const [search, setSearch] = useState('');

  if (!isOpen) return null;

  const filteredTokens = TOKENS.filter(token => 
    token.symbol.toLowerCase().includes(search.toLowerCase()) || 
    token.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden animate-fadeInUp">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100">
          <h3 className="font-semibold text-[#0D1F3C]">Select Token</h3>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-[#0D1F3C] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search by name or symbol" 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-[#F5F7FA] rounded-xl text-sm font-medium outline-none border border-transparent focus:border-[#4DA2FF] focus:bg-white transition-all"
            />
          </div>
        </div>

        {/* Token List */}
        <div className="max-h-[300px] overflow-y-auto">
          {filteredTokens.map((token) => (
            <button
              key={token.symbol}
              onClick={() => {
                onSelect(token);
                onClose();
              }}
              className={`w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors ${
                selectedToken?.symbol === token.symbol ? 'opacity-50 cursor-default' : ''
              }`}
            >
              <div className="flex items-center gap-3">
                <img src={token.icon} alt={token.name} className="w-8 h-8 rounded-full border border-slate-100" />
                <div className="text-left">
                  <div className="font-semibold text-[#0D1F3C]">{token.symbol}</div>
                  <div className="text-xs text-slate-500">{token.name}</div>
                </div>
              </div>
              {selectedToken?.symbol === token.symbol && (
                <div className="w-2 h-2 rounded-full bg-[#4DA2FF]" />
              )}
            </button>
          ))}
          
          {filteredTokens.length === 0 && (
            <div className="p-8 text-center text-slate-400 text-sm">
              No tokens found
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
