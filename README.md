# SuiIntents

An intent-based trading protocol built on the Sui blockchain that enables users to express high-level trading goals without managing execution complexity. Solvers compete via Dutch Auction to fulfill intents, optimizing for price, speed, and fees while leveraging DeepBook V3 for on-chain liquidity.

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [How It Works](#how-it-works)
- [Technical Components](#technical-components)
- [Protocol Mechanisms](#protocol-mechanisms)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Development](#development)
- [Testing](#testing)
- [License](#license)

## Overview

### Problem Statement

Traditional decentralized exchanges require users to:
- Understand complex routing and slippage parameters
- Manage gas fees and transaction timing
- Risk MEV (Maximal Extractable Value) attacks via public mempools
- Execute multiple transactions for complex operations

### Solution

SuiIntents abstracts execution complexity through an intent-based model:

1. **Users express outcomes**: "Swap 1000 USDC for SUI at the best possible price"
2. **Solvers compete**: Professional market makers bid to fulfill the intent
3. **Atomic execution**: Programmable Transaction Blocks (PTBs) ensure all-or-nothing settlement
4. **MEV protection**: Intents are not exposed to public mempools until execution

### Key Features

| Feature | Description |
|---------|-------------|
| Intent Abstraction | Users specify desired outcomes, not execution steps |
| Dutch Auction Pricing | Competitive price discovery that benefits users |
| Solver Competition | Market forces optimize execution quality |
| Gasless Trading | Solvers cover transaction fees on behalf of users |
| Atomic Settlement | PTBs guarantee complete success or full rollback |
| DeepBook Integration | Access to Sui's native CLOB liquidity |

## Architecture

```
                                    +------------------+
                                    |      User        |
                                    |     Wallet       |
                                    +--------+---------+
                                             |
                                             | 1. Sign Intent
                                             v
+------------------------------------------------------------------------------------+
|                              Frontend (React dApp)                                 |
|   - Wallet Connection (Sui dApp Kit)                                               |
|   - Intent Creation Interface                                                       |
|   - Real-time Status Tracking                                                       |
+------------------------------------------------------------------------------------+
                                             |
                                             | 2. Submit Transaction
                                             v
+------------------------------------------------------------------------------------+
|                           Sui Blockchain (On-Chain)                                |
|                                                                                    |
|   +----------------+    +------------------+    +----------------+                 |
|   | Intent         |    | Dutch Auction    |    | Escrow         |                 |
|   | Registry       |    | Engine           |    | Module         |                 |
|   |                |    |                  |    |                |                 |
|   | - Store intent |    | - Price decay    |    | - Lock tokens  |                 |
|   | - Track status |    | - Rate calc      |    | - Release/Refund|                |
|   | - Emit events  |    | - Claim logic    |    |                |                 |
|   +-------+--------+    +--------+---------+    +-------+--------+                 |
|           |                      |                      |                          |
|           +----------------------+----------------------+                          |
|                                  |                                                 |
|   +----------------+    +--------+---------+                                       |
|   | Solver         |    | DeepBook         |                                       |
|   | Registry       |    | Adapter          |                                       |
|   |                |    |                  |                                       |
|   | - Stake mgmt   |    | - Price queries  |                                       |
|   | - Reputation   |    | - Swap execution |                                       |
|   +----------------+    +------------------+                                       |
|                                                                                    |
+------------------------------------------------------------------------------------+
                                             |
                                             | 3. Event Subscription
                                             v
+------------------------------------------------------------------------------------+
|                           Solver Network (Off-Chain)                               |
|                                                                                    |
|   +----------------+    +----------------+    +----------------+                   |
|   | Solver 1       |    | Solver 2       |    | Solver N       |                   |
|   | (TypeScript)   |    | (TypeScript)   |    | (TypeScript)   |                   |
|   +-------+--------+    +-------+--------+    +-------+--------+                   |
|           |                     |                     |                            |
|           +---------------------+---------------------+                            |
|                                 |                                                  |
|                                 v                                                  |
|                    +------------+------------+                                     |
|                    | Price Engine            |                                     |
|                    | - DeepBook queries      |                                     |
|                    | - Profit calculation    |                                     |
|                    | - Risk management       |                                     |
|                    +-------------------------+                                     |
|                                                                                    |
+------------------------------------------------------------------------------------+
                                             |
                                             | 4. Execute via PTB
                                             v
+------------------------------------------------------------------------------------+
|                              DeepBook V3 (CLOB)                                    |
|                                                                                    |
|   - Central Limit Order Book                                                       |
|   - Deep liquidity pools                                                           |
|   - Low-latency execution                                                          |
|                                                                                    |
+------------------------------------------------------------------------------------+
```

## How It Works

### Intent Lifecycle

```
Phase 1: Creation
-----------------
User                          Blockchain                     
  |                               |                          
  |  Intent: 1000 USDC -> SUI    |                          
  |  Min Output: 970 SUI         |                          
  |  Deadline: 10 minutes        |                          
  |                               |                          
  +-----> Sign & Submit -------->|                          
  |                               |                          
  |                        +------+------+                   
  |                        | 1. Create   |                   
  |                        |    Intent   |                   
  |                        | 2. Lock     |                   
  |                        |    USDC     |                   
  |                        | 3. Start    |                   
  |                        |    Auction  |                   
  |                        | 4. Emit     |                   
  |                        |    Event    |                   
  |                        +------+------+                   
  |                               |                          

Phase 2: Dutch Auction
----------------------
Time    Auction Rate    Solver Action
----    ------------    -------------
T+0s    1050 SUI       Observe, calculate
T+10s   1040 SUI       Still waiting
T+20s   1030 SUI       Getting profitable
T+30s   1020 SUI       CLAIM (profit = 1020 - 965 - gas)

Phase 3: Execution (Atomic PTB)
-------------------------------
Command 0: Verify solver stake
Command 1: Claim intent at 1020 SUI rate
Command 2: Take 1000 USDC from escrow
Command 3: Swap USDC -> SUI via DeepBook
Command 4: Transfer 1020 SUI to user
Command 5: Keep remaining SUI as solver profit
Command 6: Mark intent fulfilled

Result: ALL succeed OR ALL revert

Phase 4: Settlement
-------------------
User receives: 1020 SUI (better than 970 minimum)
Solver profit: ~53 SUI (1020 rate - 965 cost - 2 gas)
Gas paid by: Solver (gasless for user)
```

### Failure Recovery

| Scenario | System Response |
|----------|-----------------|
| DeepBook swap fails | PTB reverts, USDC remains in escrow, intent stays pending |
| Solver lacks stake | Claim rejected, intent available for other solvers |
| Deadline expires | Anyone calls `expire_intent()`, USDC refunded to user |
| User cancels | If unclaimed, USDC refunded immediately |

## Technical Components

### Smart Contracts (Sui Move)

#### Intent Registry (`intent_registry.move`)

Core module managing intent lifecycle:

```move
struct Intent has key, store {
    id: UID,
    creator: address,
    input_type: TypeName,
    input_amount: u64,
    output_type: TypeName,
    min_output: u64,
    deadline: u64,
    status: u8,
    escrow_id: ID,
}

// Entry functions
public entry fun create_intent(...);
public entry fun fill_intent(...);
public entry fun cancel_intent(...);
public entry fun expire_intent(...);
```

#### Dutch Auction (`dutch_auction.move`)

Price discovery mechanism with linear decay:

```move
struct Auction has store {
    start_rate: u64,      // Best rate at T=0
    end_rate: u64,        // Minimum acceptable rate
    start_time: u64,      // Auction start timestamp
    duration: u64,        // Total auction duration
}

public fun get_current_rate(auction: &Auction, current_time: u64): u64;
public fun validate_fill(auction: &Auction, offered_rate: u64): bool;
```

#### Escrow (`escrow.move`)

Secure token custody:

```move
struct Escrow<phantom T> has key, store {
    id: UID,
    balance: Balance<T>,
    owner: address,
    intent_id: ID,
}

public fun deposit<T>(coin: Coin<T>, ...): Escrow<T>;
public fun release<T>(escrow: Escrow<T>, recipient: address, ...);
public fun refund<T>(escrow: Escrow<T>, ...);
```

#### Solver Registry (`solver_registry.move`)

Solver management and staking:

```move
struct Solver has key, store {
    id: UID,
    owner: address,
    stake: Balance<SUI>,
    reputation: u64,
    total_fills: u64,
}

public entry fun register_solver(stake: Coin<SUI>, ...);
public entry fun increase_stake(solver: &mut Solver, ...);
public entry fun withdraw_stake(solver: &mut Solver, ...);
public fun slash(solver: &mut Solver, amount: u64, ...);
```

#### DeepBook Adapter (`deepbook_adapter.move`)

Interface with DeepBook V3:

```move
public fun get_best_price(pool: &Pool, is_bid: bool): u64;
public fun execute_swap<BaseAsset, QuoteAsset>(
    pool: &mut Pool,
    input_coin: Coin<QuoteAsset>,
    min_output: u64,
    ...
): Coin<BaseAsset>;
```

### Off-Chain Components

#### Solver Bot (TypeScript)

```
solver/
├── src/
│   ├── index.ts              # Entry point
│   ├── event-listener.ts     # WebSocket subscription to events
│   ├── price-engine.ts       # DeepBook queries + profit calc
│   ├── executor.ts           # PTB construction + submission
│   ├── risk-manager.ts       # Position limits, gas estimation
│   └── config.ts             # Network, keys, parameters
├── package.json
└── tsconfig.json
```

Key dependencies:
- `@mysten/sui` - Sui TypeScript SDK
- `@mysten/deepbook-v3` - DeepBook client

#### Frontend (React)

```
frontend/
├── src/
│   ├── App.tsx
│   ├── components/
│   │   ├── WalletConnect.tsx
│   │   ├── IntentForm.tsx
│   │   ├── IntentStatus.tsx
│   │   └── AuctionVisualizer.tsx
│   ├── hooks/
│   │   ├── useIntentRegistry.ts
│   │   └── useAuctionPrice.ts
│   └── lib/
│       └── sui-client.ts
├── package.json
└── vite.config.ts
```

Key dependencies:
- `@mysten/dapp-kit` - Sui React components
- `@tanstack/react-query` - Data fetching

## Protocol Mechanisms

### Dutch Auction Mathematics

The auction rate decreases linearly from `start_rate` to `end_rate` over the `duration`:

```
current_rate = start_rate - ((start_rate - end_rate) * elapsed_time / duration)
```

Where:
- `start_rate` = Best possible rate (e.g., 105% of market)
- `end_rate` = User's minimum acceptable rate
- `elapsed_time` = current_time - start_time
- `duration` = User-specified deadline

### Solver Economics

Solver profit calculation:

```
profit = auction_rate - execution_cost - gas_fee

Where:
  auction_rate    = Rate locked when solver claims intent
  execution_cost  = Actual tokens spent on DeepBook swap
  gas_fee         = Transaction fee (paid by solver)
```

Solvers are incentivized to:
1. Claim early (higher auction rate)
2. Execute efficiently (lower execution cost)
3. Optimize gas usage

### Staking Requirements

- Minimum stake: 100 SUI (configurable)
- Stake locked during active fills
- Slashing for failed fills after claim
- Reputation score affects priority

## Getting Started

### Prerequisites

| Requirement | Version | Installation |
|-------------|---------|--------------|
| Rust | 1.70+ | https://rustup.rs |
| Sui CLI | 1.64+ | `cargo install --locked sui` |
| Node.js | 18+ | https://nodejs.org |
| pnpm | 8+ | `npm install -g pnpm` |

### Environment Setup

```bash
# 1. Clone the repository
git clone https://github.com/yourusername/Intent.git
cd Intent

# 2. Configure Sui CLI for testnet
sui client switch --env testnet

# 3. Create wallet (if needed)
sui client new-address ed25519

# 4. Get testnet SUI
# Visit: https://faucet.sui.io/?address=YOUR_ADDRESS

# 5. Verify setup
sui client gas
```

### Build Contracts

```bash
cd contracts
sui move build
sui move test
```

### Deploy to Testnet

```bash
sui client publish --gas-budget 100000000
```

## Project Structure

```
Intent/
├── contracts/                    # Sui Move smart contracts
│   ├── sources/
│   │   ├── intent_registry.move
│   │   ├── dutch_auction.move
│   │   ├── escrow.move
│   │   ├── solver_registry.move
│   │   └── deepbook_adapter.move
│   ├── tests/
│   │   └── intent_tests.move
│   └── Move.toml
│
├── solver/                       # Off-chain solver bot
│   ├── src/
│   │   ├── index.ts
│   │   ├── event-listener.ts
│   │   ├── price-engine.ts
│   │   ├── executor.ts
│   │   └── risk-manager.ts
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/                     # React dApp
│   ├── src/
│   │   ├── App.tsx
│   │   ├── components/
│   │   └── hooks/
│   ├── package.json
│   └── vite.config.ts
│
├── docs/                         # Documentation
│   └── notes.md
│
├── LICENSE
└── README.md
```

## Development

### Local Development Workflow

```bash
# Terminal 1: Run local Sui network (optional)
sui start --with-faucet

# Terminal 2: Deploy contracts
cd contracts
sui move build
sui client publish --gas-budget 100000000

# Terminal 3: Run solver
cd solver
pnpm install
pnpm dev

# Terminal 4: Run frontend
cd frontend
pnpm install
pnpm dev
```

### Code Style

- Move: Follow Sui Move conventions
- TypeScript: ESLint + Prettier
- Commits: Conventional Commits format

## Testing

### Unit Tests (Move)

```bash
cd contracts
sui move test
```

### Integration Tests

```bash
cd solver
pnpm test
```

### End-to-End Testing

1. Deploy contracts to testnet
2. Create intent via frontend
3. Run solver to fulfill
4. Verify settlement on Sui Explorer

## Roadmap

- [x] Phase 0: Environment Setup
- [ ] Phase 1: Core Intent Contracts
- [ ] Phase 2: DeepBook Integration
- [ ] Phase 3: Solver Infrastructure
- [ ] Phase 4: Frontend dApp
- [ ] Phase 5: Advanced Features
- [ ] Phase 6: Testing and Deployment

## References

- [Sui Documentation](https://docs.sui.io)
- [Sui Move Intro Course](https://github.com/sui-foundation/sui-move-intro-course)
- [DeepBook V3](https://github.com/MystenLabs/deepbookv3)
- [Sui TypeScript SDK](https://sdk.mystenlabs.com/typescript)
- [1inch Fusion](https://docs.1inch.io/docs/fusion-swap/introduction/) (Reference Architecture)
- [NEAR Intents](https://www.near.org/intents) (Reference Architecture)

## License

MIT License - see [LICENSE](LICENSE) for details.

---

Built for EthGlobal HackMoney 2026 - Sui Track
