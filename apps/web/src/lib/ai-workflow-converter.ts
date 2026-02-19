import type { BlueprintNode } from '@dapp-forge/blueprint-schema';

// Map AI tool types to our in-app node types
const toolTypeMap: Record<string, string> = {
  // Contracts
  'stylus_contract': 'stylus-contract',
  'stylus_zk_contract': 'stylus-zk-contract',
  'stylus_rust_contract': 'stylus-rust-contract',
  'smartcache_caching': 'smartcache-caching',
  'auditware_analyzing': 'auditware-analyzing',
  'eip7702_smart_eoa': 'eip7702-smart-eoa',
  'zk_primitives': 'zk-primitives',
  // Payments
  'x402_paywall': 'x402-paywall-api',
  'paywall': 'x402-paywall-api',
  // Agents
  'erc8004_agent': 'erc8004-agent-runtime',
  'ai_agent': 'erc8004-agent-runtime',
  'ostium_trading': 'ostium-trading',
  'maxxit_lazy_trader': 'maxxit',
  'maxxit_trader': 'maxxit',
  'maxxit': 'maxxit',
  'aster_dex': 'aster-dex',
  'aster': 'aster-dex',
  'onchain_activity': 'onchain-activity',
  'pyth_oracle': 'pyth-oracle',
  'chainlink_price_feed': 'chainlink-price-feed',
  'chainlink_price': 'chainlink-price-feed',
  'uniswap_swap': 'uniswap-swap',
  'uniswap': 'uniswap-swap',
  'swap': 'uniswap-swap',
  'aave_lending': 'aave-lending',
  'aave': 'aave-lending',
  'lending': 'aave-lending',
  'compound_lending': 'compound-lending',
  'compound': 'compound-lending',
  // App
  'wallet_auth': 'wallet-auth',
  'rpc_provider': 'rpc-provider',
  'arbitrum_bridge': 'arbitrum-bridge',
  'chain_data': 'chain-data',
  'ipfs_storage': 'ipfs-storage',
  'chain_abstraction': 'chain-abstraction',
  'frontend': 'frontend-scaffold',
  'frontend_scaffold': 'frontend-scaffold',
  'sdk_generator': 'sdk-generator',
  // Telegram
  'telegram_notifications': 'telegram-notifications',
  'telegram_commands': 'telegram-commands',
  'telegram_ai_agent': 'telegram-ai-agent',
  'telegram_wallet_link': 'telegram-wallet-link',
  // Quality
  'quality_gates': 'repo-quality-gates',
  'repo_quality_gates': 'repo-quality-gates',
  // AIXBT Intelligence
  'aixbt_momentum': 'aixbt-momentum',
  'aixbt_signals': 'aixbt-signals',
  'aixbt_indigo': 'aixbt-indigo',
  'aixbt_observer': 'aixbt-observer',
  // Superposition
  'superposition_network': 'superposition-network',
  'superposition_bridge': 'superposition-bridge',
  'superposition_longtail': 'superposition-longtail',
  'superposition_super_assets': 'superposition-super-assets',
  'superposition_thirdweb': 'superposition-thirdweb',
  'superposition_utility_mining': 'superposition-utility-mining',
  'superposition_faucet': 'superposition-faucet',
  'superposition_meow_domains': 'superposition-meow-domains',
  // Robinhood
  'robinhood_network': 'robinhood-network',
  'robinhood_deployment': 'robinhood-deployment',
  'robinhood_contracts': 'robinhood-contracts',
  // OpenClaw
  'openclaw_agent': 'openclaw-agent',
  'openclaw': 'openclaw-agent',
  // BNB
  'bnb_voting_contract': 'bnb-voting-contract',
  'bnb_voting': 'bnb-voting-contract',
  'bnb_auction_contract': 'bnb-auction-contract',
  'bnb_auction': 'bnb-auction-contract',
  'bnb_groupsavings_contract': 'bnb-groupsavings-contract',
  'bnb_groupsavings': 'bnb-groupsavings-contract',
  'bnb_lottery_contract': 'bnb-lottery-contract',
  'bnb_lottery': 'bnb-lottery-contract',
  'crowdfunding_contract': 'crowdfunding-contract',
  'crowdfunding': 'crowdfunding-contract',
  'bounty_board_contract': 'bounty-board-contract',
  'bounty_board': 'bounty-board-contract',
  'bnb_marketplace_contract': 'bnb-marketplace-contract',
  'bnb_marketplace': 'bnb-marketplace-contract',
  'bnb_voting_contracts': 'bnb-voting-contract',
  'voting_contract': 'bnb-voting-contract',
  'voting': 'bnb-voting-contract',
  'bnb_auction_contracts': 'bnb-auction-contract',
  'auction_contract': 'bnb-auction-contract',
  'auction': 'bnb-auction-contract',
  'bnb_groupsavings_contracts': 'bnb-groupsavings-contract',
  'groupsavings_contract': 'bnb-groupsavings-contract',
  'groupsavings': 'bnb-groupsavings-contract',
  'bnb_lottery_contracts': 'bnb-lottery-contract',
  'lottery_contract': 'bnb-lottery-contract',
  'lottery': 'bnb-lottery-contract',
  'crowdfunding_contracts': 'crowdfunding-contract',
  'bounty_board_contracts': 'bounty-board-contract',
  'bnb_marketplace_contracts': 'bnb-marketplace-contract',
  'marketplace_contract': 'bnb-marketplace-contract',
  'marketplace': 'bnb-marketplace-contract',
  // Dune
  'dune_execute_sql': 'dune-execute-sql',
  'dune_sql': 'dune-execute-sql',
  'dune_token_price': 'dune-token-price',
  'dune_price': 'dune-token-price',
  'dune_wallet_balances': 'dune-wallet-balances',
  'dune_balances': 'dune-wallet-balances',
  'dune_dex_volume': 'dune-dex-volume',
  'dune_volume': 'dune-dex-volume',
  'dune_nft_floor': 'dune-nft-floor',
  'dune_floor': 'dune-nft-floor',
  'dune_address_labels': 'dune-address-labels',
  'dune_labels': 'dune-address-labels',
  'dune_transaction_history': 'dune-transaction-history',
  'dune_history': 'dune-transaction-history',
  'dune_gas_price': 'dune-gas-price',
  'dune_gas': 'dune-gas-price',
  'dune_protocol_tvl': 'dune-protocol-tvl',
  'dune_tvl': 'dune-protocol-tvl',
};

