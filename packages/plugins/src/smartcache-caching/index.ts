import { z } from 'zod';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import {
    BasePlugin,
    type PluginMetadata,
    type PluginPort,
    type CodegenOutput,
    type BlueprintNode,
    type ExecutionContext,
} from '@dapp-forge/plugin-sdk';
import { SmartCacheCachingConfig } from '@dapp-forge/blueprint-schema';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const COUNTER_CONTRACT_TEMPLATE_PATH = path.resolve(__dirname, '../../../../apps/web/src/components/counter-contract');

function hasCachingFunctions(code: string): boolean {
    return /is_cacheable|opt_in_to_cache/.test(code);
}

function addCachingToContract(contractCode: string): string {
    if (!contractCode.trim()) return contractCode;
    if (contractCode.includes('stylus_cache_sdk')) return contractCode;

    const cachingImports = `use stylus_cache_sdk::{is_contract_cacheable, AutoCacheOptIn, emit_cache_opt_in};

`;
    const cacheableFunction = `
    /// Returns whether this contract is cacheable
    pub fn is_cacheable(&self) -> bool {
        is_contract_cacheable()
    }

    /// Opt-in to caching (call once after deployment)
    pub fn opt_in_to_cache(&mut self) {
        emit_cache_opt_in();
    }
`;

    let modified = contractCode;
    const useMatch = modified.match(/use [^;]+;/g);
    if (useMatch && useMatch.length > 0) {
        const lastUse = useMatch[useMatch.length - 1];
        modified = modified.replace(lastUse, lastUse + '\n' + cachingImports);
    } else {
        modified = cachingImports + modified;
    }

    const implRegex = /#\[public\](?:\s*#\[[^\]]*\])*\s*impl\s+(?:\w+\s+for\s+)?(\w+)\s*\{/g;
    let implMatch;
    const matches: { index: number; structName: string }[] = [];
    while ((implMatch = implRegex.exec(modified)) !== null) {
        matches.push({ index: implMatch.index, structName: implMatch[1] });
    }

    if (matches.length > 0) {
        const target = matches[matches.length - 1];
        const implStart = target.index;
        const afterImpl = modified.slice(implStart);
        let braceCount = 0;
        let implEnd = -1;
        for (let i = 0; i < afterImpl.length; i++) {
            if (afterImpl[i] === '{') braceCount++;
            if (afterImpl[i] === '}') {
                braceCount--;
                if (braceCount === 0) {
                    implEnd = implStart + i;
                    break;
                }
            }
        }
        if (implEnd > 0) {
            modified = modified.slice(0, implEnd) + cacheableFunction + modified.slice(implEnd);
        }
    }

    return modified;
}

function getDefaultContract(): string {
    return `//! Counter Contract

#![cfg_attr(not(feature = "export-abi"), no_main)]
extern crate alloc;

use stylus_sdk::{alloy_primitives::U256, prelude::*, storage::StorageU256};

sol_storage! {
    #[entrypoint]
    pub struct Counter {
        StorageU256 count;
    }
}

#[public]
impl Counter {
    pub fn get_count(&self) -> U256 {
        self.count.get()
    }

    pub fn set_count(&mut self, value: U256) {
        self.count.set(value);
    }
}
`;
}

const DOS2UNIX_NOTE = `# If you see "bad interpreter" or CRLF errors on Windows, run first: dos2unix scripts/*.sh
# Or: pnpm fix-scripts

`;

/**
 * SmartCache Caching Plugin
 * - mycontract/: original contract (without is_cacheable/opt_in_to_cache)
 * - cached-contract/: contract with caching functions added
 * Both use counter-contract folder structure. Scripts include dos2unix for Windows.
 */
export class SmartCacheCachingPlugin extends BasePlugin<z.infer<typeof SmartCacheCachingConfig>> {
    readonly metadata: PluginMetadata = {
        id: 'smartcache-caching',
        name: 'SmartCache Caching',
        version: '0.2.0',
        description: 'Enable contract caching for cheaper gas - mycontract (original) + cached-contract (with caching)',
        category: 'contracts',
        tags: ['caching', 'gas-optimization', 'stylus', 'smartcache'],
    };

    readonly configSchema = SmartCacheCachingConfig as unknown as z.ZodType<z.infer<typeof SmartCacheCachingConfig>>;

    readonly ports: PluginPort[] = [
        { id: 'contract-in', name: 'Contract Input', type: 'input', dataType: 'contract' },
        { id: 'cached-contract-out', name: 'Cached Contract', type: 'output', dataType: 'contract' },
    ];

    getDefaultConfig(): Partial<z.infer<typeof SmartCacheCachingConfig>> {
        return { crateVersion: 'latest', autoOptIn: true, contractCode: '', exampleType: 'counter' };
    }

