import { useState } from 'react';
import { ChevronDown, ArrowDownUp, Settings2, Sparkles, ChevronUp, ArrowRight, ChevronRight, Loader2 } from 'lucide-react';
import type { Token } from '../config/tokens';
import { TokenSelector } from './TokenSelector';

interface SwapCardProps {
  onCreateIntent: (data: IntentData) => void;
  isConnected: boolean;
  isLoading?: boolean;
  sellToken: Token;
  buyToken: Token;
  onSetSellToken: (t: Token) => void;
  onSetBuyToken: (t: Token) => void;
  sellBalance: string;
  buyBalance: string;
}

export interface IntentData {
  inputAmount: string;
  outputAmount: string;
  startRate: string;
  endRate: string;
  expiration: string;
  slippage: string;
}

const EXPIRATION_OPTIONS = [
  { label: '5m', value: 5 * 60 },
  { label: '15m', value: 15 * 60 },
  { label: '1h', value: 60 * 60 },
  { label: '2h', value: 2 * 60 * 60 },
  { label: '6h', value: 6 * 60 * 60 },
  { label: '12h', value: 12 * 60 * 60 },
  { label: '1d', value: 24 * 60 * 60 },
  { label: '3d', value: 3 * 24 * 60 * 60 },
  { label: '7d', value: 7 * 24 * 60 * 60 },
];