// Valid node types in our system
const validNodeTypes = [
  'stylus-contract',
  'stylus-zk-contract',
  'stylus-rust-contract',
  'smartcache-caching',
  'auditware-analyzing',
  'eip7702-smart-eoa',
  'zk-primitives',
  'x402-paywall-api',
  'erc8004-agent-runtime',
  'ostium-trading',
  'maxxit',
  'aster-dex',
  'onchain-activity',
  'pyth-oracle',
  'chainlink-price-feed',
  'aave-lending',
  'compound-lending',
  'wallet-auth',
  'rpc-provider',
  'arbitrum-bridge',
  'chain-data',
  'ipfs-storage',
  'chain-abstraction',
  'frontend-scaffold',
  'sdk-generator',
  'telegram-notifications',
  'telegram-commands',
  'telegram-ai-agent',
  'telegram-wallet-link',
  'repo-quality-gates',
  'aixbt-momentum',
  'aixbt-signals',
  'aixbt-indigo',
  'aixbt-observer',
  'uniswap-swap',
  'superposition-network',
  'superposition-bridge',
  'superposition-longtail',
  'superposition-super-assets',
  'superposition-thirdweb',
  'superposition-utility-mining',
  'superposition-faucet',
  'superposition-meow-domains',
  'robinhood-network',
  'robinhood-deployment',
  'robinhood-contracts',
  'openclaw-agent',
  'bnb-voting-contract',
  'bnb-auction-contract',
  'bnb-groupsavings-contract',
  'bnb-lottery-contract',
  'crowdfunding-contract',
  'bounty-board-contract',
  'bnb-marketplace-contract',
  'dune-execute-sql',
  'dune-token-price',
  'dune-wallet-balances',
  'dune-dex-volume',
  'dune-nft-floor',
  'dune-address-labels',
  'dune-transaction-history',
  'dune-gas-price',
  'dune-protocol-tvl',
];

