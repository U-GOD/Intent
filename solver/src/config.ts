/**
 * SuiIntents Solver Configuration
 */

export const config = {
    network: (process.env.SUI_NETWORK as 'mainnet' | 'testnet' | 'devnet') || 'testnet',
    
    // Contract addresses (update after deployment)
    packageId: process.env.PACKAGE_ID || '0x...',
    registryId: process.env.REGISTRY_ID || '0x...',
    
    // DeepBook V3 addresses (testnet)
    deepbook: {
        package: '0x2c8d603bc51326b8c13cef9dd07031a408a48dddb541963357f2b0ca48078ed7',
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
