import { useCurrentAccount } from '@mysten/dapp-kit';
import { Navbar } from './components/Navbar';
import { SwapCard } from './components/SwapCard';
import type { IntentData } from './components/SwapCard';
import { InfoFooter } from './components/InfoFooter';
import { BackgroundBlobs } from './components/BackgroundBlobs';
import { Toast } from './components/Toast';
import type { ToastData } from './components/Toast';
import { MyIntents } from './components/MyIntents';
import { useState } from 'react';
import { TOKENS } from './config/tokens';
import type { Token } from './config/tokens';
import { useCreateIntent } from './hooks/useCreateIntent';

function App() {
	const currentAccount = useCurrentAccount();
	const { createIntent, isPending } = useCreateIntent();
	const [toast, setToast] = useState<ToastData | null>(null);
	const [showMyIntents, setShowMyIntents] = useState(false);

	// Token State
	const [sellToken, setSellToken] = useState<Token>(TOKENS[0]); // SUI
	const [buyToken, setBuyToken] = useState<Token>(TOKENS[1]); // USDC

	const handleCreateIntent = async (data: IntentData) => {
		if (!currentAccount) return;

		await createIntent(
			data,
			sellToken,
			buyToken,
			(digest) => {
				setToast({
					type: 'success',
					title: 'Intent Created',
					message: 'Your swap intent is now live. Solvers will compete to fill it.',
					txDigest: digest,
				});
			},
			(error) => {
				setToast({
					type: 'error',
					title: 'Transaction Failed',
					message: error.message || 'Failed to create intent',
				});
			}
		);
	};

	return (
		<div className="min-h-screen relative overflow-x-hidden antialiased selection:bg-[#4DA2FF] selection:text-white">
			<BackgroundBlobs />
			
			<Navbar 
				isConnected={!!currentAccount}
				address={currentAccount?.address}
				onMyIntents={() => setShowMyIntents(true)}
			/>

			<main className="flex flex-col items-center justify-center min-h-[calc(100vh-80px)] px-4 py-12 relative z-10">
				{/* Headline */}
				<h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-[#0D1F3C] text-center mb-8 animate-fadeIn">
					Swap with <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#4DA2FF] to-indigo-600">Intent</span>.
				</h1>

				<SwapCard 
					onCreateIntent={handleCreateIntent}
					isConnected={!!currentAccount}
					isLoading={isPending}
					sellToken={sellToken}
					buyToken={buyToken}
					onSetSellToken={setSellToken}
					onSetBuyToken={setBuyToken}
					sellBalance="--"
					buyBalance="--"
				/>

				<InfoFooter 
					exchangeRate={`1 ${sellToken.symbol} ~ ? ${buyToken.symbol}`}
					gasFee="~$0.002"
				/>
			</main>

			<Toast toast={toast} onClose={() => setToast(null)} />
			
			<MyIntents 
				isOpen={showMyIntents} 
				onClose={() => setShowMyIntents(false)}
				onToast={setToast}
			/>
		</div>
	);
}

export default App;
