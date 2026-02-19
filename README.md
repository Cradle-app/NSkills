<p align="center">
  <img src="apps/web/src/assets/blocks/BNB Chain.png" alt="BNB Chain" width="80" />
</p>

<h1 align="center">🌱 [N]skills</h1>
<p align="center"><strong>Build your Web3 foundation. Then vibe.</strong></p>
<p align="center">
  A visual foundation builder for BNB Chain Web3 projects — drag, connect, configure, generate.
</p>

---

## What is [N]skills?

[N]skills is a visual blueprint builder for Web3 projects. Instead of starting from a blank slate or vibecoding your entire architecture, define your project structure visually, generate structured and organized code, then fine-tune with AI tools like Cursor or Copilot.

```
┌─────────────────────────────────────────────────────────────┐
│  🎨 Visual Design  →  📦 Generate Code  →  ✨ AI Enhance    │
│                                                             │
│  "I want BNB          "Here's your        "Now let's add    │
│   contracts with       organized           that custom       │
│   wallet auth and      codebase with       feature with      │
│   Dune analytics"      proper structure"   Cursor..."        │
└─────────────────────────────────────────────────────────────┘
```

---

## Documentation

| Document | Description |
|----------|-------------|
| [docs/PROJECT.md](./docs/PROJECT.md) | Problem, solution, impact & roadmap |
| [docs/TECHNICAL.md](./docs/TECHNICAL.md) | Architecture, setup & demo guide |
| [docs/EXTRAS.md](./docs/EXTRAS.md) | Demo video & presentation links |
| [bsc.address](./bsc.address) | All deployed contract addresses |

---

## 🟡 BNB Chain — Deployed Contracts

<p>
  <img src="apps/web/src/assets/blocks/BNB Chain.png" alt="BNB Chain" width="24" style="vertical-align:middle;" />
  &nbsp;<strong>BSC Smart Chain Testnet</strong> (Chain ID: 97)
</p>

