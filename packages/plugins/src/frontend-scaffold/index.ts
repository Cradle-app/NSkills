import { z } from 'zod';
import {
    BasePlugin,
    type PluginMetadata,
    type PluginPort,
    type PluginDependency,
    type CodegenOutput,
    type BlueprintNode,
    type ExecutionContext,
} from '@dapp-forge/plugin-sdk';
import { FrontendScaffoldConfig } from '@dapp-forge/blueprint-schema';
import {
    generateAppLayout,
    generateProviders,
    generateWagmiConfig,
    generateChainConfig,
    generatePackageJson,
    generateNextConfig,
    generateTailwindConfig,
    generateHomePage,
    generateWalletButton,
    generateGlobalStyles,
    generateEnvTypes,
    generateTsConfig,
    generateUtils,
    generatePostCSSConfig,
    generateViemTypes,
    generateViemChainsTypes,
} from './templates';
import { generateContractHooks, extractConnectedContracts } from './contract-integration';

/**
 * Frontend Scaffold Plugin
 * 
 * Generates a comprehensive Next.js Web3 application scaffold with:
 * - wagmi + viem for Web3 connectivity
 * - RainbowKit for wallet connection UI
 * - TanStack Query for state management
 * - Smart contract integration
 * - Tailwind CSS styling
 */
export class FrontendScaffoldPlugin extends BasePlugin<z.infer<typeof FrontendScaffoldConfig>> {
    readonly metadata: PluginMetadata = {
        id: 'frontend-scaffold',
        name: 'Frontend Scaffold',
        version: '0.1.0',
        description: 'Generate a Next.js Web3 application with wagmi, RainbowKit, and smart contract integration',
        category: 'app',
        tags: ['nextjs', 'web3', 'wagmi', 'rainbowkit', 'frontend', 'scaffold', 'dapp'],
    };

    readonly configSchema = FrontendScaffoldConfig as unknown as z.ZodType<z.infer<typeof FrontendScaffoldConfig>>;

    //   /**
    //  * Path to the pre-built component package
    //  */
    // readonly componentPath = 'packages/components/frontend-scaffold';

    //     /**
    //  * Package name for the component
    //  */
    // readonly componentPackage = '@cradle/frontend-scaffold';

    readonly ports: PluginPort[] = [
        {
            id: 'contract-in',
            name: 'Contract ABI',
            type: 'input',
            dataType: 'contract',
            required: false,
        },
        {
            id: 'network-in',
            name: 'Network Config',
            type: 'input',
            dataType: 'config',
            required: false,
        },
        {
            id: 'app-out',
            name: 'App Context',
            type: 'output',
            dataType: 'config',
        },
    ];

    readonly dependencies: PluginDependency[] = [
        {
            pluginId: 'wallet-auth',
            required: false,
            dataMapping: { 'auth-out': 'auth-config' },
        },
        {
            pluginId: 'superposition-network',
            required: false,
            dataMapping: { 'network-out': 'network-config' },
        },
    ];

    getDefaultConfig(): Partial<z.infer<typeof FrontendScaffoldConfig>> {
        return {
            framework: 'nextjs',
            styling: 'tailwind',
            web3Provider: 'wagmi-viem',
            walletConnect: true,
            rainbowKit: true,
            siweAuth: false,
            includeContracts: true,
            contractsPath: 'contracts',
            generateContractHooks: true,
            projectStructure: 'app-router',
            srcDirectory: true,
            stateManagement: 'tanstack-query',
            ssrEnabled: true,
            pwaSupport: false,
            strictMode: true,
            appName: 'My DApp',
        };
    }

