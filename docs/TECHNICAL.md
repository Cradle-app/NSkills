# [N]skills — Technical Documentation

<p align="center">
  <img src="../apps/web/src/assets/blocks/BNB Chain.png" alt="BNB Chain" width="60" />
</p>

---

## Architecture Overview

[N]skills is a **TypeScript monorepo** managed with pnpm workspaces and Turborepo. It consists of two applications and a set of shared packages.

```
cradle/
├── apps/
│   ├── web/                  # Next.js 14 visual editor (port 3001)
│   └── orchestrator/         # Fastify code generation engine (port 3000)
├── packages/
│   ├── blueprint-schema/     # Zod schemas for blueprint validation
│   ├── plugin-config/        # Plugin metadata & registry
│   ├── plugin-sdk/           # Base plugin class & interfaces
│   └── plugins/              # All component plugin implementations
├── docs/                     # Project documentation
└── bsc.address               # Deployed contract addresses
```

### Core Flow

```
User designs on canvas
        ↓
Blueprint JSON (nodes + edges)
        ↓
POST /blueprints/generate/sync  (Orchestrator API)
        ↓
Topological sort → Plugin.generate() per node
        ↓
In-memory filesystem (memfs)
        ↓
GitHub API push → Repository created
```

### Key Components

| Component | Tech | Role |
|-----------|------|------|
| Visual Canvas | React Flow | Drag-drop blueprint designer |
| Config Panels | React + Wagmi | Per-node live interaction UI |
| Blueprint Store | Zustand | Client-side state management |
| Orchestrator | Fastify | Code generation API server |
| Plugin System | TypeScript | Extensible node implementations |
| Code Output | memfs + GitHub API | In-memory FS → GitHub push |

---

## BNB Chain Node Architecture

Each BNB contract node follows this architecture:

```
packages/components/bnb-{name}/
├── contract/{name}/
│   ├── {Contract}.sol          # Solidity source
│   └── {contract}-abi.json     # Contract ABI
├── src/
│   ├── {Name}InteractionPanel.tsx   # React UI component
│   ├── cn.ts                        # Tailwind utility
│   └── index.ts                     # Package exports
├── package.json
└── tsconfig.json

apps/web/src/components/
├── contract-interactions/
│   └── {Name}InteractionPanel.tsx   # Web-app local copy (avoids Wagmi context issues)
└── config/forms/
    └── bnb-{name}-contract-form.tsx # Config panel form

packages/plugins/src/bnb-{name}-contract/
└── index.ts                         # Plugin implementation (code generation)
```

### Network Support

All four BNB contract nodes support dynamic network switching:

| Network | Chain ID | Status |
|---------|----------|--------|
| BNB Smart Chain Testnet | 97 | ✅ Active |
| opBNB Testnet | 5611 | ✅ Active |
| BNB Mainnet | 56 | 🔜 Coming Soon |
| opBNB Mainnet | 204 | 🔜 Coming Soon |

---

## Setup

### Prerequisites

- **Node.js** >= 20.0.0
- **pnpm** (installed automatically via npx if missing)
- A GitHub OAuth App (optional, for repo push feature)

### Installation

```bash
# Clone the repository
git clone https://github.com/Cradle-app/Cradle.git
cd Cradle

# Install all dependencies
npx --yes pnpm@9.0.0 install

# Build all packages
npx --yes pnpm@9.0.0 build
```

### Environment Variables

**`apps/orchestrator/.env`**
```env
PORT=3000
CORS_ORIGIN=http://localhost:3001
GITHUB_TOKEN=your-personal-access-token
```

**`apps/web/.env.local`**
```env
ORCHESTRATOR_URL=http://localhost:3000
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your-walletconnect-project-id
GITHUB_CLIENT_ID=your-oauth-client-id
GITHUB_CLIENT_SECRET=your-oauth-client-secret
```

### Running the Application

**Option 1: Run everything together**
```bash
npx --yes pnpm@9.0.0 dev
```

**Option 2: Run services separately**
```bash
# Terminal 1 — Orchestrator API (port 3000)
npx --yes pnpm@9.0.0 --filter @cradle/orchestrator dev

# Terminal 2 — Web Frontend (port 3001)
npx --yes pnpm@9.0.0 --filter @cradle/web dev
```

**Scoped builds (faster iteration):**
```bash
# Build only the web app and its dependencies
pnpm build:web

# Build only the orchestrator
pnpm build:orchestrator
```

### Access Points

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3001 |
| Orchestrator API | http://localhost:3000 |
| Health Check | http://localhost:3000/health |

---

## GitHub OAuth Setup

To enable automatic repository creation from [N]skills:

1. Go to https://github.com/settings/developers → **New OAuth App**
2. Set **Homepage URL** to `http://localhost:3001`
3. Set **Authorization callback URL** to `http://localhost:3001/api/auth/github/callback`
4. Copy the **Client ID** and **Client Secret** into `apps/web/.env.local`

Without OAuth, you can still design blueprints, export JSON, and generate code locally.

---

## Demo Guide

### Creating a BNB Smart Dapp

1. Open http://localhost:3001
2. Click **Templates** in the header
3. Select the **"Binance Smart Chain"** category
4. Choose **"Binance Smart Dapp"** or **"BNB MetaStack"**
5. The canvas populates with pre-connected BNB nodes

### Interacting with a BNB Contract

1. Drag any **BNB Contract** node (e.g. BNB Voting) onto the canvas
2. Click the node to open its config panel
3. The **live interaction panel** loads below the address field
4. Use the **network dropdown** to switch between BSC Testnet and opBNB Testnet
5. Connect your wallet to perform write operations

### Generating Code

1. Design your blueprint on the canvas
2. Click **"Generate"** in the top header
3. Authenticate with GitHub (or skip to generate locally)
4. Receive your structured codebase — ready for Cursor/VS Code

---

## Troubleshooting

### Port Already in Use
```bash
# Windows
netstat -ano | findstr :3001
Stop-Process -Id <PID> -Force

# macOS/Linux
lsof -ti:3000 | xargs kill -9
lsof -ti:3001 | xargs kill -9
```

### Build Errors
```bash
rm -rf node_modules
npx --yes pnpm@9.0.0 install
npx --yes pnpm@9.0.0 build
```

### WagmiProvider Errors
All BNB contract interaction panels are inlined directly in `apps/web/src/components/contract-interactions/` to ensure they share the app's single WagmiProvider context. Do not import them from the component packages.
