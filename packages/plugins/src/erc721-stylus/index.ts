import { z } from 'zod';
import {
  BasePlugin,
  type PluginMetadata,
  type PluginPort,
  type CodegenOutput,
  type BlueprintNode,
  type ExecutionContext,
} from '@dapp-forge/plugin-sdk';
import { ERC721StylusConfig } from '@dapp-forge/blueprint-schema';

/**
 * ERC721 Stylus NFT Plugin
 * 
 * Generates ERC-721 NFT contracts using Arbitrum Stylus
 * and provides interaction capabilities
 */
export class ERC721StylusPlugin extends BasePlugin<z.infer<typeof ERC721StylusConfig>> {
  readonly metadata: PluginMetadata = {
    id: 'erc721-stylus',
    name: 'ERC-721 Stylus NFT',
    version: '0.1.0',
    description: 'Generate and interact with ERC-721 NFTs on Arbitrum Stylus',
    category: 'contracts',
    tags: ['erc721', 'nft', 'arbitrum', 'stylus', 'contract'],
  };

  readonly configSchema = ERC721StylusConfig as unknown as z.ZodType<z.infer<typeof ERC721StylusConfig>>;

  /**
   * Path to the pre-built component package
   */
  readonly componentPath = 'packages/components/erc721-stylus';

  /**
   * Package name for the component
   */
  readonly componentPackage = '@cradle/erc721-stylus';

  readonly ports: PluginPort[] = [
    {
      id: 'wallet-in',
      name: 'Wallet Connection',
      type: 'input',
      dataType: 'config',
      required: true,
    },
    {
      id: 'nft-out',
      name: 'NFT Contract',
      type: 'output',
      dataType: 'contract',
    },
  ];

  getDefaultConfig(): Partial<z.infer<typeof ERC721StylusConfig>> {
    return {
      collectionName: 'My NFT Collection',
      collectionSymbol: 'MNFT',
      baseUri: 'https://api.example.com/metadata/',
      network: 'arbitrum-sepolia',
      features: ['ownable', 'mintable', 'burnable', 'pausable', 'enumerable'],
      isDeployed: false,
    };
  }

  async generate(
    node: BlueprintNode,
    context: ExecutionContext
  ): Promise<CodegenOutput> {
    const config = this.configSchema.parse(node.config);
    const output = this.createEmptyOutput();

    // Generate Stylus contract files
    this.addFile(
      output,
      'contracts/erc721-stylus/Cargo.toml',
      generateCargoToml(config)
    );

    this.addFile(
      output,
      'contracts/erc721-stylus/src/lib.rs',
      generateContractCode(config)
    );

    this.addFile(
      output,
      'contracts/erc721-stylus/README.md',
      generateContractReadme(config)
    );

    // Generate deployment script
    this.addFile(
      output,
      'scripts/deploy-erc721.sh',
      generateDeployScript(config)
    );

    // Generate interaction utilities
    this.addFile(
      output,
      'src/lib/erc721-nft.ts',
      generateNFTLib(config)
    );

    // Generate React component for NFT interaction
    this.addFile(
      output,
      'src/components/ERC721NFTPanel.tsx',
      generateNFTPanel(config)
    );

    // Add environment variables
    this.addEnvVar(output, 'NEXT_PUBLIC_NFT_ADDRESS', 'Deployed ERC721 NFT address', {
      required: false,
      defaultValue: config.contractAddress,
    });
    this.addEnvVar(output, 'PRIVATE_KEY', 'Private key for deployment and transactions', {
      required: true,
      secret: true,
    });

    // Add scripts
    this.addScript(output, 'build:erc721', 'cd contracts/erc721-stylus && cargo build --release --target wasm32-unknown-unknown', 'Build ERC721 Stylus contract');
    this.addScript(output, 'deploy:erc721', 'bash scripts/deploy-erc721.sh', 'Deploy ERC721 collection');
    this.addScript(output, 'check:erc721', 'cd contracts/erc721-stylus && cargo stylus check', 'Check ERC721 contract');

    // Add documentation
    this.addDoc(
      output,
      'docs/erc721-nft.md',
      'ERC-721 NFT Collection',
      generateNFTDocs(config)
    );

    context.logger.info(`Generated ERC721 Stylus NFT: ${config.collectionName}`, {
      nodeId: node.id,
      symbol: config.collectionSymbol,
      network: config.network,
      features: config.features,
      componentPackage: this.componentPackage,
    });

    return output;
  }
}

