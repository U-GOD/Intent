export interface Token {
  symbol: string;
  name: string;
  icon: string;
  type: string;
  decimals: number;
}

export const TOKENS: Token[] = [
  {
    symbol: 'SUI',
    name: 'Sui',
    icon: 'https://cryptologos.cc/logos/sui-sui-logo.png?v=026',
    type: '0x2::sui::SUI',
    decimals: 9
  },
  {
    symbol: 'USDC',
    name: 'USDC',
    icon: 'https://cryptologos.cc/logos/usd-coin-usdc-logo.png?v=026',
    // Testnet DeepBook USDC
    type: '0xf7152c05930480cd740d7311b5b8b45c6f488e3a53a11c3f74a6fac36a52e0d7::DBUSDC::DBUSDC',
    decimals: 6
  },
  {
    symbol: 'DEEP',
    name: 'DeepBook Token',
    icon: 'https://assets.coingecko.com/coins/images/32297/standard/deep.png?1696502280',
    type: '0x36dbef866a1d62bf7328989a10fb2f07d769f4ee587c0de4a0a256e57e0a58a8::deep::DEEP',
    decimals: 6
  },
  {
    symbol: 'wETH',
    name: 'Wrapped Ether',
    icon: 'https://cryptologos.cc/logos/ethereum-eth-logo.png?v=026',
    type: '0x0::dummy::WETH', // Placeholder for now
    decimals: 8
  },
  {
    symbol: 'USDT',
    name: 'Tether USD',
    icon: 'https://cryptologos.cc/logos/tether-usdt-logo.png?v=026',
    type: '0x0::dummy::USDT', // Placeholder for now
    decimals: 6
  }
];
