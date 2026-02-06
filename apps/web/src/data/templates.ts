/**
 * Blueprint template definitions.
 *
 * Each template describes a pre-configured canvas layout with core nodes,
 * edges, and (in a future commit) ghost nodes that users can click to activate.
 *
 * Node positions follow a left-to-right DAG layout:
 *   - Source/contract blocks on the left   (x: 100–250)
 *   - Middleware blocks in the centre       (x: 350–550)
 *   - Frontend / output blocks on the right (x: 650–850)
 *   - Vertical spacing ~130 px between rows
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface TemplateNode {
  type: string;
  position: { x: number; y: number };
}

export interface TemplateEdge {
  /** Index into the nodes array (core edges) or combined [nodes...ghostNodes] array (ghost edges). */
  source: number;
  target: number;
}

export type TemplateCategory =
  | 'contracts'
  | 'defi'
  | 'nft'
  | 'ai'
  | 'telegram'
  | 'analytics'
  | 'superposition'
  | 'payments'
  | 'infrastructure';

export interface Template {
  id: string;
  name: string;
  description: string;
  /** Lucide icon name — mapped to a component in the modal. */
  icon: string;
  colorClass: string;
  category: TemplateCategory;
  tags: string[];
  /** Core blocks — always placed on canvas. */
  nodes: TemplateNode[];
  /** Core edges — indices reference nodes[]. */
  edges: TemplateEdge[];
  /** Ghost blocks — rendered as shimmer nodes the user can click to activate. Populated in a later commit. */
  ghostNodes: TemplateNode[];
  /** Ghost edges — indices reference combined [...nodes, ...ghostNodes]. Populated in a later commit. */
  ghostEdges: TemplateEdge[];
}

// ---------------------------------------------------------------------------
// Category metadata (used by the modal for filter tabs)
// ---------------------------------------------------------------------------

export const TEMPLATE_CATEGORIES: { id: TemplateCategory | 'all'; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'contracts', label: 'Contracts' },
  { id: 'defi', label: 'DeFi' },
  { id: 'nft', label: 'NFT' },
  { id: 'ai', label: 'AI / Agents' },
  { id: 'telegram', label: 'Telegram' },
  { id: 'analytics', label: 'Analytics' },
  { id: 'superposition', label: 'Superposition' },
  { id: 'payments', label: 'Payments' },
  { id: 'infrastructure', label: 'Infra' },
];

// ---------------------------------------------------------------------------
// Templates
//
// Design principles:
//   1. Superposition = Stylus-native chain → Superposition templates include
//      stylus-contract + smartcache-caching + auditware-analyzing.
//   2. Every Stylus contract (stylus-contract, stylus-rust-contract,
//      stylus-zk-contract) is paired with smartcache-caching (caching) and
//      auditware-analyzing (Radar TOML checker) as core or ghost blocks.
//   3. Most templates include erc8004-agent-runtime + x402-paywall-api as
//      core or ghost blocks — current industry trend.
//
// Layout: every template uses a topological left-to-right DAG layout.
//   - Nodes are assigned to tiers (columns) based on longest-path depth
//     from any root node in the edge graph.
//   - Column spacing: 300 px   (200 px node width + 100 px gap)
//   - Row spacing:    150 px   ( 90 px node height +  60 px gap)
//   - Ghost nodes are placed one tier after the last core tier.
//   - All edges flow strictly left-to-right.
// ---------------------------------------------------------------------------