function generateCargoToml(config: z.infer<typeof ERC721StylusConfig>): string {
  const features = config.features || ['ownable', 'mintable', 'burnable', 'pausable', 'enumerable'];
  const defaultFeatures = features.map(f => `"${f}"`).join(', ');
  
  return `[package]
name = "${config.collectionSymbol.toLowerCase()}-nft"
version = "0.1.0"
edition = "2021"
license = "MIT OR Apache-2.0"
description = "${config.collectionName} - ERC-721 NFT for Arbitrum Stylus"

[dependencies]
alloy-primitives = "0.7.6"
alloy-sol-types = "0.7.6"
stylus-sdk = "0.6.0"
mini-alloc = "0.4.2"

[dev-dependencies]
tokio = { version = "1.12.0", features = ["full"] }
ethers = "2.0"
eyre = "0.6.8"

[features]
default = [${defaultFeatures}]
ownable = []
mintable = []
burnable = []
pausable = []
enumerable = []
export-abi = ["stylus-sdk/export-abi"]

[lib]
crate-type = ["lib", "cdylib"]

[profile.release]
codegen-units = 1
strip = true
lto = true
panic = "abort"
opt-level = "s"
`;
}

function generateContractCode(config: z.infer<typeof ERC721StylusConfig>): string {
  // This would be a simplified version - in practice, you'd use the full contract from the template
  // For now, we'll generate a reference to use the contract from the component package
  return `// Copyright 2024 Cradle - Generated Contract
// SPDX-License-Identifier: MIT OR Apache-2.0

//! # ${config.collectionName} (${config.collectionSymbol})
//!
//! ERC-721 NFT Implementation for Arbitrum Stylus
//! 
//! Enabled features: ${config.features?.join(', ') || 'all'}

// Note: This is a generated contract file.
// The full contract implementation is available in @cradle/erc721-stylus/contract
// Copy the contract code from packages/components/erc721-stylus/contract/src/lib.rs
// and customize it based on your selected features.

// Features enabled: ${JSON.stringify(config.features || [])}
`;
}

function generateContractReadme(config: z.infer<typeof ERC721StylusConfig>): string {
  const features = config.features || ['ownable', 'mintable', 'burnable', 'pausable', 'enumerable'];
  
  return `# ${config.collectionName} (${config.collectionSymbol})

ERC-721 NFT for Arbitrum Stylus.

## Collection Details

- **Name:** ${config.collectionName}
- **Symbol:** ${config.collectionSymbol}
- **Base URI:** ${config.baseUri}
- **Network:** ${config.network}
- **Features:** ${features.join(', ')}

## Prerequisites

\`\`\`bash
# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Install wasm32 target
rustup target add wasm32-unknown-unknown

# Install cargo-stylus
cargo install cargo-stylus
\`\`\`

## Build

\`\`\`bash
cargo build --release --target wasm32-unknown-unknown
\`\`\`

## Deploy

\`\`\`bash
# Check contract validity
cargo stylus check

# Deploy
cargo stylus deploy \\
  --private-key $PRIVATE_KEY \\
  --endpoint https://sepolia-rollup.arbitrum.io/rpc
\`\`\`

## Initialize

After deployment, initialize the contract:

\`\`\`bash
cast send <CONTRACT_ADDRESS> \\
  "initialize(string,string,string,address)" \\
  "${config.collectionName}" "${config.collectionSymbol}" "${config.baseUri}" <OWNER_ADDRESS> \\
  --private-key $PRIVATE_KEY \\
  --rpc-url https://sepolia-rollup.arbitrum.io/rpc
\`\`\`

## Features

${features.map(f => `- **${f}**: Enabled`).join('\n')}
`;
}