// Default node configs matching the blueprint store
const DEFAULT_NODE_CONFIGS: Record<string, Record<string, unknown>> = {
  'stylus-contract': {
    contractName: 'my-contract',
    contractInstructions: 'Describe your contract logic. Example: a counter with increment/decrement, or a token with mint/burn.',
  },
  'stylus-zk-contract': {
    contractName: 'MyZKToken',
    contractType: 'erc721',
    zkCircuitType: 'balance-proof',
    minBalance: '1000000000000000000',
    oracleEnabled: true,
    nullifierEnabled: true,
    testCoverage: true,
  },
  'x402-paywall-api': {
    resourcePath: '/api/premium/resource',
    priceInWei: '1000000000000000',
    currency: 'ETH',
    paymentTimeout: 300,
    receiptValidation: true,
    openApiSpec: true,
  },
  'erc8004-agent-runtime': {
    agentName: 'MyAgent',
    agentVersion: '0.1.0',
    capabilities: ['text-generation'],
    registryIntegration: true,
    modelProvider: 'openai',
    rateLimit: {
      requestsPerMinute: 60,
      tokensPerMinute: 100000,
    },
  },
  'repo-quality-gates': {
    ciProvider: 'github',
    testFramework: 'vitest',
    linter: 'biome',
    formatter: 'biome',
    typecheck: true,
    preCommitHooks: true,
    coverageThreshold: 80,
    securityScanning: true,
    dependencyAudit: true,
  },
  'frontend-scaffold': {
    framework: 'nextjs',
    styling: 'tailwind',
    web3Provider: 'wagmi',
    walletConnect: true,
    rainbowKit: true,
  },
  'sdk-generator': {
    outputFormat: 'typescript',
    includeABI: true,
    includeTypes: true,
    includeHooks: true,
  },
  'eip7702-smart-eoa': {
    delegateName: 'BatchExecutor',
    delegateType: 'batch-executor',
    features: ['batch-calls', 'sponsored-tx'],
    securityWarnings: true,
    generateUI: true,
  },
  'wallet-auth': {
    provider: 'rainbowkit',
    siweEnabled: true,
    socialLogins: [],
    sessionPersistence: true,
  },
  'rpc-provider': {
    primaryProvider: 'alchemy',
    fallbackProviders: ['public'],
    enableWebSocket: true,
    healthCheckInterval: 30000,
    retryAttempts: 3,
    privacyMode: false,
  },
  'arbitrum-bridge': {
    supportedTokens: ['ETH'],
    enableERC20: true,
    enableMessaging: false,
    generateUI: true,
    targetNetwork: 'arbitrum',
  },
  'chain-data': {
    provider: 'alchemy',
    features: ['token-balances', 'nft-data'],
    cacheEnabled: true,
    cacheDuration: 60000,
  },
  'ipfs-storage': {
    provider: 'pinata',
    generateMetadataSchemas: true,
    generateUI: true,
  },
  'chain-abstraction': {
    supportedChains: ['arbitrum', 'ethereum'],
    unifiedBalanceEnabled: true,
    autoChainSwitch: true,
    gasPaymentToken: 'native',
  },
  'zk-primitives': {
    proofTypes: ['membership'],
    clientSideProving: true,
    generateVerifiers: true,
  },
  'ostium-trading': {
    tradingPair: 'ETH/USD',
    leverage: 10,
    enableOneClick: true,
  },
  'maxxit': {},
  'aster-dex': {},
  'onchain-activity': {
    network: 'arbitrum',
    transactionLimit: '10',
    categories: ['erc20', 'external'],
  },
  'pyth-oracle': {
    chain: 'arbitrum',
    priceFeedId: '0xff61491a931112ddf1bd8147cd1a641aec071afd3d872d7f2118ca7f29d2d93e',
  },
  'chainlink-price-feed': {
    chain: 'arbitrum',
    feedAddress: '0x639Fe6ab55C921f74e7fac1ee960C0B6293ba612',
  },
  'aave-lending': {
    chain: 'arbitrum',
  },
  'compound-lending': {
    chain: 'arbitrum',
  },
  'telegram-notifications': {
    webhookEnabled: true,
    notificationTypes: ['transaction', 'price-alert'],
  },
  'telegram-commands': {
    commands: ['/start', '/help', '/balance'],
    webhookEnabled: true,
  },
  'telegram-ai-agent': {
    modelProvider: 'openai',
    personality: 'helpful',
    contextMemory: true,
  },
  'telegram-wallet-link': {
    verificationMethod: 'signature',
    multiWallet: false,
  },
  'aixbt-momentum': {
    projectId: 'bitcoin',
    interval: '24h',
    includeHistoricalData: true,
    trackClusterConvergence: true,
  },
  'aixbt-signals': {
    categories: ['LISTING', 'FUNDING', 'PARTNERSHIP'],
    minConvictionScore: 0.7,
    limit: 20,
  },
  'aixbt-indigo': {
    model: 'indigo-mini',
    systemPrompt: 'You are a professional market researcher provided by AIXBT.',
    outputFormat: 'markdown',
    useX402Paywall: true,
  },
  'aixbt-observer': {
    network: 'arbitrum',
    watchWallets: [],
    alertOnMomentumDrop: true,
    alertOnNegativeSignal: true,
  },
  'stylus-rust-contract': {
    network: 'arbitrum-sepolia',
    exampleType: 'counter',
    contractName: 'MyContract',
  },
  'smartcache-caching': {
    crateVersion: 'latest',
    autoOptIn: true,
  },
  'auditware-analyzing': {
    outputFormat: 'both',
    severityFilter: ['low', 'medium', 'high'],
    projectPath: '.',
  },
  'uniswap-swap': {
    tokenIn: 'ETH',
    tokenOut: 'USDC',
  },
  'superposition-network': {},
  'superposition-bridge': {},
  'superposition-longtail': {},
  'superposition-super-assets': {},
  'superposition-thirdweb': {},
  'superposition-utility-mining': {},
  'superposition-faucet': {},
  'superposition-meow-domains': {},
  'robinhood-network': {},
  'robinhood-deployment': {},
  'robinhood-contracts': {},
  'openclaw-agent': {},
  'bnb-voting-contract': {},
  'bnb-auction-contract': {},
  'bnb-groupsavings-contract': {},
  'bnb-lottery-contract': {},
  'crowdfunding-contract': {},
  'bounty-board-contract': {},
  'bnb-marketplace-contract': {},
  'dune-execute-sql': {
    queryId: '',
  },
  'dune-token-price': {
    tokenAddress: '',
  },
  'dune-wallet-balances': {
    walletAddress: '',
  },
  'dune-dex-volume': {},
  'dune-nft-floor': {},
  'dune-address-labels': {},
  'dune-transaction-history': {},
  'dune-gas-price': {},
  'dune-protocol-tvl': {},
};