    async generate(node: BlueprintNode, context: ExecutionContext): Promise<CodegenOutput> {
        const config = this.configSchema.parse(node.config);
        const output = this.createEmptyOutput();

        const rawContract = config.contractCode || getDefaultContract();
        const originalLibRs = rawContract.trim();
        const hasCaching = hasCachingFunctions(originalLibRs);
        const cachedLibRs = hasCaching ? originalLibRs : addCachingToContract(originalLibRs);

        // mycontract = original (without caching)
        this.copyContractFolder(output, 'mycontract', originalLibRs, false);
        // cached-contract = with is_cacheable + opt_in_to_cache
        this.copyContractFolder(output, 'cached-contract', cachedLibRs, true);

        // Markdown guide
        this.addFile(output, 'docs/SMARTCACHE_INTEGRATION.md', generateCachingGuide(config, hasCaching));

        // Deploy scripts (with dos2unix)
        this.addFile(output, 'scripts/deploy-sepolia.sh', DOS2UNIX_NOTE + generateDeployScript('sepolia'));
        this.addFile(output, 'scripts/deploy-mainnet.sh', DOS2UNIX_NOTE + generateDeployScript('mainnet'));

        this.addScript(output, 'deploy:sepolia', 'bash scripts/deploy-sepolia.sh');
        this.addScript(output, 'deploy:mainnet', 'bash scripts/deploy-mainnet.sh');

        this.addScript(output, 'fix-scripts', 'command -v dos2unix >/dev/null && dos2unix scripts/*.sh 2>/dev/null || echo "Run: dos2unix scripts/*.sh (install with: apt install dos2unix / brew install dos2unix)"');

        context.logger.info('Generated SmartCache: mycontract + cached-contract', { nodeId: node.id });
        return output;
    }

    private copyContractFolder(output: CodegenOutput, folderName: string, libRsContent: string, includeCacheSdk: boolean): void {
        const basePath = `contracts/${folderName}`;
        const crateName = folderName.replace(/-/g, '_');

        if (fs.existsSync(COUNTER_CONTRACT_TEMPLATE_PATH)) {
            const skipDirs = new Set(['node_modules', 'target', '.git']);
            const skipFiles = new Set(['Cargo.lock']);

            const walk = (dir: string, relativePrefix: string) => {
                const items = fs.readdirSync(dir);
                for (const item of items) {
                    const fullPath = path.join(dir, item);
                    const relativePath = relativePrefix ? `${relativePrefix}/${item}` : item;
                    const stat = fs.statSync(fullPath);

                    if (stat.isDirectory()) {
                        if (!skipDirs.has(item)) walk(fullPath, relativePath);
                    } else if (!skipFiles.has(item)) {
                        let content = fs.readFileSync(fullPath, 'utf-8');
                        const outputPath = `${basePath}/${relativePath}`;

                        if (relativePath === 'src/lib.rs') {
                            content = libRsContent;
                        } else if (relativePath === 'Cargo.toml') {
                            content = this.adaptCargoToml(content, folderName, crateName, includeCacheSdk);
                        } else if (relativePath === 'src/main.rs') {
                            content = content.replace(/stylus_hello_world/g, crateName);
                        }

                        this.addFile(output, outputPath, content);
                    }
                }
            };

            walk(COUNTER_CONTRACT_TEMPLATE_PATH, '');
        } else {
            // Fallback: minimal structure
            this.addFile(output, `${basePath}/Cargo.toml`, generateMinimalCargoToml(folderName, crateName, includeCacheSdk));
            this.addFile(output, `${basePath}/src/lib.rs`, libRsContent);
        }
    }

    private adaptCargoToml(original: string, folderName: string, crateName: string, includeCacheSdk: boolean): string {
        let content = original.replace(/name\s*=\s*"[^"]+"/, `name = "${folderName}"`);
        if (includeCacheSdk && !content.includes('stylus-cache-sdk')) {
            content = content.replace(/(\[dependencies\]\s*\n)/, `$1stylus-cache-sdk = "0.1"\n`);
        }
        return content;
    }
}

function generateMinimalCargoToml(folderName: string, _crateName: string, includeCacheSdk: boolean): string {
    let deps = `stylus-sdk = "0.6"
alloy-primitives = "0.7"`;
    if (includeCacheSdk) deps += `\nstylus-cache-sdk = "0.1"`;
    return `[package]
name = "${folderName}"
version = "0.1.0"
edition = "2021"

[lib]
crate-type = ["cdylib"]

[dependencies]
${deps}

[features]
export-abi = ["stylus-sdk/export-abi"]

[profile.release]
codegen-units = 1
strip = true
lto = true
panic = "abort"
opt-level = "s"
`;
}