function generateDeployScript(config: z.infer<typeof ERC721StylusConfig>): string {
  return `#!/bin/bash
# ERC-721 NFT Deployment Script
# Usage: bash scripts/deploy-erc721.sh

set -e

echo "Building ERC-721 contract..."
cd contracts/erc721-stylus
cargo build --release --target wasm32-unknown-unknown

echo "Checking contract..."
cargo stylus check

if [ -z "$PRIVATE_KEY" ]; then
  echo "Error: PRIVATE_KEY environment variable is not set"
  exit 1
fi

RPC_ENDPOINT=\${RPC_ENDPOINT:-"https://sepolia-rollup.arbitrum.io/rpc"}

echo "Deploying to $RPC_ENDPOINT..."
cargo stylus deploy \\
  --private-key $PRIVATE_KEY \\
  --endpoint $RPC_ENDPOINT

echo ""
echo "Deployment complete!"
echo ""
echo "Next steps:"
echo "1. Copy the contract address from the output above"
echo "2. Initialize the contract with:"
echo ""
echo "cast send <CONTRACT_ADDRESS> \\\\"
echo "  'initialize(string,string,string,address)' \\\\"
echo "  '${config.collectionName}' '${config.collectionSymbol}' '${config.baseUri}' <OWNER_ADDRESS> \\\\"
echo "  --private-key \\$PRIVATE_KEY \\\\"
echo "  --rpc-url $RPC_ENDPOINT"
`;
}

function generateNFTLib(config: z.infer<typeof ERC721StylusConfig>): string {
  return `/**
 * ERC-721 NFT Library
 * 
 * Utilities for interacting with the deployed NFT collection
 */

import { 
  getCollectionInfo, 
  getBalance, 
  getNFTInfo,
  mint, 
  burn,
  transferFrom,
  type CollectionInfo,
  type NFTInfo,
} from '@cradle/erc721-stylus';
import type { Address, Hash } from 'viem';

const NFT_ADDRESS = process.env.NEXT_PUBLIC_NFT_ADDRESS as Address;
const RPC_ENDPOINT = '${config.network === 'arbitrum' ? 'https://arb1.arbitrum.io/rpc' : 'https://sepolia-rollup.arbitrum.io/rpc'}';

export async function fetchCollectionInfo(): Promise<CollectionInfo> {
  return getCollectionInfo(NFT_ADDRESS, RPC_ENDPOINT);
}

export async function fetchBalance(account: Address): Promise<bigint> {
  const balance = await getBalance(NFT_ADDRESS, account, RPC_ENDPOINT);
  return balance.balance;
}

export async function fetchNFTInfo(tokenId: bigint): Promise<NFTInfo> {
  return getNFTInfo(NFT_ADDRESS, tokenId, RPC_ENDPOINT);
}

export async function mintNFT(
  to: Address, 
  privateKey: string
): Promise<{ hash: Hash; tokenId: bigint }> {
  return mint(NFT_ADDRESS, to, privateKey, RPC_ENDPOINT);
}

export async function burnNFT(
  tokenId: bigint, 
  privateKey: string
): Promise<Hash> {
  return burn(NFT_ADDRESS, tokenId, privateKey, RPC_ENDPOINT);
}

export async function transferNFT(
  from: Address,
  to: Address, 
  tokenId: bigint, 
  privateKey: string
): Promise<Hash> {
  return transferFrom(NFT_ADDRESS, from, to, tokenId, privateKey, RPC_ENDPOINT);
}

export const NFT_CONFIG = {
  name: '${config.collectionName}',
  symbol: '${config.collectionSymbol}',
  baseUri: '${config.baseUri}',
  network: '${config.network}',
  features: ${JSON.stringify(config.features)},
} as const;
`;
}