// Generate proper UUIDs
const generateUUID = (): string => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

export interface AITool {
  id: string;
  type: string;
  name: string;
  next_tools: string[];
}

export interface AIResponse {
  agent_id?: string;
  tools: AITool[];
  has_sequential_execution?: boolean;
  description: string;
  raw_response?: string;
}

export interface WorkflowNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: Record<string, unknown>;
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  type: string;
  animated?: boolean;
}

/**
 * Convert AI response format to workflow nodes and edges
 */
export function aiResponseToWorkflow(aiResponse: AIResponse): {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  blueprintNodes: BlueprintNode[];
} {
  const nodes: WorkflowNode[] = [];
  const edges: WorkflowEdge[] = [];
  const blueprintNodes: BlueprintNode[] = [];

  // Create a map of AI tool IDs to our node IDs
  const toolIdToNodeId = new Map<string, string>();

  // Create nodes with proper positioning
  aiResponse.tools.forEach((tool, index) => {
    // Map AI tool type to our tool type
    const normalizedType = tool.type.toLowerCase().replace(/-/g, '_');
    const ourNodeType = toolTypeMap[normalizedType] || tool.type.replace(/_/g, '-');

    // Check if this tool type exists in our system
    if (!validNodeTypes.includes(ourNodeType)) {
      console.warn(`Unknown tool type from AI: ${tool.type} (mapped to: ${ourNodeType})`);
      return;
    }

    const nodeId = generateUUID();
    toolIdToNodeId.set(tool.id, nodeId);

    // Position nodes in a grid layout
    const row = Math.floor(index / 3);
    const col = index % 3;
    const position = {
      x: col * 320 + 150,
      y: row * 200 + 120,
    };

    // Get default config for this node type
    const config = DEFAULT_NODE_CONFIGS[ourNodeType] || {};

    // Create ReactFlow node
    const node: WorkflowNode = {
      id: nodeId,
      type: ourNodeType,
      position,
      data: {
        ...config,
        nodeType: ourNodeType,
        label: tool.name || ourNodeType,
      },
    };

    // Create Blueprint node
    const blueprintNode: BlueprintNode = {
      id: nodeId,
      type: ourNodeType as BlueprintNode['type'],
      position,
      config,
    };

    nodes.push(node);
    blueprintNodes.push(blueprintNode);
  });

  // Create edges based on next_tools relationships
  aiResponse.tools.forEach((tool) => {
    const sourceNodeId = toolIdToNodeId.get(tool.id);
    if (!sourceNodeId) return;

    tool.next_tools.forEach((nextToolId) => {
      const targetNodeId = toolIdToNodeId.get(nextToolId);
      if (targetNodeId) {
        edges.push({
          id: generateUUID(),
          source: sourceNodeId,
          target: targetNodeId,
          type: 'default',
          animated: true,
        });
      }
    });
  });

  return { nodes, edges, blueprintNodes };
}

