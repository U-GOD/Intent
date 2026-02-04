/**
 * SuiIntents Solver Configuration
 */

export const config = {
    network: (process.env.SUI_NETWORK as 'mainnet' | 'testnet' | 'devnet') || 'testnet',
    
    // Deployed contract addresses (testnet)
    packageId: '0x0f794d721f36b929ccdc62b4d5e556505064938a95f554c4fd1b86f20e5b3233',
    registryId: '0x7f6c8a5af6cd8109b20eb8605398f9094f6749498413b65f8229ae062e5ca469',
    
    // DeepBook V3 addresses (testnet) - Official from Mysten Labs docs
    deepbook: {
        package: '0xbc331f09e5c737d45f074ad2d17c3038421b3b9018699e370d88d94938c53d28',
        pools: {
            SUI_DBUSDC: '0x1c19362ca52b8ffd7a33cee805a67d40f31e6ba303753fd3a4cfdfacea7163a5',
            DEEP_SUI: '0x48c95963e9eac37a316b7ae04a0deb761bcdcc2b67912374d6036e7f0e9bae9f',
        },
    },
    
    // Solver settings
    solver: {
        minProfitBps: 10, // Minimum profit in basis points (0.1%)
        maxSlippageBps: 50, // Maximum slippage (0.5%)
        pollIntervalMs: 1000, // How often to check for intents
    },
    
    // Coin types
    coins: {
        SUI: '0x2::sui::SUI',
        DBUSDC: '0xf7152c05930480cd740d7311b5b8b45c6f488e3a53a11c3f74a6fac36a52e0d7::DBUSDC::DBUSDC',
        DEEP: '0x36dbef866a1d62bf7328989a10fb2f07d769f4ee587c0de4a0a256e57e0a58a8::deep::DEEP',
    },
};
