# [N]skills — Project Overview

<p align="center">
  <img src="../apps/web/src/assets/blocks/BNB Chain.png" alt="BNB Chain" width="60" />
</p>

---

## Problem

Starting a Web3 project is hard — not because of the ideas, but because of the foundation.

Developers face three painful paths:
1. **Vibecoding with AI** — Generates chaotic, inconsistent code with no architecture
2. **Copy-paste boilerplate** — Stale templates, wrong dependencies, hours of cleanup
3. **Build from scratch** — Days lost on scaffolding before writing a single line of business logic

For hackathons, solo builders, and small teams especially, the setup phase eats half the available time before the actual product work begins. On BNB Chain, this is compounded by the need to integrate multiple BNB-native tools — opBNB, BNB Smart Chain contracts, oracles, DEXs, and analytics — all at once.

---

## Solution

**[N]skills** is a visual Web3 foundation builder. It lets you:

1. **Design visually** — Drag components onto a canvas, connect dependencies, configure settings through interactive panels
2. **Generate a foundation** — Get a clean, structured, organized codebase pushed directly to your GitHub
3. **Vibe from there** — Open in Cursor or VS Code and build your features on a solid base

[N]skills is not a code generator that writes your app — it gives you the **architecture and boilerplate** so your AI-assisted development sessions are productive, not chaotic.

### BNB Chain Integration

[N]skills has first-class support for BNB Chain through a dedicated "Binance Smart Chain" node category:

| Node | Description |
|------|-------------|
| **BNB Voting Contract** | Deploy & interact with on-chain governance |
| **BNB Auction Contract** | Escrow-based English auction |
| **BNB Group Savings** | Collective savings with goal tracking |
| **BNB Marketplace** | Escrow marketplace for services/goods |

Each BNB contract node supports both **BNB Smart Chain Testnet** and **opBNB Testnet** out of the box, with live interaction panels, chain switching, and verified deployed contracts.

---

## Impact

- **Reduces setup time** from days to minutes for Web3 developers
- **Democratizes architecture** — junior devs get senior-quality structure from day one
- **BNB Chain native** — purpose-built templates (Binance Smart Dapp, BNB MetaStack) that combine all BNB ecosystem tools into one coherent foundation
- **Multi-chain by default** — BSC Testnet + opBNB Testnet switching without any extra configuration

---

## Roadmap

### Phase 1 — Foundation (Current)
- [x] Visual canvas builder with 40+ node types
- [x] BNB Smart Chain contract nodes (Voting, Auction, Group Savings, Marketplace)
- [x] opBNB Testnet support with verified deployed contracts
- [x] Live contract interaction panels with wallet integration
- [x] Code generation → GitHub push
- [x] AI-assisted blueprint generation (natural language → architecture)
- [x] Binance Smart Dapp and BNB MetaStack templates

### Phase 2 — Ecosystem Expansion
- [ ] BNB Mainnet and opBNB Mainnet support
- [ ] Additional BNB-native contract templates (staking, DAO, vesting)
- [ ] Pancakeswap, Venus, and other BSC DeFi protocol nodes
- [ ] One-click contract deployment from [N]skills UI

### Phase 3 — Community
- [ ] Community marketplace for custom node plugins
- [ ] Blueprint sharing and forking
- [ ] Team collaboration on blueprints

---

## Limitations

- Contract deployment requires manual steps (Hardhat/Remix); [N]skills generates the code but does not deploy automatically in this version
- opBNB Mainnet contracts are not yet deployed (coming soon)
- The orchestrator requires a self-hosted instance; a managed cloud version is on the roadmap