export function SwapCard({ 
  onCreateIntent, 
  isConnected, 
  isLoading = false,
  sellToken, 
  buyToken,
  onSetSellToken,
  onSetBuyToken,
  sellBalance,
  buyBalance 
}: SwapCardProps) {
  const [activeTab, setActiveTab] = useState<'swap' | 'limit' | 'intent'>('intent');
  const [sellAmount, setSellAmount] = useState('');
  const [buyAmount, setBuyAmount] = useState('');
  const [showSettings, setShowSettings] = useState(true);
  const [expirationIdx, setExpirationIdx] = useState(1); // Default to 15m
  const [slippage, setSlippage] = useState('0.5');
  const [startRate, setStartRate] = useState('1.00');
  const [endRate, setEndRate] = useState('0.95');
  
  // Modal state
  const [isTokenSelectorOpen, setIsTokenSelectorOpen] = useState(false);
  const [tokenSelectorMode, setTokenSelectorMode] = useState<'sell' | 'buy'>('sell');

  const openTokenSelector = (mode: 'sell' | 'buy') => {
    setTokenSelectorMode(mode);
    setIsTokenSelectorOpen(true);
  };

  const handleTokenSelect = (token: Token) => {
    if (tokenSelectorMode === 'sell') {
      if (token.symbol === buyToken.symbol) {
        onSetBuyToken(sellToken); // Swap tokens if same
      }
      onSetSellToken(token);
    } else {
      if (token.symbol === sellToken.symbol) {
        onSetSellToken(buyToken); // Swap tokens if same
      }
      onSetBuyToken(token);
    }
  };

  const handleSwapTokens = () => {
    const temp = sellToken;
    onSetSellToken(buyToken);
    onSetBuyToken(temp);
    // Swap amounts too
    const tempAmt = sellAmount;
    setSellAmount(buyAmount);
    setBuyAmount(tempAmt);
  };

  const handleCreateIntent = () => {
    if (!sellAmount || parseFloat(sellAmount) <= 0) {
      alert('Please enter an amount to swap');
      return;
    }
    onCreateIntent({
      inputAmount: sellAmount,
      outputAmount: buyAmount || sellAmount, // Use sell amount if no buy amount specified
      startRate,
      endRate,
      expiration: EXPIRATION_OPTIONS[expirationIdx].label,
      slippage,
    });
  };

  const isValidInput = sellAmount && parseFloat(sellAmount) > 0;

  return (
    <>
      <div className="w-full max-w-[460px] bg-white rounded-3xl shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-slate-100 p-2 animate-fadeInUp relative z-0">
        {/* Tabs */}
        <div className="flex items-center justify-between px-2 pt-2 pb-4">
          <div className="flex gap-1">
            <button
              onClick={() => setActiveTab('swap')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'swap'
                  ? 'bg-[#4DA2FF]/10 text-[#4DA2FF]'
                  : 'text-slate-500 hover:text-[#0D1F3C] hover:bg-slate-50'
              }`}
            >
              Swap
            </button>
            <button
              onClick={() => setActiveTab('limit')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'limit'
                  ? 'bg-[#4DA2FF]/10 text-[#4DA2FF]'
                  : 'text-slate-500 hover:text-[#0D1F3C] hover:bg-slate-50'
              }`}
            >
              Limit
            </button>
            <button
              onClick={() => setActiveTab('intent')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                activeTab === 'intent'
                  ? 'bg-[#4DA2FF]/10 text-[#4DA2FF]'
                  : 'text-slate-500 hover:text-[#0D1F3C] hover:bg-slate-50'
              }`}
            >
              Intent
              <span className="flex h-1.5 w-1.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#4DA2FF]" />
              </span>
            </button>
          </div>
          <button className="p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-[#0D1F3C] transition-colors">
            <Settings2 className="w-5 h-5" />
          </button>
        </div>

        {/* Sell Section */}
        <div className="bg-[#F5F7FA] rounded-2xl p-4 hover:ring-1 hover:ring-slate-200 transition-all group">
          <div className="flex justify-between mb-1">
            <label className="text-xs font-medium text-slate-500 group-hover:text-[#4DA2FF] transition-colors">
              You Pay
            </label>
            <div className="flex gap-2">
              <button 
                onClick={() => {
                  const half = parseFloat(sellBalance.replace(/,/g, '')) * 0.5;
                  if (!isNaN(half)) setSellAmount(half.toString());
                }}
                className="text-[10px] font-semibold text-[#4DA2FF] bg-white border border-slate-200 px-2 py-0.5 rounded shadow-sm hover:shadow transition-shadow"
              >
                50%
              </button>
              <button 
                onClick={() => setSellAmount(sellBalance.replace(/,/g, ''))}
                className="text-[10px] font-semibold text-[#4DA2FF] bg-white border border-slate-200 px-2 py-0.5 rounded shadow-sm hover:shadow transition-shadow"
              >
                MAX
              </button>
            </div>
          </div>
          <div className="flex items-center justify-between gap-4">
            <input
              type="number"
              placeholder="0"
              value={sellAmount}
              onChange={(e) => setSellAmount(e.target.value)}
              className="w-full bg-transparent text-4xl font-medium text-[#0D1F3C] placeholder-slate-300 outline-none tracking-tight [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
            <button 
              onClick={() => openTokenSelector('sell')}
              className="flex items-center gap-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-full pl-2 pr-3 py-1.5 shadow-sm transition-all hover:scale-105"
            >
              <img 
                src={sellToken.icon} 
                alt={sellToken.symbol} 
                className="w-6 h-6 rounded-full"
              />
              <span className="text-base font-semibold text-[#0D1F3C]">{sellToken.symbol}</span>
              <ChevronDown className="w-4 h-4 text-slate-400" />
            </button>
          </div>
          <div className="flex justify-between mt-2">
            <span className="text-xs text-slate-400 font-medium">
              {sellAmount ? `~$${(parseFloat(sellAmount) * 1.2).toFixed(2)}` : '~$0.00'}
            </span>
            <span className="text-xs text-slate-400 font-medium">Balance: {sellBalance}</span>
          </div>
        </div>

        {/* Swap Arrow */}
        <div className="relative h-1">
          <div className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
            <button 
              onClick={handleSwapTokens}
              className="bg-white p-2 rounded-xl border-4 border-white shadow-lg text-[#4DA2FF] hover:text-blue-600 hover:rotate-180 transition-all duration-300"
            >
              <ArrowDownUp className="w-5 h-5 stroke-[2.5]" />
            </button>
          </div>
        </div>

        {/* Buy Section */}
        <div className="bg-[#F5F7FA] rounded-2xl p-4 mt-1 hover:ring-1 hover:ring-slate-200 transition-all group">
          <div className="flex justify-between mb-1">
            <label className="text-xs font-medium text-slate-500 group-hover:text-[#4DA2FF] transition-colors">
              You Receive (estimated)
            </label>
          </div>
          <div className="flex items-center justify-between gap-4">
            <input
              type="number"
              placeholder="0"
              value={buyAmount}
              onChange={(e) => setBuyAmount(e.target.value)}
              className="w-full bg-transparent text-4xl font-medium text-[#0D1F3C] placeholder-slate-300 outline-none tracking-tight [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
            <button 
              onClick={() => openTokenSelector('buy')}
              className="flex items-center gap-2 bg-[#4DA2FF] text-white border border-transparent rounded-full pl-2 pr-3 py-1.5 shadow-md shadow-blue-500/20 transition-all hover:scale-105"
            >
              <img 
                src={buyToken.icon} 
                alt={buyToken.symbol} 
                className="w-6 h-6 rounded-full bg-white/20 p-0.5"
              />
              <span className="text-base font-semibold">{buyToken.symbol}</span>
              <ChevronDown className="w-4 h-4 text-white/70" />
            </button>
          </div>
          <div className="flex justify-between mt-2">
            <span className="text-xs text-slate-400 font-medium">
              {buyAmount ? `~$${(parseFloat(buyAmount) * 1.0).toFixed(2)}` : '~$0.00'}
            </span>
            <span className="text-xs text-slate-400 font-medium">Balance: {buyBalance}</span>
          </div>
        </div>

        {/* Intent Settings */}
        {activeTab === 'intent' && (
          <div className="mt-3 border border-blue-100 bg-blue-50/50 rounded-xl overflow-hidden">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="w-full flex items-center justify-between p-3 text-left group"
            >
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#4DA2FF]" />
                <span className="text-sm font-semibold text-[#0D1F3C]">Intent Strategy</span>
              </div>
              {showSettings ? (
                <ChevronUp className="w-4 h-4 text-slate-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-400" />
              )}
            </button>

            {showSettings && (
              <div className="px-4 pb-4 pt-1 space-y-4">
                {/* Rate Decay */}
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-xs font-medium text-slate-500">Rate Decay (Dutch Auction)</span>
                    <span className="text-xs font-semibold text-[#4DA2FF]">Active</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="bg-white border border-slate-200 rounded-lg px-2 py-1 flex-1">
                      <span className="text-[10px] text-slate-400 block">Start Rate</span>
                      <input
                        type="text"
                        value={startRate}
                        onChange={(e) => setStartRate(e.target.value)}
                        className="text-sm font-medium text-[#0D1F3C] bg-transparent outline-none w-full"
                      />
                    </div>
                    <div className="flex-1 px-2 relative">
                      <div className="h-1 w-full bg-gradient-to-r from-green-400 to-amber-400 rounded-full opacity-50" />
                      <div className="absolute top-1/2 left-0 w-full -translate-y-1/2 flex justify-between px-1">
                        <ChevronRight className="w-3 h-3 text-slate-400" />
                        <ChevronRight className="w-3 h-3 text-slate-400" />
                        <ChevronRight className="w-3 h-3 text-slate-400" />
                      </div>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-lg px-2 py-1 flex-1 text-right">
                      <span className="text-[10px] text-slate-400 block">End Rate</span>
                      <input
                        type="text"
                        value={endRate}
                        onChange={(e) => setEndRate(e.target.value)}
                        className="text-sm font-medium text-[#0D1F3C] bg-transparent outline-none w-full text-right"
                      />
                    </div>
                  </div>
                </div>

                {/* Expiration */}
                <div>
                  <label className="text-xs font-medium text-slate-500 block mb-1.5 pl-1">Expiration</label>
                  <div className="grid grid-cols-5 gap-1 p-1 bg-white rounded-xl border border-slate-200">
                    {EXPIRATION_OPTIONS.map((opt, idx) => (
                      <button
                        key={opt.label}
                        onClick={() => setExpirationIdx(idx)}
                        className={`text-xs font-medium py-1.5 rounded-lg transition-all ${
                          expirationIdx === idx
                            ? 'bg-blue-50 text-[#4DA2FF] shadow-sm'
                            : 'text-slate-500 hover:bg-slate-50'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
                
                {/* Slippage */}
                <div>
                  <label className="text-xs font-medium text-slate-500 block mb-1.5 pl-1">Slippage Tolerance</label>
                  <div className="flex items-center gap-2">
                    {['0.1', '0.5', '1.0'].map((val) => (
                      <button
                        key={val}
                        onClick={() => setSlippage(val)}
                        className={`flex-1 text-xs font-medium py-2 rounded-lg border transition-all ${
                          slippage === val
                            ? 'bg-blue-50 text-[#4DA2FF] border-blue-200'
                            : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {val}%
                      </button>
                    ))}
                    <div className="flex items-center bg-white rounded-lg border border-slate-200 px-2 py-1.5 flex-1">
                      <input
                        type="text"
                        value={slippage}
                        onChange={(e) => setSlippage(e.target.value)}
                        className="w-full text-xs font-medium text-[#0D1F3C] outline-none text-center"
                        placeholder="Custom"
                      />
                      <span className="text-xs text-slate-400 font-medium">%</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Action Button */}
        <button
          onClick={isConnected ? handleCreateIntent : undefined}
          disabled={isLoading || (isConnected && !isValidInput)}
          className={`w-full mt-3 font-semibold text-lg py-4 rounded-2xl transition-all transform active:scale-[0.98] flex items-center justify-center gap-2 ${
            !isConnected
              ? 'bg-gradient-to-r from-[#4DA2FF] to-blue-600 hover:from-blue-400 hover:to-blue-500 text-white shadow-lg shadow-blue-500/25'
              : isValidInput && !isLoading
                ? 'bg-gradient-to-r from-[#4DA2FF] to-blue-600 hover:from-blue-400 hover:to-blue-500 text-white shadow-lg shadow-blue-500/25'
                : 'bg-slate-200 text-slate-500 cursor-not-allowed'
          }`}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Creating Intent...</span>
            </>
          ) : !isConnected ? (
            <span>Connect Wallet</span>
          ) : !isValidInput ? (
            <span>Enter an amount</span>
          ) : (
            <>
              <span>Create Intent</span>
              <ArrowRight className="w-5 h-5 opacity-80" />
            </>
          )}
        </button>
      </div>

      <TokenSelector 
        isOpen={isTokenSelectorOpen}
        onClose={() => setIsTokenSelectorOpen(false)}
        onSelect={handleTokenSelect}
        selectedToken={tokenSelectorMode === 'sell' ? sellToken : buyToken}
      />
    </>
  );
}
