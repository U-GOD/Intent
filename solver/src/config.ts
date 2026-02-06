/**
 * SuiIntents Solver Configuration
 */

export const config = {
    network: (process.env.SUI_NETWORK as 'mainnet' | 'testnet' | 'devnet') || 'testnet',
    
    // Deployed contract addresses (testnet) - V3 Auction Fix
    packageId: '0x20c655f1d8effe81dad9d6353ee1f10a753e512752f05c56b6e87ac024be1399',
    registryId: '0x9bce53af9d1a7836d577fd1732c33803fe2aff0a2f7a545f4132e402c9ddfc11',
    solverId: '0xaa0bfb1839dc9ac274f1cd7c9651b661ac28729f1bb684e7c434a1430788a274',
    
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