    async generate(
        node: BlueprintNode,
        context: ExecutionContext
    ): Promise<CodegenOutput> {
        const config = this.configSchema.parse(node.config);
        const output = this.createEmptyOutput();

        // Determine base path for generated files
        const srcBase = config.srcDirectory ? 'src' : '';
        const appBase = config.projectStructure === 'app-router'
            ? `${srcBase}/app`
            : `${srcBase}/pages`;

        context.logger.info(`Generating frontend scaffold: ${config.appName}`, {
            nodeId: node.id,
            framework: config.framework,
            styling: config.styling,
        });

        // =========================================================================
        // Generate Core Next.js Files
        // =========================================================================

        // package.json
        this.addFile(
            output,
            `${srcBase ? 'apps/web' : ''}/package.json`,
            generatePackageJson(config)
        );

        // next.config.js
        this.addFile(
            output,
            `${srcBase ? 'apps/web' : ''}/next.config.js`,
            generateNextConfig(config)
        );

        // tsconfig.json
        this.addFile(
            output,
            `${srcBase ? 'apps/web' : ''}/tsconfig.json`,
            generateTsConfig(config)
        );

        // next-env.d.ts - Next.js TypeScript declarations (referenced by tsconfig.json)
        this.addFile(
            output,
            `${srcBase ? 'apps/web' : ''}/next-env.d.ts`,
            `/// <reference types="next" />
/// <reference types="next/image-types/global" />

// NOTE: This file should not be edited
// see https://nextjs.org/docs/basic-features/typescript for more information
`
        );

        // =========================================================================
        // Generate App Router Structure
        // =========================================================================

        if (config.projectStructure === 'app-router') {
            // app/layout.tsx - Root layout with providers
            this.addFile(
                output,
                `${srcBase ? 'apps/web/' : ''}${appBase}/layout.tsx`,
                generateAppLayout(config)
            );

            // app/page.tsx - Home page
            this.addFile(
                output,
                `${srcBase ? 'apps/web/' : ''}${appBase}/page.tsx`,
                generateHomePage(config)
            );

            // app/providers.tsx - Web3 providers wrapper
            this.addFile(
                output,
                `${srcBase ? 'apps/web/' : ''}${appBase}/providers.tsx`,
                generateProviders(config)
            );
        }

        // =========================================================================
        // Generate Web3 Configuration
        // =========================================================================

        // lib/wagmi.ts - wagmi configuration
        this.addFile(
            output,
            `${srcBase ? 'apps/web/' : ''}${srcBase}/lib/wagmi.ts`,
            generateWagmiConfig(config, context)
        );

        // lib/chains.ts - Chain definitions
        this.addFile(
            output,
            `${srcBase ? 'apps/web/' : ''}${srcBase}/lib/chains.ts`,
            generateChainConfig(config, context)
        );

        // lib/utils.ts - cn utility for className merging (required by ERC interaction panels)
        this.addFile(
            output,
            `${srcBase ? 'apps/web/' : ''}${srcBase}/lib/utils.ts`,
            generateUtils()
        );

        // =========================================================================
        // Generate Components
        // =========================================================================

        // components/wallet-button.tsx
        this.addFile(
            output,
            `${srcBase ? 'apps/web/' : ''}${srcBase}/components/wallet-button.tsx`,
            generateWalletButton(config)
        );

        // =========================================================================
        // Generate Styles
        // =========================================================================

        if (config.styling === 'tailwind') {
            // tailwind.config.js
            this.addFile(
                output,
                `${srcBase ? 'apps/web/' : ''}/tailwind.config.js`,
                generateTailwindConfig(config)
            );

            // postcss.config.js - Required for Tailwind CSS to work
            this.addFile(
                output,
                `${srcBase ? 'apps/web/' : ''}/postcss.config.js`,
                generatePostCSSConfig()
            );

            // app/globals.css
            this.addFile(
                output,
                `${srcBase ? 'apps/web/' : ''}${appBase}/globals.css`,
                generateGlobalStyles(config)
            );

            // postcss.config.js
            this.addFile(
                output,
                `${srcBase ? 'apps/web/' : ''}/postcss.config.js`,
                generatePostCSSConfig()
            );
        }

        // =========================================================================
        // Generate Type Definitions
        // =========================================================================

        // env.d.ts for type-safe environment variables
        this.addFile(
            output,
            `${srcBase ? 'apps/web/' : ''}${srcBase}/types/env.d.ts`,
            generateEnvTypes(config)
        );

        // viem.d.ts - Type declarations for viem module (fallback if package types missing)
        this.addFile(
            output,
            `${srcBase ? 'apps/web/' : ''}${srcBase}/types/viem.d.ts`,
            generateViemTypes()
        );

        // viem-chains.d.ts - Type declarations for viem/chains module
        this.addFile(
            output,
            `${srcBase ? 'apps/web/' : ''}${srcBase}/types/viem-chains.d.ts`,
            generateViemChainsTypes()
        );

        // =========================================================================
        // Generate Contract Hooks (if contracts are connected)
        // =========================================================================

        if (config.includeContracts && config.generateContractHooks) {
            const connectedContracts = extractConnectedContracts(context);

            if (connectedContracts.length > 0) {
                const contractHooks = generateContractHooks(connectedContracts, config);
                this.addFile(
                    output,
                    `${srcBase ? 'apps/web/' : ''}${srcBase}/hooks/useContracts.ts`,
                    contractHooks
                );
            }
        }

        // =========================================================================
        // Environment Variables
        // =========================================================================

        this.addEnvVar(output, 'NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID', 'WalletConnect Cloud project ID for wallet connections', {
            required: config.walletConnect,
        });

        this.addEnvVar(output, 'NEXT_PUBLIC_APP_NAME', 'Application name displayed in wallet dialogs', {
            required: false,
            defaultValue: config.appName,
        });

        // Add network-specific env vars if we detect superposition integration
        const hasSuperposition = context.nodeOutputs?.has('superposition-network');
        if (hasSuperposition) {
            this.addEnvVar(output, 'NEXT_PUBLIC_SUPERPOSITION_RPC_URL', 'Superposition L3 RPC endpoint', {
                required: false,
                defaultValue: 'https://rpc.superposition.so',
            });
        }

        // =========================================================================
        // Scripts
        // =========================================================================

        this.addScript(output, 'dev', 'next dev', 'Start development server');
        this.addScript(output, 'build', 'next build', 'Build for production');
        this.addScript(output, 'start', 'next start', 'Start production server');
        this.addScript(output, 'lint', 'next lint', 'Run ESLint');

        // =========================================================================
        // Documentation
        // =========================================================================

        this.addDoc(
            output,
            `docs/frontend/README.md`,
            'Frontend Application',
            generateFrontendDocs(config)
        );

        context.logger.info(`Generated frontend scaffold with ${output.files.length} files`, {
            nodeId: node.id,
        });

        return output;
    }
}