export const TEMPLATES: Template[] = [
  // ── 1. Full Stack dApp ──────────────────────────────────────────────────
  // Flow: contract → {smartcache, auditware, frontend} → {wallet, rpc, chain-data}
  {
    id: 'full-stack-dapp',
    name: 'Full Stack dApp',
    description:
      'Stylus contract with SmartCache + Radar audit, frontend, wallet, RPC, chain data — agent + paywall ready via suggestions',
    icon: 'Layout',
    colorClass: 'success',
    category: 'contracts',
    tags: ['Full Stack', 'Stylus', 'Caching', 'Radar', 'Agent-Ready'],
    nodes: [
      { type: 'stylus-contract', position: { x: 0, y: 150 } },         // 0  T0
      { type: 'smartcache-caching', position: { x: 300, y: 0 } },      // 1  T1
      { type: 'auditware-analyzing', position: { x: 300, y: 150 } },   // 2  T1
      { type: 'frontend-scaffold', position: { x: 300, y: 300 } },     // 3  T1
      { type: 'wallet-auth', position: { x: 600, y: 0 } },             // 4  T2
      { type: 'rpc-provider', position: { x: 600, y: 150 } },          // 5  T2
      { type: 'chain-data', position: { x: 600, y: 300 } },            // 6  T2
    ],
    edges: [
      { source: 0, target: 1 },
      { source: 0, target: 2 },
      { source: 0, target: 3 },
      { source: 3, target: 4 },
      { source: 3, target: 5 },
      { source: 3, target: 6 },
    ],
    ghostNodes: [
      { type: 'erc8004-agent-runtime', position: { x: 900, y: 0 } },   // g0 (idx 7)
      { type: 'x402-paywall-api', position: { x: 900, y: 150 } },      // g1 (idx 8)
      { type: 'repo-quality-gates', position: { x: 900, y: 300 } },    // g2 (idx 9)
    ],
    ghostEdges: [
      { source: 3, target: 7 },  // frontend → agent
      { source: 3, target: 8 },  // frontend → paywall
      { source: 0, target: 9 },  // contract → quality-gates
    ],
  },

  // ── 2. Multi-Token Platform ─────────────────────────────────────────────
  // Flow: {erc20, erc721, erc1155} → {frontend, ipfs} → {wallet, chain-data}
  {
    id: 'multi-token-platform',
    name: 'Multi-Token Platform',
    description:
      'ERC-20 + ERC-721 + ERC-1155 with IPFS, wallet, chain data — SmartCache, Radar, and paywall as suggestions',
    icon: 'Layers',
    colorClass: 'accent-secondary',
    category: 'contracts',
    tags: ['Multi-Token', 'ERC-20', 'ERC-721', 'ERC-1155', 'Agent-Ready'],
    nodes: [
      { type: 'erc20-stylus', position: { x: 0, y: 0 } },             // 0  T0
      { type: 'erc721-stylus', position: { x: 0, y: 150 } },          // 1  T0
      { type: 'erc1155-stylus', position: { x: 0, y: 300 } },         // 2  T0
      { type: 'frontend-scaffold', position: { x: 300, y: 75 } },     // 3  T1
      { type: 'wallet-auth', position: { x: 600, y: 75 } },           // 4  T2
      { type: 'ipfs-storage', position: { x: 300, y: 225 } },         // 5  T1
      { type: 'chain-data', position: { x: 600, y: 225 } },           // 6  T2
    ],
    edges: [
      { source: 0, target: 3 },
      { source: 1, target: 3 },
      { source: 2, target: 3 },
      { source: 1, target: 5 },
      { source: 2, target: 5 },
      { source: 3, target: 4 },
      { source: 3, target: 6 },
    ],
    ghostNodes: [
      { type: 'smartcache-caching', position: { x: 900, y: 0 } },     // g0 (idx 7)
      { type: 'auditware-analyzing', position: { x: 900, y: 150 } },  // g1 (idx 8)
      { type: 'x402-paywall-api', position: { x: 900, y: 300 } },     // g2 (idx 9)
    ],
    ghostEdges: [
      { source: 0, target: 7 },  // erc20 → smartcache
      { source: 0, target: 8 },  // erc20 → auditware
      { source: 3, target: 9 },  // frontend → paywall
    ],
  },

  // ── 3. ZK Privacy dApp ──────────────────────────────────────────────────
  // Flow: zk-contract → {zk-primitives, auditware, frontend} → {wallet, chain-data}
  {
    id: 'zk-privacy-dapp',
    name: 'ZK Privacy dApp',
    description:
      'ZK Stylus contract + primitives + Radar audit, frontend, wallet, chain data — SmartCache, agent as suggestions',
    icon: 'ShieldCheck',
    colorClass: 'accent-primary',
    category: 'contracts',
    tags: ['ZK', 'Privacy', 'Stylus', 'Radar', 'Agent-Ready'],
    nodes: [
      { type: 'stylus-zk-contract', position: { x: 0, y: 150 } },     // 0  T0
      { type: 'zk-primitives', position: { x: 300, y: 0 } },          // 1  T1
      { type: 'auditware-analyzing', position: { x: 300, y: 150 } },  // 2  T1
      { type: 'frontend-scaffold', position: { x: 300, y: 300 } },    // 3  T1
      { type: 'wallet-auth', position: { x: 600, y: 75 } },           // 4  T2
      { type: 'chain-data', position: { x: 600, y: 225 } },           // 5  T2
    ],
    edges: [
      { source: 0, target: 1 },
      { source: 0, target: 2 },
      { source: 0, target: 3 },
      { source: 3, target: 4 },
      { source: 3, target: 5 },
    ],
    ghostNodes: [
      { type: 'smartcache-caching', position: { x: 900, y: 0 } },       // g0 (idx 6)
      { type: 'erc8004-agent-runtime', position: { x: 900, y: 150 } },  // g1 (idx 7)
      { type: 'repo-quality-gates', position: { x: 900, y: 300 } },     // g2 (idx 8)
    ],
    ghostEdges: [
      { source: 0, target: 6 },  // zk-contract → smartcache
      { source: 3, target: 7 },  // frontend → agent
      { source: 0, target: 8 },  // zk-contract → quality-gates
    ],
  },

  // ── 4. DeFi Dashboard ──────────────────────────────────────────────────
  // Flow: {aave, compound, uniswap} → {chainlink, pyth, frontend} → {wallet, rpc, chain-data}
  {
    id: 'defi-dashboard',
    name: 'DeFi Dashboard',
    description:
      'Aave, Compound, Uniswap + Chainlink/Pyth oracles, full frontend — agent + paywall ready for monetization',
    icon: 'TrendingUp',
    colorClass: 'success',
    category: 'defi',
    tags: ['Aave', 'Compound', 'Uniswap', 'Oracles', 'Agent-Ready'],
    nodes: [
      { type: 'aave', position: { x: 0, y: 0 } },                     // 0  T0
      { type: 'compound', position: { x: 0, y: 150 } },               // 1  T0
      { type: 'uniswap', position: { x: 0, y: 300 } },                // 2  T0
      { type: 'chainlink', position: { x: 300, y: 0 } },              // 3  T1
      { type: 'pyth', position: { x: 300, y: 150 } },                 // 4  T1
      { type: 'frontend-scaffold', position: { x: 300, y: 300 } },    // 5  T1
      { type: 'wallet-auth', position: { x: 600, y: 0 } },            // 6  T2
      { type: 'rpc-provider', position: { x: 600, y: 150 } },         // 7  T2
      { type: 'chain-data', position: { x: 600, y: 300 } },           // 8  T2
    ],
    edges: [
      { source: 0, target: 3 },
      { source: 1, target: 3 },
      { source: 2, target: 4 },
      { source: 0, target: 5 },
      { source: 1, target: 5 },
      { source: 2, target: 5 },
      { source: 5, target: 6 },
      { source: 5, target: 7 },
      { source: 5, target: 8 },
    ],
    ghostNodes: [
      { type: 'erc8004-agent-runtime', position: { x: 900, y: 0 } },   // g0 (idx 9)
      { type: 'x402-paywall-api', position: { x: 900, y: 150 } },      // g1 (idx 10)
      { type: 'dune-dex-volume', position: { x: 900, y: 300 } },       // g2 (idx 11)
    ],
    ghostEdges: [
      { source: 5, target: 9 },   // frontend → agent
      { source: 5, target: 10 },  // frontend → paywall
      { source: 5, target: 11 },  // frontend → dune-dex-volume
    ],
  },

  // ── 5. Autonomous Trading Platform ──────────────────────────────────────
  // Flow: {ostium, maxxit, erc20} → {chainlink, dune-dex, frontend, dune-token, telegram} → wallet
  {
    id: 'autonomous-trading-platform',
    name: 'Autonomous Trading Platform',
    description:
      'Ostium + Maxxit + ERC-20 + Chainlink + Dune analytics + Telegram — agent + paywall + SmartCache as suggestions',
    icon: 'Coins',
    colorClass: 'warning',
    category: 'defi',
    tags: ['Trading', 'Agents', 'Oracles', 'Telegram', 'Analytics'],
    nodes: [
      { type: 'ostium-trading', position: { x: 0, y: 150 } },           // 0  T0
      { type: 'maxxit', position: { x: 0, y: 300 } },                   // 1  T0
      { type: 'erc20-stylus', position: { x: 0, y: 450 } },             // 2  T0
      { type: 'chainlink', position: { x: 300, y: 0 } },                // 3  T1
      { type: 'dune-dex-volume', position: { x: 300, y: 150 } },        // 4  T1
      { type: 'dune-token-price', position: { x: 300, y: 450 } },       // 5  T1
      { type: 'telegram-ai-agent', position: { x: 300, y: 600 } },      // 6  T1
      { type: 'frontend-scaffold', position: { x: 300, y: 300 } },      // 7  T1 (center)
      { type: 'wallet-auth', position: { x: 600, y: 300 } },            // 8  T2
    ],
    edges: [
      { source: 0, target: 3 },
      { source: 0, target: 4 },
      { source: 1, target: 6 },
      { source: 2, target: 5 },
      { source: 2, target: 7 },
      { source: 0, target: 7 },
      { source: 1, target: 7 },
      { source: 7, target: 8 },
    ],
    ghostNodes: [
      { type: 'erc8004-agent-runtime', position: { x: 900, y: 0 } },   // g0 (idx 9)
      { type: 'x402-paywall-api', position: { x: 900, y: 150 } },      // g1 (idx 10)
      { type: 'smartcache-caching', position: { x: 900, y: 300 } },    // g2 (idx 11)
    ],
    ghostEdges: [
      { source: 7, target: 9 },   // frontend → agent
      { source: 7, target: 10 },  // frontend → paywall
      { source: 2, target: 11 },  // erc20 → smartcache
    ],
  },

  // ── 6. Cross-Chain Bridge dApp ──────────────────────────────────────────
  // Flow: {bridge, chain-abstraction} → {frontend, wallet, rpc} → chain-data
  {
    id: 'cross-chain-bridge',
    name: 'Cross-Chain Bridge dApp',
    description:
      'Arbitrum bridge + chain abstraction, full frontend — agent + paywall + smart EOA as suggestions',
    icon: 'ArrowLeftRight',
    colorClass: 'accent-primary',
    category: 'defi',
    tags: ['Bridge', 'Cross-Chain', 'Arbitrum', 'Agent-Ready'],
    nodes: [
      { type: 'arbitrum-bridge', position: { x: 0, y: 75 } },          // 0  T0
      { type: 'chain-abstraction', position: { x: 0, y: 225 } },       // 1  T0
      { type: 'frontend-scaffold', position: { x: 300, y: 0 } },       // 2  T1
      { type: 'wallet-auth', position: { x: 300, y: 150 } },           // 3  T1
      { type: 'rpc-provider', position: { x: 300, y: 300 } },          // 4  T1
      { type: 'chain-data', position: { x: 600, y: 150 } },            // 5  T2
    ],
    edges: [
      { source: 0, target: 2 },
      { source: 0, target: 3 },
      { source: 0, target: 4 },
      { source: 1, target: 2 },
      { source: 1, target: 3 },
      { source: 2, target: 5 },
    ],
    ghostNodes: [
      { type: 'erc8004-agent-runtime', position: { x: 900, y: 0 } },   // g0 (idx 6)
      { type: 'x402-paywall-api', position: { x: 900, y: 150 } },      // g1 (idx 7)
      { type: 'eip7702-smart-eoa', position: { x: 900, y: 300 } },     // g2 (idx 8)
    ],
    ghostEdges: [
      { source: 2, target: 6 },  // frontend → agent
      { source: 2, target: 7 },  // frontend → paywall
      { source: 1, target: 8 },  // chain-abstraction → eip7702
    ],
  },

  // ── 7. NFT Marketplace ─────────────────────────────────────────────────
  // Flow: {erc721, erc1155} → {ipfs, frontend, dune-nft, sdk} → {wallet, chain-data}
  {
    id: 'nft-marketplace',
    name: 'NFT Marketplace',
    description:
      'ERC-721 + ERC-1155 + IPFS + analytics + SDK — paywall, agent, and Radar as suggestions',
    icon: 'Image',
    colorClass: 'accent-secondary',
    category: 'nft',
    tags: ['NFT', 'Marketplace', 'IPFS', 'Analytics', 'Agent-Ready'],
    nodes: [
      { type: 'erc721-stylus', position: { x: 0, y: 75 } },           // 0  T0
      { type: 'erc1155-stylus', position: { x: 0, y: 225 } },         // 1  T0
      { type: 'ipfs-storage', position: { x: 300, y: 0 } },           // 2  T1
      { type: 'frontend-scaffold', position: { x: 300, y: 150 } },    // 3  T1
      { type: 'wallet-auth', position: { x: 600, y: 75 } },           // 4  T2
      { type: 'dune-nft-floor', position: { x: 300, y: 300 } },       // 5  T1
      { type: 'chain-data', position: { x: 600, y: 225 } },           // 6  T2
      { type: 'sdk-generator', position: { x: 300, y: 450 } },        // 7  T1
    ],
    edges: [
      { source: 0, target: 2 },
      { source: 1, target: 2 },
      { source: 0, target: 3 },
      { source: 1, target: 3 },
      { source: 3, target: 4 },
      { source: 0, target: 5 },
      { source: 3, target: 6 },
      { source: 0, target: 7 },
    ],
    ghostNodes: [
      { type: 'x402-paywall-api', position: { x: 900, y: 0 } },        // g0 (idx 8)
      { type: 'erc8004-agent-runtime', position: { x: 900, y: 150 } },  // g1 (idx 9)
      { type: 'auditware-analyzing', position: { x: 900, y: 300 } },    // g2 (idx 10)
    ],
    ghostEdges: [
      { source: 3, target: 8 },  // frontend → paywall
      { source: 3, target: 9 },  // frontend → agent
      { source: 0, target: 10 }, // erc721 → auditware
    ],
  },

  // ── 8. Intelligence-Driven NFT Platform ─────────────────────────────────
  // Flow: {erc721, aixbt-momentum, dune-wallet} → {ipfs, signals, nft-floor} → {telegram, frontend} → wallet
  {
    id: 'intelligence-nft-platform',
    name: 'Intelligence-Driven NFT Platform',
    description:
      'ERC-721 + IPFS + AIXBT intelligence + Dune analytics + Telegram alerts — agent, paywall, and Radar as suggestions',
    icon: 'Activity',
    colorClass: 'success',
    category: 'nft',
    tags: ['NFT', 'AIXBT', 'Analytics', 'Telegram', 'Agent-Ready'],
    nodes: [
      { type: 'erc721-stylus', position: { x: 0, y: 0 } },              // 0  T0
      { type: 'ipfs-storage', position: { x: 300, y: 0 } },             // 1  T1
      { type: 'aixbt-momentum', position: { x: 0, y: 150 } },           // 2  T0
      { type: 'aixbt-signals', position: { x: 300, y: 150 } },          // 3  T1
      { type: 'dune-nft-floor', position: { x: 300, y: 300 } },         // 4  T1
      { type: 'dune-wallet-balances', position: { x: 0, y: 300 } },     // 5  T0
      { type: 'telegram-notifications', position: { x: 600, y: 0 } },   // 6  T2
      { type: 'frontend-scaffold', position: { x: 600, y: 150 } },      // 7  T2
      { type: 'wallet-auth', position: { x: 900, y: 150 } },            // 8  T3
    ],
    edges: [
      { source: 0, target: 1 },
      { source: 0, target: 4 },
      { source: 0, target: 7 },
      { source: 2, target: 3 },
      { source: 3, target: 6 },
      { source: 4, target: 7 },
      { source: 5, target: 7 },
      { source: 7, target: 8 },
      { source: 2, target: 7 },
    ],
    ghostNodes: [
      { type: 'erc8004-agent-runtime', position: { x: 1200, y: 0 } },   // g0 (idx 9)
      { type: 'x402-paywall-api', position: { x: 1200, y: 150 } },      // g1 (idx 10)
      { type: 'auditware-analyzing', position: { x: 1200, y: 300 } },   // g2 (idx 11)
    ],
    ghostEdges: [
      { source: 7, target: 9 },   // frontend → agent
      { source: 7, target: 10 },  // frontend → paywall
      { source: 0, target: 11 },  // erc721 → auditware
    ],
  },

  // ── 9. AI Agent + Telegram Suite ────────────────────────────────────────
  // Flow: {agent, paywall} → {telegram-ai, commands, wallet, frontend} → notifications
  {
    id: 'ai-agent-telegram-suite',
    name: 'AI Agent + Telegram Suite',
    description:
      'ERC-8004 agent + x402 paywall + full Telegram bot suite + frontend — Stylus contract and Radar as suggestions',
    icon: 'Bot',
    colorClass: 'accent-primary',
    category: 'ai',
    tags: ['AI', 'Agent', 'Telegram', 'Paywall', 'Stylus-Ready'],
    nodes: [
      { type: 'erc8004-agent-runtime', position: { x: 0, y: 150 } },    // 0  T0
      { type: 'x402-paywall-api', position: { x: 0, y: 300 } },         // 1  T0
      { type: 'telegram-ai-agent', position: { x: 300, y: 0 } },        // 2  T1
      { type: 'telegram-commands', position: { x: 300, y: 150 } },      // 3  T1
      { type: 'telegram-notifications', position: { x: 600, y: 150 } }, // 4  T2
      { type: 'wallet-auth', position: { x: 300, y: 300 } },            // 5  T1
      { type: 'frontend-scaffold', position: { x: 300, y: 450 } },      // 6  T1
    ],
    edges: [
      { source: 0, target: 2 },
      { source: 0, target: 3 },
      { source: 0, target: 5 },
      { source: 1, target: 6 },
      { source: 2, target: 4 },
      { source: 0, target: 6 },
    ],
    ghostNodes: [
      { type: 'stylus-contract', position: { x: 900, y: 0 } },         // g0 (idx 7)
      { type: 'auditware-analyzing', position: { x: 900, y: 150 } },   // g1 (idx 8)
      { type: 'chain-data', position: { x: 900, y: 300 } },            // g2 (idx 9)
    ],
    ghostEdges: [
      { source: 7, target: 6 },  // stylus-contract → frontend
      { source: 7, target: 8 },  // stylus-contract → auditware
      { source: 6, target: 9 },  // frontend → chain-data
    ],
  },

  // ── 10. AI Intelligence Hub ─────────────────────────────────────────────
  // Flow: momentum → signals → {indigo, observer, telegram} → {agent, chain-data} → frontend
  {
    id: 'ai-intelligence-hub',
    name: 'AI Intelligence Hub',
    description:
      'Full AIXBT suite + ERC-8004 agent + Telegram alerts + chain data + frontend — paywall + analytics as suggestions',
    icon: 'Brain',
    colorClass: 'accent-secondary',
    category: 'ai',
    tags: ['AIXBT', 'Intelligence', 'Agent', 'Telegram'],
    nodes: [
      { type: 'aixbt-momentum', position: { x: 0, y: 150 } },            // 0  T0
      { type: 'aixbt-signals', position: { x: 250, y: 150 } },           // 1  T1
      { type: 'aixbt-indigo', position: { x: 500, y: 0 } },              // 2  T2
      { type: 'aixbt-observer', position: { x: 500, y: 150 } },          // 3  T2
      { type: 'erc8004-agent-runtime', position: { x: 750, y: 0 } },     // 4  T3
      { type: 'telegram-notifications', position: { x: 500, y: 300 } },  // 5  T2
      { type: 'chain-data', position: { x: 750, y: 150 } },              // 6  T3
      { type: 'frontend-scaffold', position: { x: 1000, y: 75 } },       // 7  T4
    ],
    edges: [
      { source: 0, target: 1 },
      { source: 1, target: 2 },
      { source: 1, target: 3 },
      { source: 2, target: 4 },
      { source: 1, target: 5 },
      { source: 3, target: 6 },
      { source: 0, target: 7 },
      { source: 4, target: 7 },
      { source: 6, target: 7 },
    ],
    ghostNodes: [
      { type: 'x402-paywall-api', position: { x: 1300, y: 0 } },        // g0 (idx 8)
      { type: 'dune-wallet-balances', position: { x: 1300, y: 150 } },   // g1 (idx 9)
      { type: 'wallet-auth', position: { x: 1300, y: 300 } },            // g2 (idx 10)
    ],
    ghostEdges: [
      { source: 7, target: 8 },   // frontend → paywall
      { source: 7, target: 9 },   // frontend → dune-wallet-balances
      { source: 7, target: 10 },  // frontend → wallet-auth
    ],
  },

  // ── 11. Trading Bot ─────────────────────────────────────────────────────
  // Flow: {ostium, maxxit, agent} → {dune-dex, chain-data, telegram, frontend} → wallet
  {
    id: 'trading-bot',
    name: 'Trading Bot',
    description:
      'Ostium + Maxxit + ERC-8004 agent + Dune DEX analytics + Telegram — paywall + token price as suggestions',
    icon: 'CandlestickChart',
    colorClass: 'warning',
    category: 'ai',
    tags: ['Trading', 'Ostium', 'Maxxit', 'Agent', 'Paywall-Ready'],
    nodes: [
      { type: 'ostium-trading', position: { x: 0, y: 75 } },            // 0  T0
      { type: 'maxxit', position: { x: 0, y: 225 } },                   // 1  T0
      { type: 'erc8004-agent-runtime', position: { x: 0, y: 375 } },    // 2  T0
      { type: 'dune-dex-volume', position: { x: 300, y: 0 } },          // 3  T1
      { type: 'chain-data', position: { x: 300, y: 150 } },             // 4  T1
      { type: 'telegram-ai-agent', position: { x: 300, y: 300 } },      // 5  T1
      { type: 'frontend-scaffold', position: { x: 300, y: 450 } },      // 6  T1
      { type: 'wallet-auth', position: { x: 600, y: 225 } },            // 7  T2
    ],
    edges: [
      { source: 0, target: 3 },
      { source: 0, target: 4 },
      { source: 1, target: 5 },
      { source: 2, target: 6 },
      { source: 0, target: 6 },
      { source: 1, target: 6 },
      { source: 6, target: 7 },
    ],
    ghostNodes: [
      { type: 'x402-paywall-api', position: { x: 900, y: 0 } },            // g0 (idx 8)
      { type: 'dune-token-price', position: { x: 900, y: 150 } },          // g1 (idx 9)
      { type: 'telegram-notifications', position: { x: 900, y: 300 } },    // g2 (idx 10)
    ],
    ghostEdges: [
      { source: 6, target: 8 },  // frontend → paywall
      { source: 6, target: 9 },  // frontend → dune-token-price
      { source: 5, target: 10 }, // telegram-ai-agent → notifications
    ],
  },

  // ── 12. Telegram-First dApp ─────────────────────────────────────────────
  // Flow: {tg-ai, erc20, dune-wallet} → {commands, notifs, wallet-link, agent} → frontend → wallet
  {
    id: 'telegram-first-dapp',
    name: 'Telegram-First dApp',
    description:
      'Full Telegram bot + ERC-8004 agent + ERC-20 token + Dune analytics + frontend — paywall, Radar, chain data as suggestions',
    icon: 'MessageSquare',
    colorClass: 'info',
    category: 'telegram',
    tags: ['Telegram', 'Agent', 'Token', 'Analytics', 'Paywall-Ready'],
    nodes: [
      { type: 'telegram-ai-agent', position: { x: 0, y: 75 } },          // 0  T0
      { type: 'telegram-commands', position: { x: 300, y: 0 } },          // 1  T1
      { type: 'telegram-notifications', position: { x: 300, y: 150 } },   // 2  T1
      { type: 'telegram-wallet-link', position: { x: 300, y: 300 } },     // 3  T1
      { type: 'erc8004-agent-runtime', position: { x: 300, y: 450 } },    // 4  T1
      { type: 'erc20-stylus', position: { x: 0, y: 225 } },              // 5  T0
      { type: 'dune-wallet-balances', position: { x: 0, y: 375 } },       // 6  T0
      { type: 'frontend-scaffold', position: { x: 600, y: 150 } },        // 7  T2
      { type: 'wallet-auth', position: { x: 600, y: 300 } },              // 8  T2
    ],
    edges: [
      { source: 0, target: 4 },
      { source: 0, target: 1 },
      { source: 0, target: 2 },
      { source: 0, target: 3 },
      { source: 5, target: 7 },
      { source: 4, target: 7 },
      { source: 6, target: 7 },
      { source: 7, target: 8 },
      { source: 3, target: 8 },
    ],
    ghostNodes: [
      { type: 'x402-paywall-api', position: { x: 900, y: 0 } },         // g0 (idx 9)
      { type: 'auditware-analyzing', position: { x: 900, y: 150 } },    // g1 (idx 10)
      { type: 'chain-data', position: { x: 900, y: 300 } },             // g2 (idx 11)
    ],
    ghostEdges: [
      { source: 7, target: 9 },   // frontend → paywall
      { source: 5, target: 10 },  // erc20 → auditware
      { source: 7, target: 11 },  // frontend → chain-data
    ],
  },

  // ── 13. Analytics Hub ──────────────────────────────────────────────────
  // Flow: {sql..labels} (2 cols of 4) → tx-history → frontend
  {
    id: 'analytics-hub',
    name: 'Analytics Hub',
    description:
      'All nine Dune analytics modules + frontend — agent, paywall, and wallet as suggestions',
    icon: 'BarChart3',
    colorClass: 'accent-primary',
    category: 'analytics',
    tags: ['Dune', 'Analytics', 'Full Suite', 'Agent-Ready'],
    nodes: [
      { type: 'dune-execute-sql', position: { x: 0, y: 0 } },             // 0  T0a
      { type: 'dune-token-price', position: { x: 0, y: 150 } },           // 1  T0a
      { type: 'dune-wallet-balances', position: { x: 0, y: 300 } },       // 2  T0a
      { type: 'dune-dex-volume', position: { x: 0, y: 450 } },            // 3  T0a
      { type: 'dune-nft-floor', position: { x: 300, y: 0 } },             // 4  T0b
      { type: 'dune-gas-price', position: { x: 300, y: 150 } },           // 5  T0b
      { type: 'dune-protocol-tvl', position: { x: 300, y: 300 } },        // 6  T0b
      { type: 'dune-address-labels', position: { x: 300, y: 450 } },      // 7  T0b
      { type: 'dune-transaction-history', position: { x: 600, y: 225 } }, // 8  T1
      { type: 'frontend-scaffold', position: { x: 900, y: 225 } },        // 9  T2
    ],
    edges: [
      { source: 0, target: 9 },
      { source: 1, target: 9 },
      { source: 2, target: 9 },
      { source: 3, target: 9 },
      { source: 4, target: 9 },
      { source: 5, target: 9 },
      { source: 6, target: 9 },
      { source: 7, target: 8 },
      { source: 8, target: 9 },
    ],
    ghostNodes: [
      { type: 'erc8004-agent-runtime', position: { x: 1200, y: 75 } },  // g0 (idx 10)
      { type: 'x402-paywall-api', position: { x: 1200, y: 225 } },      // g1 (idx 11)
      { type: 'wallet-auth', position: { x: 1200, y: 375 } },           // g2 (idx 12)
    ],
    ghostEdges: [
      { source: 9, target: 10 },  // frontend → agent
      { source: 9, target: 11 },  // frontend → paywall
      { source: 9, target: 12 },  // frontend → wallet-auth
    ],
  },

  // ── 14. Superposition Full Stack ────────────────────────────────────────
  // Flow: {network, stylus} → {smartcache, auditware, bridge, longtail} → frontend → wallet
  {
    id: 'superposition-full-stack',
    name: 'Superposition Full Stack',
    description:
      'Superposition L3 + Stylus contract + SmartCache + Radar + bridge + AMM + frontend — agent, paywall, Meow domains as suggestions',
    icon: 'Rocket',
    colorClass: 'accent-secondary',
    category: 'superposition',
    tags: ['Superposition', 'Stylus', 'L3', 'Caching', 'Radar'],
    nodes: [
      { type: 'superposition-network', position: { x: 0, y: 75 } },        // 0  T0
      { type: 'stylus-contract', position: { x: 0, y: 225 } },            // 1  T0
      { type: 'smartcache-caching', position: { x: 300, y: 0 } },         // 2  T1
      { type: 'auditware-analyzing', position: { x: 300, y: 150 } },      // 3  T1
      { type: 'superposition-bridge', position: { x: 300, y: 300 } },     // 4  T1
      { type: 'superposition-longtail', position: { x: 300, y: 450 } },   // 5  T1
      { type: 'frontend-scaffold', position: { x: 600, y: 150 } },        // 6  T2
      { type: 'wallet-auth', position: { x: 900, y: 150 } },              // 7  T3
    ],
    edges: [
      { source: 0, target: 4 },
      { source: 0, target: 5 },
      { source: 1, target: 2 },
      { source: 1, target: 3 },
      { source: 1, target: 6 },
      { source: 4, target: 6 },
      { source: 5, target: 6 },
      { source: 6, target: 7 },
    ],
    ghostNodes: [
      { type: 'erc8004-agent-runtime', position: { x: 1200, y: 0 } },       // g0 (idx 8)
      { type: 'x402-paywall-api', position: { x: 1200, y: 150 } },          // g1 (idx 9)
      { type: 'superposition-meow-domains', position: { x: 1200, y: 300 } },// g2 (idx 10)
    ],
    ghostEdges: [
      { source: 6, target: 8 },   // frontend → agent
      { source: 6, target: 9 },   // frontend → paywall
      { source: 0, target: 10 },  // network → meow-domains
    ],
  },

  // ── 15. Superposition DeFi + AI ─────────────────────────────────────────
  // Flow: {network, stylus, agent} → {auditware, longtail, bridge} → {dune-dex, frontend} → wallet
  {
    id: 'superposition-defi-ai',
    name: 'Superposition DeFi + AI',
    description:
      'Superposition L3 + Stylus contract + Radar + AMM + bridge + ERC-8004 agent + Dune DEX — paywall, SmartCache, Telegram as suggestions',
    icon: 'Zap',
    colorClass: 'warning',
    category: 'superposition',
    tags: ['Superposition', 'Stylus', 'Agent', 'DeFi', 'Radar'],
    nodes: [
      { type: 'superposition-network', position: { x: 0, y: 0 } },       // 0  T0
      { type: 'stylus-contract', position: { x: 0, y: 150 } },          // 1  T0
      { type: 'auditware-analyzing', position: { x: 300, y: 0 } },      // 2  T1
      { type: 'superposition-longtail', position: { x: 300, y: 150 } },  // 3  T1
      { type: 'superposition-bridge', position: { x: 300, y: 300 } },    // 4  T1
      { type: 'erc8004-agent-runtime', position: { x: 0, y: 300 } },     // 5  T0
      { type: 'dune-dex-volume', position: { x: 600, y: 0 } },           // 6  T2
      { type: 'frontend-scaffold', position: { x: 600, y: 150 } },       // 7  T2
      { type: 'wallet-auth', position: { x: 900, y: 150 } },             // 8  T3
    ],
    edges: [
      { source: 0, target: 3 },
      { source: 0, target: 4 },
      { source: 1, target: 2 },
      { source: 1, target: 7 },
      { source: 3, target: 6 },
      { source: 3, target: 7 },
      { source: 4, target: 7 },
      { source: 5, target: 7 },
      { source: 7, target: 8 },
    ],
    ghostNodes: [
      { type: 'x402-paywall-api', position: { x: 1200, y: 0 } },       // g0 (idx 9)
      { type: 'smartcache-caching', position: { x: 1200, y: 150 } },    // g1 (idx 10)
      { type: 'telegram-ai-agent', position: { x: 1200, y: 300 } },     // g2 (idx 11)
    ],
    ghostEdges: [
      { source: 7, target: 9 },   // frontend → paywall
      { source: 1, target: 10 },  // stylus-contract → smartcache
      { source: 5, target: 11 },  // agent → telegram
    ],
  },

  // ── 16. AI-Powered Paywall dApp ─────────────────────────────────────────
  // Flow: {paywall, erc20, agent} → {frontend, dune-token} → {wallet, rpc, chain-data}
  {
    id: 'ai-powered-paywall',
    name: 'AI-Powered Paywall dApp',
    description:
      'x402 paywall + ERC-20 + ERC-8004 agent + Dune token price + chain data — Radar, SmartCache, Telegram as suggestions',
    icon: 'CreditCard',
    colorClass: 'warning',
    category: 'payments',
    tags: ['Paywall', 'Agent', 'Token', 'Analytics', 'Stylus-Ready'],
    nodes: [
      { type: 'x402-paywall-api', position: { x: 0, y: 0 } },           // 0  T0
      { type: 'erc20-stylus', position: { x: 0, y: 150 } },             // 1  T0
      { type: 'erc8004-agent-runtime', position: { x: 0, y: 300 } },    // 2  T0
      { type: 'frontend-scaffold', position: { x: 300, y: 75 } },       // 3  T1
      { type: 'wallet-auth', position: { x: 600, y: 0 } },              // 4  T2
      { type: 'rpc-provider', position: { x: 600, y: 150 } },           // 5  T2
      { type: 'chain-data', position: { x: 600, y: 300 } },             // 6  T2
      { type: 'dune-token-price', position: { x: 300, y: 225 } },       // 7  T1
    ],
    edges: [
      { source: 0, target: 3 },
      { source: 0, target: 4 },
      { source: 1, target: 3 },
      { source: 1, target: 7 },
      { source: 2, target: 3 },
      { source: 3, target: 4 },
      { source: 3, target: 5 },
      { source: 3, target: 6 },
    ],
    ghostNodes: [
      { type: 'auditware-analyzing', position: { x: 900, y: 0 } },     // g0 (idx 8)
      { type: 'smartcache-caching', position: { x: 900, y: 150 } },     // g1 (idx 9)
      { type: 'telegram-ai-agent', position: { x: 900, y: 300 } },      // g2 (idx 10)
    ],
    ghostEdges: [
      { source: 1, target: 8 },   // erc20 → auditware
      { source: 1, target: 9 },   // erc20 → smartcache
      { source: 2, target: 10 },  // agent → telegram
    ],
  },

  // ── 17. EIP-7702 Smart Account ──────────────────────────────────────────
  // Flow: {eip7702, chain-abstraction} → {frontend, wallet} → rpc
  {
    id: 'eip7702-smart-account',
    name: 'EIP-7702 Smart Account',
    description:
      'Smart EOA + chain abstraction + frontend + wallet + RPC — agent, paywall, and gas analytics as suggestions',
    icon: 'KeyRound',
    colorClass: 'info',
    category: 'infrastructure',
    tags: ['EIP-7702', 'Smart EOA', 'Chain Abstraction', 'Agent-Ready'],
    nodes: [
      { type: 'eip7702-smart-eoa', position: { x: 0, y: 0 } },         // 0  T0
      { type: 'chain-abstraction', position: { x: 0, y: 150 } },        // 1  T0
      { type: 'frontend-scaffold', position: { x: 300, y: 0 } },        // 2  T1
      { type: 'wallet-auth', position: { x: 300, y: 150 } },            // 3  T1
      { type: 'rpc-provider', position: { x: 600, y: 75 } },            // 4  T2
    ],
    edges: [
      { source: 0, target: 2 },
      { source: 0, target: 3 },
      { source: 1, target: 2 },
      { source: 1, target: 3 },
      { source: 2, target: 4 },
    ],
    ghostNodes: [
      { type: 'erc8004-agent-runtime', position: { x: 900, y: 0 } },   // g0 (idx 5)
      { type: 'x402-paywall-api', position: { x: 900, y: 150 } },      // g1 (idx 6)
      { type: 'dune-gas-price', position: { x: 900, y: 300 } },        // g2 (idx 7)
    ],
    ghostEdges: [
      { source: 2, target: 5 },  // frontend → agent
      { source: 2, target: 6 },  // frontend → paywall
      { source: 2, target: 7 },  // frontend → dune-gas-price
    ],
  },

  // ── 18. Web3 SaaS Starter ──────────────────────────────────────────────
  // Flow: {stylus, paywall} → {smartcache, auditware, frontend} → {wallet, rpc, dune-wallet}
  {
    id: 'web3-saas-starter',
    name: 'Web3 SaaS Starter',
    description:
      'Stylus contract + SmartCache + Radar + x402 paywall + Dune analytics + frontend — agent, quality gates, SDK as suggestions',
    icon: 'Wrench',
    colorClass: 'info',
    category: 'contracts',
    tags: ['SaaS', 'Stylus', 'Paywall', 'Radar', 'Caching'],
    nodes: [
      { type: 'stylus-contract', position: { x: 0, y: 0 } },           // 0  T0
      { type: 'smartcache-caching', position: { x: 300, y: 0 } },      // 1  T1
      { type: 'auditware-analyzing', position: { x: 300, y: 150 } },   // 2  T1
      { type: 'x402-paywall-api', position: { x: 0, y: 150 } },        // 3  T0
      { type: 'frontend-scaffold', position: { x: 300, y: 300 } },     // 4  T1
      { type: 'wallet-auth', position: { x: 600, y: 0 } },             // 5  T2
      { type: 'rpc-provider', position: { x: 600, y: 150 } },          // 6  T2
      { type: 'dune-wallet-balances', position: { x: 600, y: 300 } },  // 7  T2
    ],
    edges: [
      { source: 0, target: 1 },
      { source: 0, target: 2 },
      { source: 0, target: 4 },
      { source: 3, target: 4 },
      { source: 4, target: 5 },
      { source: 4, target: 6 },
      { source: 4, target: 7 },
    ],
    ghostNodes: [
      { type: 'erc8004-agent-runtime', position: { x: 900, y: 0 } },   // g0 (idx 8)
      { type: 'repo-quality-gates', position: { x: 900, y: 150 } },    // g1 (idx 9)
      { type: 'sdk-generator', position: { x: 900, y: 300 } },         // g2 (idx 10)
    ],
    ghostEdges: [
      { source: 4, target: 8 },  // frontend → agent
      { source: 0, target: 9 },  // contract → quality-gates
      { source: 0, target: 10 }, // contract → sdk-generator
    ],
  },
];