/**
 * Check if a response is a valid AI workflow response
 */
export function isValidAIWorkflowResponse(data: unknown): data is AIResponse {
  if (!data || typeof data !== 'object') return false;

  const response = data as Record<string, unknown>;

  return (
    Array.isArray(response.tools) &&
    response.tools.length > 0 &&
    response.tools.every(
      (tool: unknown) => {
        if (!tool || typeof tool !== 'object') return false;
        const t = tool as Record<string, unknown>;
        return (
          typeof t.id === 'string' &&
          typeof t.type === 'string' &&
          Array.isArray(t.next_tools)
        );
      }
    )
  );
}

/**
 * Get available node types for AI prompt context
 */
export function getAvailableNodeTypesContext(): string {
  return `
Available components for building Web3 applications (Arbitrum, BNB Chain, etc.):

CONTRACTS:
- stylus_contract: Stylus contract - provide instructions, get markdown guide + counter template for LLM-assisted code gen
- stylus_zk_contract: Privacy-preserving contract with ZK proofs
- stylus_rust_contract: Build and deploy Rust contracts on Stylus
- smartcache_caching: Enable contract caching for cheaper gas costs
- auditware_analyzing: Security analysis with Radar static analyzer
- eip7702_smart_eoa: EIP-7702 Smart EOA delegation (trending)
- zk_primitives: Privacy proofs (membership, range, semaphore)

PAYMENTS:
- x402_paywall: HTTP 402 payment endpoint for monetization

AGENTS:
- erc8004_agent: AI agent with on-chain registry (ERC-8004)
- ostium_trading: One-click trading setup for Ostium
- maxxit_lazy_trader: Maxxit Lazy Trader API integration
- aster_dex: Aster DEX guidance block with API service scaffold
- onchain_activity: Fetch wallet transactions by category

APP:
- wallet_auth: WalletConnect, social login, SIWE authentication
- rpc_provider: Multi-provider RPC with failover
- arbitrum_bridge: L1-L2 bridging with Arbitrum SDK
- chain_data: Token/NFT data with Alchemy/Moralis
- ipfs_storage: Decentralized storage (Pinata/Web3.Storage)
- chain_abstraction: Unified multi-chain UX
- frontend_scaffold: Next.js/React frontend scaffold
- sdk_generator: TypeScript SDK from ABIs

TELEGRAM:
- telegram_notifications: Trigger alerts and updates
- telegram_commands: Handle interactive commands
- telegram_ai_agent: Conversational AI bot with LLM
- telegram_wallet_link: Link Telegram profiles with wallets

QUALITY:
- quality_gates: CI/CD, testing, linting setup

DEFI:
- uniswap_swap: Swap tokens on Uniswap

SUPERPOSITION:
- superposition_network: Superposition network integration
- superposition_bridge: Bridge assets to Superposition
- superposition_longtail: Longtail asset protocols
- superposition_super_assets: Manage Super Assets
- superposition_thirdweb: Thirdweb integration for Superposition
- superposition_utility_mining: Utility mining rewards
- superposition_faucet: Testnet faucet access
- superposition_meow_domains: ENS-like domains for Superposition

ROBINHOOD:
- robinhood_network: Robinhood network integration
- robinhood_deployment: Deploy contracts to Robinhood chain
- robinhood_contracts: Interact with Robinhood smart contracts

BNB CHAIN:
- bnb_voting_contract: Full-stack Voting dApp on BNB Chain
- bnb_auction_contract: Full-stack Auction dApp on BNB Chain
- bnb_groupsavings_contract: Full-stack Group Savings dApp
- bnb_lottery_contract: Full-stack Lottery dApp on BNB Chain
- crowdfunding_contract: Full-stack Crowdfunding dApp
- bounty_board_contract: Full-stack Bounty Board dApp
- bnb_marketplace_contract: Full-stack NFT/Asset Marketplace dApp

DUNE ANALYTICS:
- dune_execute_sql: Execute custom SQL queries
- dune_token_price: Fetch token prices
- dune_wallet_balances: Analyze wallet holdings
- dune_dex_volume: DEX trading volume metrics
- dune_nft_floor: NFT collection floor prices
- dune_address_labels: Address labeling and attribution
- dune_transaction_history: Historical query data
- dune_gas_price: Gas price tracking
- dune_protocol_tvl: Total Value Locked analytics

OTHER AGENTS:
- openclaw_agent: OpenClaw execution agent
`.trim();
}