/**
 * Generate documentation for the frontend application
 */
function generateFrontendDocs(config: z.infer<typeof FrontendScaffoldConfig>): string {
    return `# ${config.appName}

A Next.js Web3 application Generated by [N]skills.

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Styling**: ${config.styling === 'tailwind' ? 'Tailwind CSS' : config.styling}
- **Web3**: wagmi + viem
- **Wallet UI**: ${config.rainbowKit ? 'RainbowKit' : 'Custom'}
- **State Management**: ${config.stateManagement === 'tanstack-query' ? 'TanStack Query' : config.stateManagement}

## Getting Started

1. Install dependencies:
   \`\`\`bash
   pnpm install
   \`\`\`

2. Set up environment variables:
   \`\`\`bash
   cp .env.example .env.local
   \`\`\`

3. Start the development server:
   \`\`\`bash
   pnpm dev
   \`\`\`

## Project Structure

\`\`\`
src/
├── app/
│   ├── layout.tsx      # Root layout with providers
│   ├── page.tsx        # Home page
│   ├── providers.tsx   # Web3 providers wrapper
│   └── globals.css     # Global styles
├── components/
│   └── wallet-button.tsx
├── lib/
│   ├── wagmi.ts        # wagmi configuration
│   └── chains.ts       # Chain definitions
├── hooks/
│   └── useContracts.ts # Contract interaction hooks
└── types/
    └── env.d.ts        # Type-safe environment variables
\`\`\`

## Features

${config.walletConnect ? '- ✅ WalletConnect integration' : ''}
${config.rainbowKit ? '- ✅ RainbowKit wallet UI' : ''}
${config.siweAuth ? '- ✅ Sign-In With Ethereum (SIWE)' : ''}
${config.includeContracts ? '- ✅ Smart contract integration' : ''}
${config.darkModeSupport ? '- ✅ Dark mode support' : ''}
${config.ssrEnabled ? '- ✅ Server-side rendering' : ''}

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| \`NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID\` | ${config.walletConnect ? 'Yes' : 'No'} | Get from [WalletConnect Cloud](https://cloud.walletconnect.com/) |
| \`NEXT_PUBLIC_APP_NAME\` | No | Application name for wallet dialogs |

---

## Interacting with Rust/Stylus Contracts from the Frontend

This section explains the **universal pattern** for building a UI to interact with **any** Rust/Stylus smart contract. Use this as a reference when creating contract interaction panels for your dApp.

### Core Concepts

1. **camelCase ABI strings**: Stylus contracts export a Solidity-compatible ABI. Define it as an array of function signatures:

   \`\`\`ts
   const MY_CONTRACT_ABI = [
     "function myReadFunction(uint256 input) view returns (string)",
     "function myWriteFunction(address to, uint256 amount)",
     // ... one entry per public function
   ];
   \`\`\`

   - Use **camelCase** for function names (e.g., \`balanceOf\`, \`mintTo\`, \`getCount\`) to match the Rust contract's exported interface.
   - Mark read-only functions with \`view\` or \`pure\`.

2. **Network configuration**: Define your supported chains (RPC URL, chain ID, explorer URL):

   \`\`\`ts
   const NETWORKS = {
     'arbitrum-sepolia': {
       rpcUrl: 'https://sepolia-rollup.arbitrum.io/rpc',
       chainId: 421614,
       explorerUrl: 'https://sepolia.arbiscan.io',
     },
     // ... add more networks as needed
   };
   \`\`\`

3. **Contract address**: Hard-code a default address for each network, or let users input a custom address with validation:

   - Supports multiple networks (Arbitrum Sepolia, Arbitrum One, Superposition, Superposition Testnet) via a simple \`NETWORKS\` map.
   - Has a **default contract address per network** and a “use custom contract” flow that:
     - Validates the address format (\`ethers.isAddress\`)
     - Checks that bytecode exists at the address via \`provider.getCode(address)\`

### Read Operations (View/Pure Functions)

Use a **read-only provider** to call view functions without gas or wallet connection:

\`\`\`ts
const provider = new ethers.JsonRpcProvider(rpcUrl);
const contract = new ethers.Contract(contractAddress, MY_CONTRACT_ABI, provider);

// Call view functions
const result = await contract.myReadFunction(inputValue);
\`\`\`

**Use cases**: Fetching contract state (balance, owner, metadata), checking user permissions, reading configuration.

4. **Write path (wallet + signer)**

   - Ensures the wallet is connected via **wagmi** hooks:
     - \`useAccount\`, \`usePublicClient\`, \`useWalletClient\`, \`useSwitchChain\`
   - Switches (or adds) the correct chain in the user’s wallet using \`wallet_switchEthereumChain\` / \`wallet_addEthereumChain\`.
   - Builds a **signer-connected** contract with \`ethers.BrowserProvider\`:

   \`\`\`ts
   const ethereum = (window as any).ethereum;
   const provider = new ethers.BrowserProvider(ethereum);
   const signer = await provider.getSigner();
   const writeContract = new ethers.Contract(contractAddress, MY_CONTRACT_ABI, signer);
   
   // Execute any write function from your contract
   const tx = await writeContract.myWriteFunction(arg1, arg2);
   await tx.wait(); // Wait for confirmation
   \`\`\`

   - Works for **any** write method: transfers, deposits, withdrawals, mints, burns, configuration updates, etc.

5. **Error handling + UX**

   - Normalizes RPC and contract errors into user-friendly messages (e.g. “Contract not found on Arbitrum Sepolia”, “User rejected chain switch”).
   - Tracks transaction status in a small state machine: \`idle → pending → success / error\`.
   - Renders helpful hints for:
     - Network mismatch
     - Missing contract
     - Failed calls or reverts

### Building Your Contract Interaction UI

When building a UI for **your** Stylus Rust contract:

1. **Follow the interaction pattern** above:
   - Separate **read** and **write** contract helpers.
   - Handle chain switching and wallet connection before writes.
2. **Replace the ABI** with your contract’s camelCase ABI:
   - One entry per public function (view + write).
   - Keep names consistent with the interface you exported from Rust.
3. **Add focused UI sections per function group**:
   - Read panels for “view” calls (e.g., balances, state snapshots).
   - Forms + buttons for writes (e.g., mint, transfer, configure).

This generic pattern can be adapted to **any Rust/Stylus contract** by swapping out the ABI and the function-specific UI forms. If your repository includes example panels like \`ERC721InteractionPanel.tsx\` or \`ERC20InteractionPanel.tsx\`, use them as reference implementations.

---

## Hydration Safety (wagmi + Next.js SSR)

When using \`useAccount\`, \`useNetwork\`, or any wallet-dependent hook in a server-rendered Next.js app, the server has **no wallet state**. This creates a hydration mismatch where the server renders "disconnected" but the client immediately sees "connected".

### The Pattern: mounted guard

\`\`\`tsx
'use client';
import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';

export function WalletStatus() {
  const [mounted, setMounted] = useState(false);
  const { address, isConnected } = useAccount();

  useEffect(() => setMounted(true), []);

  // During SSR / first client render, return a placeholder
  if (!mounted) return <div className="h-10 w-32 animate-pulse bg-gray-200 rounded" />;

  return isConnected
    ? <span>Connected: {address}</span>
    : <span>Not connected</span>;
}
\`\`\`

**Why**: React requires server and client HTML to match on first render. Without the guard, you get a console error and UI flicker.

**Where to apply**: Any component that reads wallet/chain state and renders conditionally based on it. This includes:
- Wallet connect buttons
- Balance displays
- Chain-specific UI (e.g., showing Superposition features)
- Contract interaction forms

### Alternative: Dynamic Import

For components that are entirely client-side:
\`\`\`tsx
import dynamic from 'next/dynamic';
const WalletPanel = dynamic(() => import('./WalletPanel'), { ssr: false });
\`\`\`

---

## ABI Management

### Recommended Structure

\`\`\`
src/
└── abi/
    ├── Counter.ts          # Stylus contract ABI
    ├── ERC20.ts            # Pre-deployed token ABI
    └── index.ts            # Re-exports all ABIs
\`\`\`

### Defining ABIs (as const for type safety)

Always define ABIs with \`as const\` so wagmi/viem can infer argument and return types:

\`\`\`typescript
// src/abi/Counter.ts
export const counterAbi = [
  {
    type: 'function',
    name: 'number',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'increment',
    inputs: [],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'setNumber',
    inputs: [{ name: 'new_number', type: 'uint256' }],
    outputs: [],
    stateMutability: 'nonpayable',
  },
] as const;
\`\`\`

### Using ABIs with wagmi hooks

\`\`\`typescript
import { useReadContract, useWriteContract } from 'wagmi';
import { counterAbi } from '@/abi/Counter';

const CONTRACT_ADDRESS = '0x...' as const;

// Read
const { data: count } = useReadContract({
  address: CONTRACT_ADDRESS,
  abi: counterAbi,
  functionName: 'number',  // ← fully typed, autocomplete works
});

// Write
const { writeContract } = useWriteContract();
writeContract({
  address: CONTRACT_ADDRESS,
  abi: counterAbi,
  functionName: 'increment',
});
\`\`\`

### Generating ABIs from Stylus contracts

After deploying your Stylus contract, export the ABI and convert to TypeScript:

\`\`\`bash
# Export ABI JSON from cargo stylus
cd contracts/counter-contract
cargo stylus export-abi --output=./abi.json --json

# Then create the TypeScript file:
# Copy the JSON array into src/abi/Counter.ts with \`as const\`
\`\`\`

### Contract Address Management

Store addresses per-network in a config file:

\`\`\`typescript
// src/lib/contracts.ts
export const CONTRACTS = {
  counter: {
    421614: '0x...',  // Arbitrum Sepolia
    42161: '0x...',   // Arbitrum One
  },
} as const;
\`\`\`

---

Generated with ❤️ by [[N]skills](https://www.nskills.xyz)
`;
}
