import { Link } from 'react-router-dom';
import { 
  Infinity, 
  ArrowRight, 
  Menu, 
  FileText, 
  ShieldCheck, 
  Zap, 
  TrendingDown, 
  Lock, 
  CheckCircle, 
  PenSquare, 
  BarChart, 
  Cpu, 
  Wallet, 
  ArrowUpRight, 
  Github 
} from 'lucide-react';

export function LandingPage() {
  return (
    <div className="min-h-screen relative overflow-x-hidden selection:bg-sui-base selection:text-white bg-[#F5FAFF] font-sans">
      
      {/* Navbar */}
      <nav className="fixed top-0 z-50 w-full bg-white/80 backdrop-blur-md border-b border-slate-200/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between h-16">
                  {/* Logo */}
                  <div className="flex items-center gap-2 cursor-pointer">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-sui-base to-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                          <Infinity className="w-5 h-5" />
                      </div>
                      <span className="text-xl font-bold tracking-tight text-navy">SuiIntents</span>
                  </div>

                  {/* Desktop Nav */}
                  <div className="hidden md:flex items-center gap-8">
                      <a href="#features" className="text-sm font-medium text-slate-600 hover:text-navy transition-colors">Features</a>
                      <a href="#how-it-works" className="text-sm font-medium text-slate-600 hover:text-navy transition-colors">How it Works</a>
                      <a href="#developers" className="text-sm font-medium text-slate-600 hover:text-navy transition-colors">Developers</a>
                  </div>

                  {/* CTA */}
                  <Link to="/app" className="hidden md:flex items-center gap-2 bg-sui-base hover:bg-blue-600 text-white px-5 py-2 rounded-lg font-medium text-sm shadow-lg shadow-sui-base/30 transition-all hover:-translate-y-0.5">
                      Launch App
                      <ArrowRight className="w-4 h-4" />
                  </Link>
                  
                  {/* Mobile Menu Button */}
                  <button className="md:hidden text-navy">
                      <Menu className="w-6 h-6" />
                  </button>
              </div>
          </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
          {/* Background Accents */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full mesh-gradient -z-10"></div>
          <div className="absolute top-20 right-0 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl -z-10 animate-pulse-slow"></div>
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-indigo-400/10 rounded-full blur-3xl -z-10"></div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-sui-base text-xs font-semibold tracking-wide uppercase mb-6">
                  <span className="w-2 h-2 rounded-full bg-sui-base animate-pulse"></span>
                  Now Live on Sui Mainnet
              </div>
              
              <h1 className="text-5xl md:text-7xl font-bold text-navy tracking-tight mb-6 leading-[1.1]">
                  Trade with Intent.<br/>
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-sui-base to-blue-600">Settle with Speed.</span>
              </h1>
              
              <p className="mt-4 max-w-2xl mx-auto text-lg md:text-xl text-slate-500 leading-relaxed">
                  The first intent-centric trading protocol on Sui. Zero gas failures, Dutch Auction pricing, and atomic settlement powered by DeepBook V3.
              </p>
              
              <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center items-center">
                  <Link to="/app" className="w-full sm:w-auto px-8 py-4 rounded-xl bg-sui-base hover:bg-blue-600 text-white font-semibold text-lg shadow-xl shadow-sui-base/25 transition-all hover:scale-[1.02] flex items-center justify-center gap-2">
                      Launch App
                  </Link>
                  <Link to="/docs" className="w-full sm:w-auto px-8 py-4 rounded-xl bg-white hover:bg-slate-50 text-navy border border-slate-200 font-semibold text-lg transition-all flex items-center justify-center gap-2">
                      <FileText className="w-5 h-5" />
                      Documentation
                  </Link>
              </div>

              {/* Hero Visual / Floating Elements */}
              <div className="mt-20 relative w-full max-w-3xl mx-auto h-[300px] hidden md:block">
                  {/* Center Card (Intent) */}
                  <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-80 glass-card p-5 rounded-2xl shadow-2xl z-20 animate-float">
                      <div className="flex justify-between items-center mb-4">
                          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Intent Created</span>
                          <div className="w-2 h-2 rounded-full bg-green-500"></div>
                      </div>
                      <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">S</div>
                              <div>
                                  <div className="text-lg font-bold text-navy">100 SUI</div>
                                  <div className="text-xs text-slate-500">Offering</div>
                              </div>
                          </div>
                          <ArrowRight className="text-slate-300 w-6 h-6" />
                          <div className="flex items-center gap-3 text-right">
                              <div>
                                  <div className="text-lg font-bold text-navy">2450 USDC</div>
                                  <div className="text-xs text-slate-500">Requesting</div>
                              </div>
                              <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center text-white font-bold">$</div>
                          </div>
                      </div>
                      <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between items-center">
                          <span className="text-xs text-slate-500 font-medium">Solver: 0x7a...3f9</span>
                          <span className="text-xs text-green-600 font-bold bg-green-50 px-2 py-1 rounded">Best Price</span>
                      </div>
                  </div>

                  {/* Floating Decor Elements */}
                  <div className="absolute left-10 top-10 w-48 glass-card p-4 rounded-xl z-10 opacity-60 scale-90 animate-[float_5s_ease-in-out_1s_infinite]">
                      <div className="flex items-center gap-3">
                          <div className="bg-purple-100 p-2 rounded-lg text-purple-600"><ShieldCheck /></div>
                          <div>
                              <div className="text-sm font-bold text-navy">MEV Protected</div>
                              <div className="text-[10px] text-slate-500">No sandwich attacks</div>
                          </div>
                      </div>
                  </div>

                  <div className="absolute right-10 bottom-10 w-48 glass-card p-4 rounded-xl z-10 opacity-60 scale-90 animate-[float_7s_ease-in-out_2s_infinite]">
                      <div className="flex items-center gap-3">
                          <div className="bg-orange-100 p-2 rounded-lg text-orange-600"><Zap /></div>
                          <div>
                              <div className="text-sm font-bold text-navy">Atomic Swap</div>
                              <div className="text-[10px] text-slate-500">Instant finality</div>
                          </div>
                      </div>
                  </div>
              </div>
          </div>
      </section>

      {/* The "Why" Section */}
      <section id="features" className="py-24 bg-white relative">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center max-w-3xl mx-auto mb-16">
                  <h2 className="text-3xl md:text-4xl font-bold text-navy tracking-tight mb-4">SuiIntents flips the model.</h2>
                  <p className="text-lg text-slate-500">Traditional AMMs are slow and suffer from high slippage. We built a protocol where solvers compete to give you the best price.</p>
              </div>

              <div className="grid md:grid-cols-3 gap-8">
                  {/* Card 1 */}
                  <div className="group p-8 rounded-2xl bg-slate-50 hover:bg-white border border-slate-100 hover:border-blue-100 hover:shadow-xl hover:shadow-blue-900/5 transition-all duration-300">
                      <div className="w-12 h-12 rounded-xl bg-blue-100 text-sui-base flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                          <TrendingDown className="w-7 h-7" />
                      </div>
                      <h3 className="text-xl font-bold text-navy mb-3">Dutch Auctions</h3>
                      <p className="text-slate-500 leading-relaxed">
                          Prices decay over time until a Solver fills the request. Instead of paying the worst price, you get the fair market price discovered in real-time.
                      </p>
                  </div>

                  {/* Card 2 */}
                  <div className="group p-8 rounded-2xl bg-slate-50 hover:bg-white border border-slate-100 hover:border-blue-100 hover:shadow-xl hover:shadow-blue-900/5 transition-all duration-300">
                      <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                          <Lock className="w-7 h-7" />
                      </div>
                      <h3 className="text-xl font-bold text-navy mb-3">MEV Protection</h3>
                      <p className="text-slate-500 leading-relaxed">
                          Your trade is cryptographically signed but not broadcasted to the public mempool until filled, preventing sandwich attacks and front-running.
                      </p>
                  </div>

                  {/* Card 3 */}
                  <div className="group p-8 rounded-2xl bg-slate-50 hover:bg-white border border-slate-100 hover:border-blue-100 hover:shadow-xl hover:shadow-blue-900/5 transition-all duration-300">
                      <div className="w-12 h-12 rounded-xl bg-teal-100 text-teal-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                          <CheckCircle className="w-7 h-7" />
                      </div>
                      <h3 className="text-xl font-bold text-navy mb-3">Atomic Settlement</h3>
                      <p className="text-slate-500 leading-relaxed">
                          Funds only move when the swap is 100% guaranteed. If the solver fails to deliver, your assets never leave your wallet.
                      </p>
                  </div>
              </div>
          </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-24 bg-[#F5FAFF]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex flex-col md:flex-row items-start justify-between gap-16">
                  {/* Left Content */}
                  <div className="md:w-1/3 sticky top-32">
                      <h2 className="text-3xl md:text-4xl font-bold text-navy tracking-tight mb-6">How it Works</h2>
                      <p className="text-lg text-slate-500 mb-8">
                          A seamless flow from intent to settlement, abstracting away the complexities of DeFi liquidity.
                      </p>
                      <Link to="/app" className="text-sui-base font-semibold flex items-center gap-2 hover:gap-3 transition-all">
                          Try it now
                          <ArrowRight className="w-4 h-4" />
                      </Link>
                  </div>

                  {/* Right Steps */}
                  <div className="md:w-2/3 space-y-8">
                      {/* Step 1 */}
                      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex gap-6 items-start">
                          <div className="w-10 h-10 shrink-0 rounded-full bg-blue-50 text-sui-base flex items-center justify-center font-bold border border-blue-100">1</div>
                          <div>
                              <h4 className="text-lg font-bold text-navy flex items-center gap-2">
                                  Sign
                                  <PenSquare className="text-slate-400 w-4 h-4" />
                              </h4>
                              <p className="text-slate-500 mt-2">You create an intent off-chain. This is a gasless signature that specifies what you want to trade and your conditions.</p>
                          </div>
                      </div>

                      {/* Step 2 */}
                      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex gap-6 items-start">
                          <div className="w-10 h-10 shrink-0 rounded-full bg-blue-50 text-sui-base flex items-center justify-center font-bold border border-blue-100">2</div>
                          <div>
                              <h4 className="text-lg font-bold text-navy flex items-center gap-2">
                                  Auction
                                  <BarChart className="text-slate-400 w-4 h-4" />
                              </h4>
                              <p className="text-slate-500 mt-2">The protocol broadcasts your intent. A Dutch Auction begins where the price creates an opportunity for solvers.</p>
                          </div>
                      </div>

                      {/* Step 3 */}
                      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex gap-6 items-start">
                          <div className="w-10 h-10 shrink-0 rounded-full bg-blue-50 text-sui-base flex items-center justify-center font-bold border border-blue-100">3</div>
                          <div>
                              <h4 className="text-lg font-bold text-navy flex items-center gap-2">
                                  Solve
                                  <Cpu className="text-slate-400 w-4 h-4" />
                              </h4>
                              <p className="text-slate-500 mt-2">Solvers (market makers & bots) race to find the best liquidity across DeepBook, AMMs, and private pools to fill your order.</p>
                          </div>
                      </div>

                      {/* Step 4 */}
                      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex gap-6 items-start">
                          <div className="w-10 h-10 shrink-0 rounded-full bg-blue-50 text-sui-base flex items-center justify-center font-bold border border-blue-100">4</div>
                          <div>
                              <h4 className="text-lg font-bold text-navy flex items-center gap-2">
                                  Settle
                                  <Wallet className="text-slate-400 w-4 h-4" />
                              </h4>
                              <p className="text-slate-500 mt-2">The winning solver executes an atomic transaction on Sui. Assets are swapped simultaneously. Zero risk.</p>
                          </div>
                      </div>
                  </div>
              </div>
          </div>
      </section>

      {/* For Solvers Section */}
      <section id="developers" className="py-24 bg-navy relative overflow-hidden">
          {/* Decoration */}
          <div className="absolute top-0 right-0 w-full h-full opacity-10 pointer-events-none">
              <div className="absolute right-0 top-0 w-[500px] h-[500px] bg-blue-500 rounded-full blur-[100px]"></div>
          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 flex flex-col md:flex-row items-center justify-between gap-12">
              <div className="md:w-1/2">
                  <div className="inline-block px-3 py-1 rounded-full bg-blue-500/20 border border-blue-500/30 text-blue-300 text-xs font-semibold uppercase tracking-wider mb-4">
                      For Developers
                  </div>
                  <h2 className="text-3xl md:text-5xl font-bold text-white tracking-tight mb-6">Built for Market Makers</h2>
                  <p className="text-lg text-slate-300 mb-8 max-w-lg">
                      Run a solver bot to capture spreads and provide liquidity. Integrate easily with our TypeScript SDK and access DeepBook V3 liquidity instantly.
                  </p>
                  <div className="flex gap-4">
                      <Link to="/docs" className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold transition-colors flex items-center gap-2">
                          View Documentation
                          <ArrowUpRight className="w-4 h-4" />
                      </Link>
                      <button className="px-6 py-3 rounded-xl bg-transparent border border-slate-600 hover:border-slate-400 text-white font-semibold transition-colors flex items-center gap-2">
                          <Github className="w-5 h-5" />
                          GitHub
                      </button>
                  </div>
              </div>
              
              <div className="md:w-1/2 w-full">
                  <div className="bg-[#0A1629] rounded-xl border border-slate-700/50 p-6 font-mono text-sm shadow-2xl">
                      <div className="flex gap-2 mb-4">
                          <div className="w-3 h-3 rounded-full bg-red-500"></div>
                          <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                          <div className="w-3 h-3 rounded-full bg-green-500"></div>
                      </div>
                      <div className="space-y-2 text-slate-300">
                          <p><span className="text-purple-400">import</span> {'{'} <span className="text-yellow-300">SuiIntent</span> {'}'} <span className="text-purple-400">from</span> <span className="text-green-300">'@sui-intents/sdk'</span>;</p>
                          <p>&nbsp;</p>
                          <p><span className="text-slate-500">// Initialize Solver</span></p>
                          <p><span className="text-purple-400">const</span> solver = <span className="text-purple-400">new</span> <span className="text-yellow-300">Solver</span>(config);</p>
                          <p>&nbsp;</p>
                          <p><span className="text-slate-500">// Listen for auctions</span></p>
                          <p>solver.<span className="text-blue-400">on</span>(<span className="text-green-300">'auction'</span>, <span className="text-purple-400">async</span> (intent) =&gt; {'{'}</p>
                          <p className="pl-4"><span className="text-purple-400">const</span> quote = <span className="text-purple-400">await</span> deepBook.<span className="text-blue-400">getQuote</span>(intent);</p>
                          <p className="pl-4"><span className="text-purple-400">return</span> solver.<span className="text-blue-400">submitBid</span>(quote);</p>
                          <p>{'});'}</p>
                      </div>
                  </div>
              </div>
          </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-100 py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded bg-sui-base flex items-center justify-center text-white">
                      <Infinity className="w-3 h-3" />
                  </div>
                  <span className="text-lg font-bold text-navy">SuiIntents</span>
              </div>
              
              <div className="flex gap-8">
                  <Link to="/docs" className="text-sm font-medium text-slate-500 hover:text-navy transition-colors">Documentation</Link>
                  <a href="https://github.com/U-GOD/Intent" target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-slate-500 hover:text-navy transition-colors">GitHub</a>
                  <a href="#" className="text-sm font-medium text-slate-500 hover:text-navy transition-colors">Twitter</a>
                  <a href="#" className="text-sm font-medium text-slate-500 hover:text-navy transition-colors">Terms</a>
              </div>

              <div className="text-sm text-slate-400">
                  © 2026 SuiIntents. All rights reserved.
              </div>
          </div>
      </footer>
    </div>
  );
}