function generateDeployScript(network: 'sepolia' | 'mainnet'): string {
    const rpcUrl = network === 'sepolia' ? 'https://sepolia-rollup.arbitrum.io/rpc' : 'https://arb1.arbitrum.io/rpc';
    const networkName = network === 'sepolia' ? 'Arbitrum Sepolia' : 'Arbitrum One';

    return `#!/bin/bash
# Cached Contract ${networkName} Deployment
# Deploys from contracts/cached-contract/ (contract with is_cacheable + opt_in_to_cache)

set -euo pipefail

if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
fi

RPC_URL="${rpcUrl}"
CONTRACT_DIR="contracts/cached-contract"

if [[ -z "\${PRIVATE_KEY:-}" ]]; then
  echo "Error: PRIVATE_KEY not set."
  exit 1
fi

cd "\${CONTRACT_DIR}"
cargo stylus deploy -e "\${RPC_URL}" --private-key "\${PRIVATE_KEY}" --no-verify

echo "After deployment, call opt_in_to_cache() to enable caching, or re-run cargo stylus deploy (contract auto-caches on deploy)."
`;
}

function generateCachingGuide(config: z.infer<typeof SmartCacheCachingConfig>, alreadyHasCaching: boolean): string {
    return `# SmartCache Integration Guide

## Folder Structure

\`\`\`
contracts/
├── mycontract/           # Original contract (without is_cacheable / opt_in_to_cache)
│   ├── .cargo/
│   ├── Cargo.toml
│   ├── src/
│   │   ├── lib.rs        # Your selected contract (counter, erc20, vending-machine, etc.)
│   │   └── main.rs
│   └── ...
└── cached-contract/      # Same contract WITH is_cacheable + opt_in_to_cache
    ├── .cargo/
    ├── Cargo.toml        # Includes stylus-cache-sdk
    ├── src/
    │   ├── lib.rs        # Contract + caching functions
    │   └── main.rs
    └── ...
\`\`\`

## After Adding is_cacheable

Once your contract has \`is_cacheable()\` and \`opt_in_to_cache()\` (as in \`cached-contract/\`):

1. **Deploy** with \`cargo stylus deploy\`:
   \`\`\`bash
   cd contracts/cached-contract
   cargo stylus deploy --private-key "\${PRIVATE_KEY}" --endpoint "https://sepolia-rollup.arbitrum.io/rpc"
   \`\`\`

2. **Auto-cache**: Running \`cargo stylus deploy\` will deploy and activate your contract. The contract is then cacheable. Call \`opt_in_to_cache()\` once after deployment to opt in:
   \`\`\`bash
   cast send <CONTRACT_ADDRESS> "opt_in_to_cache()" --private-key $PRIVATE_KEY --rpc-url <RPC_URL>
   \`\`\`

## Scripts (Windows CRLF)

If you see \`bad interpreter\` or line-ending errors on Windows, run:

\`\`\`bash
pnpm fix-scripts
# or: dos2unix scripts/*.sh
# Install: apt install dos2unix  (Linux) | brew install dos2unix  (macOS)
\`\`\`

## How SmartCache Works

SmartCache reduces gas costs and latency for Stylus contracts by **warming frequently-accessed storage slots** into a fast-access cache layer. When a contract opts in:

1. Storage reads that normally hit cold EVM slots (~2100 gas) are served from the warm cache (~100 gas)
2. Subsequent calls within the same block benefit from pre-warmed slots
3. Cross-contract calls to cached contracts also benefit from reduced access costs

> **Key insight**: SmartCache is **only applicable to Stylus contracts**. Solidity contracts and pre-deployed ERC20/ERC721 token contracts do not benefit because they lack the Stylus cache SDK hooks.

## Verifying Cache Status

After deploying and calling \`opt_in_to_cache()\`, verify the cache is active:

### 1. Check if contract is cacheable

\`\`\`bash
cast call <CONTRACT_ADDRESS> "is_cacheable()" --rpc-url <RPC_URL>
\`\`\`

Expected output: \`0x0000...0001\` (true)

### 2. Verify opt-in was recorded

\`\`\`bash
# Check the opt-in transaction receipt
cast receipt <OPT_IN_TX_HASH> --rpc-url <RPC_URL>
\`\`\`

Look for \`status: 1\` (success) in the receipt.

### 3. Compare gas usage (before vs after)

\`\`\`bash
# Call a read function and check gasUsed
cast call <CONTRACT_ADDRESS> "get_count()" --rpc-url <RPC_URL> --trace

# After cache is warm, the same call should use less gas
\`\`\`

### 4. Troubleshooting cache issues

| Symptom | Cause | Fix |
|---------|-------|-----|
| \`is_cacheable()\` returns false | Cache SDK not linked | Ensure \`stylus-cache-sdk\` is in Cargo.toml dependencies |
| \`opt_in_to_cache()\` reverts | Already opted in or contract not cacheable | Check \`is_cacheable()\` first |
| No gas improvement | Cache not yet warm | Caching improves on repeated calls within a block or across consecutive blocks |

## Resources

- [SmartCache Documentation](https://smartcache.gitbook.io/smartcache-docs)
- [stylus-cache-sdk](https://crates.io/crates/stylus-cache-sdk)
- [Stylus Gas & Caching Deep Dive](https://docs.arbitrum.io/stylus/reference/opcode-gas-pricing)
`;
}
