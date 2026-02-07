import { Link } from 'react-router-dom';
import { ArrowLeft, Book, Terminal, Code, Cpu, ShieldCheck } from 'lucide-react';

export function Documentation() {
  return (
    <div className="min-h-screen bg-[#F5FAFF] selection:bg-sui-base selection:text-white font-sans">
      
      {/* Navbar */}
      <nav className="fixed top-0 z-50 w-full bg-white/80 backdrop-blur-md border-b border-slate-200/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-2 cursor-pointer group">
              <ArrowLeft className="w-5 h-5 text-slate-500 group-hover:text-navy transition-colors" />
              <span className="text-sm font-medium text-slate-600 group-hover:text-navy transition-colors">Back to Home</span>
            </Link>
            <span className="text-lg font-bold text-navy">Documentation</span>
            <div className="w-20"></div> {/* Spacer for center alignment */}
          </div>
        </div>
      </nav>

      <main className="pt-24 pb-20 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-sui-base text-xs font-semibold tracking-wide uppercase mb-4">
            <Book className="w-3 h-3" />
            Developer Guide
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-navy tracking-tight mb-6">
            SuiIntents Protocol
          </h1>
          <p className="text-xl text-slate-500 leading-relaxed">
            An intent-based trading protocol built on Sui enabling Dutch Auction pricing and atomic settlement via DeepBook V3.
          </p>
        </div>

        {/* Content Grid */}
        <div className="grid gap-12">
          
          {/* Section 1: Overview */}
          <section className="bg-white rounded-2xl p-8 border border-slate-100 shadow-sm">
            <h2 className="text-2xl font-bold text-navy mb-4 flex items-center gap-2">
              <ShieldCheck className="text-sui-base" /> Overview
            </h2>
            <div className="prose prose-slate max-w-none text-slate-600">
              <p className="mb-4">
                Traditional DEX interactions require users to manage slippage, gas fees, and routing. <strong>SuiIntents abstracts this complexity.</strong>
              </p>
              <ul className="space-y-2 list-disc pl-5">
                <li><strong>Users express outcomes:</strong> "Swap 1 SUI for DEEP".</li>
                <li><strong>Solvers compete:</strong> Market makers race to fill the order.</li>
                <li><strong>Atomic Execution:</strong> Trades settle in a single transaction block (PTB).</li>
                <li><strong>Zero Gas Failures:</strong> Solvers pay gas; users only sign intents.</li>
              </ul>
            </div>
          </section>

          {/* Section 2: How it Works */}
          <section className="bg-white rounded-2xl p-8 border border-slate-100 shadow-sm">
            <h2 className="text-2xl font-bold text-navy mb-4 flex items-center gap-2">
              <Cpu className="text-sui-base" /> Mechanics
            </h2>
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-navy mb-2">1. Dutch Auction Pricing</h3>
                <p className="text-slate-600">
                  The price starts high (above market) and decays linearly over time. Solvers wait until the price matches their liquidity cost plus profit margin, then execute. This guarantees the user gets the true market clearing price.
                </p>
              </div>
              <div className="bg-slate-50 p-4 rounded-lg font-mono text-sm text-slate-700">
                rate = start_rate - ((start_rate - end_rate) * elapsed / duration)
              </div>
              <div>
                <h3 className="text-lg font-semibold text-navy mb-2">2. DeepBook V3 Integration</h3>
                <p className="text-slate-600">
                  Solvers leverage Sui's native CLOB, DeepBook, to source liquidity. The protocol allows atomic "Flash Accounting" where the solver swaps and fills the intent in the same transaction.
                </p>
              </div>
            </div>
          </section>

          {/* Section 3: Running a Solver */}
          <section className="bg-white rounded-2xl p-8 border border-slate-100 shadow-sm">
            <h2 className="text-2xl font-bold text-navy mb-4 flex items-center gap-2">
              <Terminal className="text-sui-base" /> Running a Solver
            </h2>
            <p className="text-slate-600 mb-6">
              Become a market maker and earn spreads by running the reference solver bot.
            </p>
            
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-navy mb-2">1. Prerequisites</h4>
                <div className="flex gap-2">
                  <span className="px-2 py-1 bg-slate-100 rounded text-xs font-mono text-slate-600">Node.js 18+</span>
                  <span className="px-2 py-1 bg-slate-100 rounded text-xs font-mono text-slate-600">Sui Client</span>
                  <span className="px-2 py-1 bg-slate-100 rounded text-xs font-mono text-slate-600">pnpm</span>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-navy mb-2">2. Installation</h4>
                <div className="bg-[#0A1629] rounded-lg p-4 font-mono text-sm text-slate-300 overflow-x-auto">
                  <p><span className="text-slate-500"># Clone repo</span></p>
                  <p>git clone https://github.com/your-repo/intent-solver.git</p>
                  <p>cd solver</p>
                  <p>&nbsp;</p>
                  <p><span className="text-slate-500"># Install dependencies</span></p>
                  <p>pnpm install</p>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-navy mb-2">3. Configuration (.env)</h4>
                <div className="bg-[#0A1629] rounded-lg p-4 font-mono text-sm text-slate-300 overflow-x-auto">
                  <p>RPC_URL=https://fullnode.testnet.sui.io:443</p>
                  <p>SUI_PRIVATE_KEY=suiprivkey...</p>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-navy mb-2">4. Run Bot</h4>
                <div className="bg-[#0A1629] rounded-lg p-4 font-mono text-sm text-slate-300 overflow-x-auto">
                  <p><span className="text-slate-500"># Start the automated solver</span></p>
                  <p>pnpm start</p>
                  <p>&nbsp;</p>
                  <p><span className="text-slate-500"># Or manually fill an intent</span></p>
                  <p>npx tsx src/manual-fill.ts &lt;INTENT_ID&gt;</p>
                </div>
              </div>
            </div>
          </section>

          {/* Section 4: Smart Contracts */}
          <section className="bg-white rounded-2xl p-8 border border-slate-100 shadow-sm">
            <h2 className="text-2xl font-bold text-navy mb-4 flex items-center gap-2">
              <Code className="text-sui-base" /> Smart Contracts
            </h2>
            <div className="space-y-4 text-slate-600">
              <p>The protocol consists of modular Move packages:</p>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="font-mono font-bold text-navy mb-1">intent.move</div>
                  <div className="text-sm">Core logic for creating and storing intents.</div>
                </div>
                <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="font-mono font-bold text-navy mb-1">dutch_auction.move</div>
                  <div className="text-sm">Calculates price decay over the set duration.</div>
                </div>
                <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="font-mono font-bold text-navy mb-1">escrow.move</div>
                  <div className="text-sm">Securely locks user funds until settlement.</div>
                </div>
                <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="font-mono font-bold text-navy mb-1">solver_registry.move</div>
                  <div className="text-sm">Manages authorized solvers and staking.</div>
                </div>
              </div>
            </div>
          </section>

        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-100 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-slate-400 text-sm">
          <p>© 2026 SuiIntents. Built for the Future of Finance.</p>
        </div>
      </footer>
    </div>
  );
}