| Contract | Address | Verified |
|----------|---------|---------|
| Voting | [`0x8a64dFb64A71AfD00F926064E1f2a0B9a7cBe7dD`](https://testnet.bscscan.com/address/0x8a64dFb64A71AfD00F926064E1f2a0B9a7cBe7dD#readContract) | ✅ |
| Auction | [`0x00320016Ad572264a64C98142e51200E60f73bCE`](https://testnet.bscscan.com/address/0x00320016Ad572264a64C98142e51200E60f73bCE) | ✅ |
| Group Savings | [`0x9C8ca8Cb9eC9886f2cbD9917F083D561e773cF28`](https://testnet.bscscan.com/address/0x9C8ca8Cb9eC9886f2cbD9917F083D561e773cF28) | ✅ |
| Marketplace | [`0x1E15115269D39e6F7D89a73331D7A0aC99a9Fb61`](https://testnet.bscscan.com/address/0x1E15115269D39e6F7D89a73331D7A0aC99a9Fb61#code) | ✅ |
| Lottery | [`0x9bb658a999a46d149262fe74d37894ac203ca493`](https://testnet.bscscan.com/address/0x9bb658a999a46d149262fe74d37894ac203ca493) | ✅ |
| Crowd Funding | [`0x96bbbef124fe87477244d8583f771fdf6c2f0ed6`](https://testnet.bscscan.com/address/0x96bbbef124fe87477244d8583f771fdf6c2f0ed6) | ✅ |
| Bounty Board | [`0x54e583f445b5b4736628d04fcff66698977b4b00`](https://testnet.bscscan.com/address/0x54e583f445b5b4736628d04fcff66698977b4b00) | ✅ |

<p>
  <img src="apps/web/src/assets/blocks/BNB Chain.png" alt="BNB Chain" width="24" style="vertical-align:middle;" />
  &nbsp;<strong>opBNB Testnet</strong> (Chain ID: 5611)
</p>

| Contract | Address | Verified |
|----------|---------|---------|
| Voting | [`0x8a64dFb64A71AfD00F926064E1f2a0B9a7cBe7dD`](https://opbnb-testnet.bscscan.com/address/0x8a64dFb64A71AfD00F926064E1f2a0B9a7cBe7dD#code) | ✅ |
| Auction | [`0xea2c7377fd34366878516bd68ccb469016b529d9`](https://opbnb-testnet.bscscan.com/address/0xea2c7377fd34366878516bd68ccb469016b529d9#code) | ✅ |
| Group Savings | [`0xB9896Cb9aC638EE36324B57c6eF8E88668Ef6c3c`](https://opbnb-testnet.bscscan.com/address/0xB9896Cb9aC638EE36324B57c6eF8E88668Ef6c3c#code) | ✅ |
| Marketplace | [`0x00320016Ad572264a64C98142e51200E60f73bCE`](https://opbnb-testnet.bscscan.com/address/0x00320016Ad572264a64C98142e51200E60f73bCE#code) | ✅ |
| Lottery | [`0x59c9ca4D0fd69674705043525FF0e063F9A6F13E`](https://opbnb-testnet.bscscan.com/address/0x59c9ca4D0fd69674705043525FF0e063F9A6F13E#code) | ✅ |
| Crowd Funding | [`0x9C8ca8Cb9eC9886f2cbD9917F083D561e773cF28`](https://opbnb-testnet.bscscan.com/address/0x9C8ca8Cb9eC9886f2cbD9917F083D561e773cF28#code) | ✅ |
| Bounty Board | [`0xB7743a347Ec63456F6b2fCa4DdDC1b39c86875E9`](https://opbnb-testnet.bscscan.com/address/0xB7743a347Ec63456F6b2fCa4DdDC1b39c86875E9#code) | ✅ |

---

## 🚀 Quick Start

```bash
# Clone
git clone https://github.com/Cradle-app/Cradle.git
cd Cradle

# Install
npx --yes pnpm@9.0.0 install

# Build
npx --yes pnpm@9.0.0 build

# Run
npx --yes pnpm@9.0.0 dev
```

Open **http://localhost:3001** and start building.

> See [docs/TECHNICAL.md](./docs/TECHNICAL.md) for full setup, environment variables, and GitHub OAuth configuration.

---

## 🏗️ Architecture

```
cradle/
├── apps/
│   ├── web/                  # Next.js 14 visual editor (port 3001)
│   └── orchestrator/         # Fastify code generation API (port 3000)
├── packages/
│   ├── blueprint-schema/     # Zod validation schemas
│   ├── plugin-config/        # Plugin metadata & registry
│   ├── plugin-sdk/           # Base plugin class
│   └── plugins/              # All component plugin implementations
├── docs/                     # Project documentation
└── bsc.address               # Deployed contract addresses
```

---

## 🧩 BNB Chain Nodes

Build your BNB Chain foundation visually with these contract nodes:

| Node | Contract | Networks |
|------|----------|---------|
| 🗳️ **BNB Voting** | On-chain governance voting | BSC Testnet + opBNB Testnet |
| 🔨 **BNB Auction** | Escrow-based English auction | BSC Testnet + opBNB Testnet |
| 🐷 **BNB Group Savings** | Collective savings with goal tracking | BSC Testnet + opBNB Testnet |
| 🛒 **BNB Marketplace** | Escrow marketplace for goods/services | BSC Testnet + opBNB Testnet |

Each node ships with a **live interaction panel** — connect your wallet, switch chains, and interact with deployed contracts directly from the [N]skills UI.

---

## 🎨 BNB Chain Templates

Two ready-to-use templates combine multiple BNB ecosystem tools:

### Binance Smart Dapp
Voting contract + Frontend Scaffold + OpenClaw + Onchain Activity + Dune Analytics + Pyth + Chainlink + Uniswap + Wallet Auth

### BNB MetaStack
All 3 BNB contracts + Frontend + IPFS + Wallet Auth + Pyth + Chainlink + Uniswap + Onchain Activity + OpenClaw + Aave + x402 Paywall + Dune (Token Price, DEX Volume, Protocol TVL, Transaction History)

---

## 🧩 All Components

### BNB Chain (Solidity)
- **BNB Voting Contract** — On-chain governance
- **BNB Auction Contract** — Escrow English auction
- **BNB Group Savings Contract** — Collective savings goals
- **BNB Marketplace Contract** — Escrow marketplace

### Smart Contracts (Arbitrum Stylus)
- **[@cradle/erc20-stylus](./packages/components/erc20-stylus)** — ERC-20 with mintable, burnable, pausable
- **[@cradle/erc721-stylus](./packages/components/erc721-stylus)** — ERC-721 NFT with enumerable + batch mint
- **[@cradle/erc1155-stylus](./packages/components/erc1155-stylus)** — ERC-1155 multi-token with batch ops

### Infrastructure & Auth
- **Frontend Scaffold** — Next.js + wagmi + RainbowKit + Tailwind
- **[@cradle/wallet-auth](./packages/components/wallet-auth)** — RainbowKit + wagmi multi-chain auth
- **IPFS Storage** — Decentralized file storage integration

### Oracles & DeFi
- **Pyth Oracle** — Real-time price feeds
- **Chainlink Price Feed** — Decentralized oracle data
- **Uniswap Swap** — DEX swap integration
- **Aave** — Lending/borrowing protocol
- **x402 Paywall** — HTTP 402 payment-gated endpoints

### Data & Analytics
- **[@cradle/onchain-activity](./packages/components/onchain-activity)** — Wallet tx history via Alchemy
- **Dune Analytics** — 9 specialized plugins (Token Price, DEX Volume, Protocol TVL, Transaction History, Gas, NFT Floor, Wallet Balances, Address Labels, SQL)

### AI & Agents
- **[@cradle/erc8004-agent](./packages/components/erc8004-agent)** — On-chain AI agent registry
- **OpenClaw Agent** — AI agent integration
- **AIXBT Intelligence** — 4 AI market intelligence plugins

---

## 💡 How It Works

1. **Design** — Drag BNB contract nodes and other components from the palette onto the canvas
2. **Configure** — Click any node to open its config panel and interact with live deployed contracts
3. **Connect** — Link components to define dependencies and data flow
4. **Generate** — Click "Generate" to create a structured codebase, optionally pushed to GitHub
5. **Develop** — Open in Cursor or VS Code; build your features on a solid base

### AI-Powered Workflow
- **Chat with AI** — Describe your app in natural language; AI suggests the right architecture
- **Smart Generation** — AI creates a complete blueprint with properly connected components
- **Iterative Refinement** — Continue the conversation to adjust and improve your design

---

## 🔐 Authentication

[N]skills uses a dual authentication system:

1. **Wallet Auth** — Connect MetaMask, WalletConnect, or any Web3 wallet
2. **GitHub Auth** — OAuth integration to push generated code directly to your repositories

---

## 🔒 Security

- Secrets isolated and never committed
- Template injection prevented
- Rate limiting on all API endpoints
- Generated contracts follow Solidity security best practices

---

**[N]skills** — *Build your Web3 foundation. Then vibe.* ✨