function generateNFTPanel(config: z.infer<typeof ERC721StylusConfig>): string {
  return `'use client';

/**
 * ERC-721 NFT Interaction Panel
 */

import { useState } from 'react';
import { useAccount } from 'wagmi';
import { useERC721Interactions } from '@cradle/erc721-stylus';
import type { Address } from 'viem';

const NFT_ADDRESS = process.env.NEXT_PUBLIC_NFT_ADDRESS as Address;

export function ERC721NFTPanel() {
  const { address: userAddress } = useAccount();
  const [mintTo, setMintTo] = useState('');

  const nft = useERC721Interactions({
    contractAddress: NFT_ADDRESS,
    network: '${config.network}',
    userAddress,
  });

  const collectionInfo = nft.collectionInfo.status === 'success' ? nft.collectionInfo.data : null;
  const balance = nft.balance.status === 'success' ? nft.balance.data : null;

  const handleMint = async () => {
    if (!mintTo) return;
    try {
      const result = await nft.mint(mintTo as Address);
      console.log('Minted NFT #' + result.tokenId.toString());
      setMintTo('');
    } catch (error) {
      console.error('Mint failed:', error);
    }
  };

  if (!NFT_ADDRESS) {
    return (
      <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
        <p className="text-sm text-yellow-400">
          NFT collection not deployed yet. Deploy using <code>cargo stylus deploy</code> in the contracts/erc721-stylus folder.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="p-4 bg-gray-800 rounded-lg">
        <h3 className="text-lg font-semibold text-white mb-2">
          {collectionInfo?.name || '${config.collectionName}'} ({collectionInfo?.symbol || '${config.collectionSymbol}'})
        </h3>
        <div className="space-y-1 text-sm text-gray-400">
          <p>Total Supply: {collectionInfo?.formattedTotalSupply || '0'}</p>
          <p>Your NFTs: {balance?.balance?.toString() || '0'}</p>
          <p className="text-xs font-mono truncate">{NFT_ADDRESS}</p>
        </div>
      </div>

      <div className="p-4 bg-gray-800 rounded-lg">
        <h4 className="text-sm font-medium text-white mb-3">Mint NFT</h4>
        <div className="space-y-2">
          <input
            type="text"
            placeholder="Recipient address (0x...)"
            value={mintTo}
            onChange={(e) => setMintTo(e.target.value)}
            className="w-full px-3 py-2 text-sm bg-gray-900 border border-gray-700 rounded text-white"
          />
          <button
            onClick={handleMint}
            disabled={nft.isLoading || !mintTo}
            className="w-full px-4 py-2 text-sm font-medium bg-purple-600 hover:bg-purple-700 text-white rounded disabled:opacity-50"
          >
            {nft.isLoading ? 'Minting...' : 'Mint NFT'}
          </button>
        </div>
      </div>

      {nft.txState.status === 'success' && (
        <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
          <p className="text-sm text-green-400">
            Transaction successful: {nft.txState.hash.slice(0, 10)}...
          </p>
        </div>
      )}

      {nft.error && (
        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
          <p className="text-sm text-red-400">{nft.error.message}</p>
        </div>
      )}
    </div>
  );
}
`;
}

function generateNFTDocs(config: z.infer<typeof ERC721StylusConfig>): string {
  const features = config.features || ['ownable', 'mintable', 'burnable', 'pausable', 'enumerable'];
  
  return `# ${config.collectionName} (${config.collectionSymbol})

An ERC-721 NFT collection for ${config.network === 'arbitrum' ? 'Arbitrum One' : 'Arbitrum Sepolia'} using Stylus.

## Collection Details

- **Name:** ${config.collectionName}
- **Symbol:** ${config.collectionSymbol}
- **Base URI:** ${config.baseUri}
- **Network:** ${config.network}
- **Features:** ${features.join(', ')}

## Deployment

### Prerequisites

\`\`\`bash
# Install cargo-stylus
cargo install cargo-stylus

# Add wasm target
rustup target add wasm32-unknown-unknown
\`\`\`

### Deploy

\`\`\`bash
# Set your private key
export PRIVATE_KEY="0x..."

# Build and deploy
pnpm build:erc721
pnpm deploy:erc721
\`\`\`

### Initialize

After deployment, initialize the contract:

\`\`\`bash
cast send <CONTRACT_ADDRESS> \\
  "initialize(string,string,string,address)" \\
  "${config.collectionName}" "${config.collectionSymbol}" "${config.baseUri}" <OWNER_ADDRESS> \\
  --private-key $PRIVATE_KEY \\
  --rpc-url ${config.network === 'arbitrum' ? 'https://arb1.arbitrum.io/rpc' : 'https://sepolia-rollup.arbitrum.io/rpc'}
\`\`\`

## Usage

### Get Collection Info

\`\`\`typescript
import { fetchCollectionInfo } from '@/lib/erc721-nft';

const info = await fetchCollectionInfo();
console.log(info.name, info.symbol, info.totalSupply);
\`\`\`

### Mint NFT (Owner Only)

\`\`\`typescript
import { mintNFT } from '@/lib/erc721-nft';

const { hash, tokenId } = await mintNFT('0x...', privateKey);
console.log('Minted NFT #' + tokenId);
\`\`\`

### Transfer NFT

\`\`\`typescript
import { transferNFT } from '@/lib/erc721-nft';

await transferNFT('0x...from', '0x...to', 1n, privateKey);
\`\`\`

## Contract Features

${features.map(f => `- **${f}**: Enabled`).join('\n')}
`;
}
