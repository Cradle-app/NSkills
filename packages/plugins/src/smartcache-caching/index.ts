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
    return /is_cacheable/.test(code);
}

function addCachingToContract(contractCode: string): string {
    if (!contractCode.trim()) return contractCode;
    if (contractCode.includes('stylus_cache_sdk')) return contractCode;

    const cachingImports = `use stylus_cache_sdk::{is_contract_cacheable};

`;
    const cacheableFunction = `
    /// Returns whether this contract is cacheable
    pub fn is_cacheable(&self) -> bool {
        is_contract_cacheable()
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

    const implRegex = /#\[public\](?:\s*(?:#\[[^\]]+\]|\/\/.*|\/\*[\s\S]*?\*\/))*\s*impl\s+(\w+)(?:\s+for\s+\w+)?\s*\{/g;
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
    // Same default counter as the stylus-rust-contract form's TEMPLATES.counter.code
    return `//!
//! Stylus Hello World
//!
//! The following contract implements the Counter example from Foundry.
//!

// Allow \`cargo stylus export-abi\` to generate a main function.
#![cfg_attr(not(feature = "export-abi"), no_main)]
extern crate alloc;

/// Import items from the SDK. The prelude contains common traits and macros.
use stylus_sdk::{alloy_primitives::U256, prelude::*};

// Define some persistent storage using the Solidity ABI.
// \`Counter\` will be the entrypoint.
sol_storage! {
    #[entrypoint]
    pub struct Counter {
        uint256 number;
    }
}

/// Declare that \`Counter\` is a contract with the following external methods.
#[public]
impl Counter {
    /// Gets the number from storage.
    pub fn number(&self) -> U256 {
        self.number.get()
    }

    /// Sets a number in storage to a user-specified value.
    pub fn set_number(&mut self, new_number: U256) {
        self.number.set(new_number);
    }

    /// Sets a number in storage to a user-specified value.
    pub fn mul_number(&mut self, new_number: U256) {
        self.number.set(new_number * self.number.get());
    }

    /// Sets a number in storage to a user-specified value.
    pub fn add_number(&mut self, new_number: U256) {
        self.number.set(new_number + self.number.get());
    }

    /// Increments \`number\` and updates its value in storage.
    pub fn increment(&mut self) {
        let number = self.number.get();
        self.set_number(number + U256::from(1));
    }
}
`;
}

const DOS2UNIX_NOTE = `# If you see "bad interpreter" or CRLF errors on Windows, run first: dos2unix scripts/*.sh
# Or: pnpm fix-scripts

`;

/**
 * SmartCache Caching Plugin
 * - mycontract/: original contract (no cache helper)
 * - cached-contract/: contract with is_cacheable() helper added
 * Both use counter-contract folder structure. Scripts include dos2unix for Windows.
 */
export class SmartCacheCachingPlugin extends BasePlugin<z.infer<typeof SmartCacheCachingConfig>> {
    readonly metadata: PluginMetadata = {
        id: 'smartcache-caching',
        name: 'SmartCache Caching',
        version: '0.2.0',
        description: 'Enable contract caching for cheaper gas - mycontracts (original) + cached-contracts (with caching)',
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

        // Check if stylus-rust-contract is also in the blueprint.
        // We only generate the multiple contract folders (mycontracts/cached-contracts)
        // when a dedicated Stylus Rust contract node is present to avoid confusion
        // when only using other contract types or utilities.
        const hasStylusRustContract = context.pathContext?.nodeTypes?.has('stylus-rust-contract') ?? false;

        if (hasStylusRustContract) {
            // Try to read the user's selected contract from the connected stylus-rust-contract node.
            const connectedInfo = this.extractConnectedContractInfo(context);
            const folderName = connectedInfo?.folder || 'mycontracts';
            const rawContract = connectedInfo?.code || config.contractCode || getDefaultContract();
            const originalLibRs = rawContract.trim();
            const hasCaching = hasCachingFunctions(originalLibRs);
            const cachedLibRs = hasCaching ? originalLibRs : addCachingToContract(originalLibRs);

            // Generate folders based on detected name (already pluralized by stylus-rust-contract)
            this.copyContractFolder(output, folderName, originalLibRs, false);
            this.copyContractFolder(output, 'cached-contracts', cachedLibRs, true);

            // Markdown guide
            this.addFile(output, 'docs/SMARTCACHE_INTEGRATION.md', generateCachingGuide(config, hasCaching, folderName));

            // Deploy scripts (with dos2unix)
            this.addFile(output, 'scripts/deploy-sepolia.sh', DOS2UNIX_NOTE + generateDeployScript('sepolia', 'cached-contracts'));
            this.addFile(output, 'scripts/deploy-mainnet.sh', DOS2UNIX_NOTE + generateDeployScript('mainnet', 'cached-contracts'));

            this.addScript(output, 'deploy:sepolia', 'bash scripts/deploy-sepolia.sh');
            this.addScript(output, 'deploy:mainnet', 'bash scripts/deploy-mainnet.sh');

            context.logger.info('Generated SmartCache: mycontracts + cached-contracts', { nodeId: node.id });
        } else {
            // If other contracts are used instead of Stylus Rust contracts, or if no contract node
            // is present, generate a README instead explaining how to use is_cacheable().
            this.addFile(output, 'docs/SMARTCACHE_USAGE.md', generateSmartCacheUsageReadme());
            context.logger.info('Generated SmartCache usage README (no stylus-rust-contract detected)', { nodeId: node.id });
        }

        this.addScript(output, 'fix-scripts', 'command -v dos2unix >/dev/null && dos2unix scripts/*.sh 2>/dev/null || echo "Run: dos2unix scripts/*.sh (install with: apt install dos2unix / brew install dos2unix)"');

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
            // Fallback: generate the full counter-contract template structure inline
            // (used when COUNTER_CONTRACT_TEMPLATE_PATH is not found at orchestrator runtime)
            this.addFile(output, `${basePath}/Cargo.toml`, generateFullCargoToml(folderName, includeCacheSdk));
            this.addFile(output, `${basePath}/src/lib.rs`, libRsContent);
            this.addFile(output, `${basePath}/src/main.rs`, generateMainRs(crateName));
            this.addFile(output, `${basePath}/rust-toolchain.toml`, RUST_TOOLCHAIN_TOML);
            this.addFile(output, `${basePath}/.cargo/config.toml`, CARGO_CONFIG_TOML);
            this.addFile(output, `${basePath}/.gitignore`, CONTRACT_GITIGNORE);
            this.addFile(output, `${basePath}/.env.example`, CONTRACT_ENV_EXAMPLE);
        }
    }

    private adaptCargoToml(original: string, folderName: string, crateName: string, includeCacheSdk: boolean): string {
        let content = original.replace(/name\s*=\s*"[^"]+"/, `name = "${folderName}"`);
        if (includeCacheSdk && !content.includes('stylus-cache-sdk')) {
            content = content.replace(/(\[dependencies\]\s*\n)/, `$1stylus-cache-sdk = "0.1"\n`);
        }
        return content;
    }

    /**
     * Look through previously-generated node outputs to find the contract code
     * produced by a connected stylus-rust-contract node.
     */
    private extractConnectedContractInfo(context: ExecutionContext): { code: string; folder: string } | null {
        if (!context.nodeOutputs || context.nodeOutputs.size === 0) return null;

        for (const [, nodeOutput] of context.nodeOutputs) {
            for (const file of nodeOutput.files) {
                // Match any contracts/<name>/src/lib.rs generated by stylus-rust-contract
                const match = file.path.match(/^contracts\/([^/]+)\/src\/lib\.rs$/);
                if (match && file.content) {
                    return {
                        code: file.content,
                        folder: match[1],
                    };
                }
            }
        }

        return null;
    }
}

// ── Embedded template file constants ─────────────────────────────────────────
// These mirror apps/web/src/components/counter-contract/* so the fallback
// path (when the template directory is not on disk) generates the same output.

const RUST_TOOLCHAIN_TOML = `[toolchain]
channel = "1.87.0"
`;

const CARGO_CONFIG_TOML = `[target.wasm32-unknown-unknown]
rustflags = [
  "-C", "link-arg=-zstack-size=32768",
  "-C", "target-feature=-reference-types",
  "-C", "target-feature=+bulk-memory",
]

[target.aarch64-apple-darwin]
rustflags = [
"-C", "link-arg=-undefined",
"-C", "link-arg=dynamic_lookup",
]

[target.x86_64-apple-darwin]
rustflags = [
"-C", "link-arg=-undefined",
"-C", "link-arg=dynamic_lookup",
]
`;

const CONTRACT_GITIGNORE = `/target
.env
`;

const CONTRACT_ENV_EXAMPLE = `RPC_URL=
STYLUS_CONTRACT_ADDRESS=
PRIV_KEY_PATH=
`;

function generateMainRs(crateName: string): string {
    return `#![cfg_attr(not(any(test, feature = "export-abi")), no_main)]

#[cfg(not(any(test, feature = "export-abi")))]
#[no_mangle]
pub extern "C" fn main() {}

#[cfg(feature = "export-abi")]
fn main() {
    ${crateName}::print_from_args();
}
`;
}

function generateFullCargoToml(folderName: string, includeCacheSdk: boolean): string {
    let cacheDep = '';
    if (includeCacheSdk) cacheDep = `\nstylus-cache-sdk = "0.1"`;
    return `[package]
name = "${folderName}"
version = "0.1.11"
edition = "2021"
license = "MIT OR Apache-2.0"
keywords = ["arbitrum", "ethereum", "stylus", "alloy"]
description = "Stylus smart contract"

[dependencies]
alloy-primitives = "=0.8.20"
alloy-sol-types = "=0.8.20"
stylus-sdk = "0.9.0"
hex = { version = "0.4", default-features = false }${cacheDep}

[dev-dependencies]
alloy-primitives = { version = "=0.8.20", features = ["sha3-keccak"] }
tokio = { version = "1.12.0", features = ["full"] }
ethers = "2.0"
eyre = "0.6.8"
stylus-sdk = { version = "0.9.0", features = ["stylus-test"] }
dotenv = "0.15.0"

[features]
default = ["mini-alloc"]
export-abi = ["stylus-sdk/export-abi"]
debug = ["stylus-sdk/debug"]
mini-alloc = ["stylus-sdk/mini-alloc"]

[[bin]]
name = "${folderName}"
path = "src/main.rs"

[lib]
crate-type = ["lib", "cdylib"]

[profile.release]
codegen-units = 1
strip = true
lto = true
panic = "abort"
opt-level = 3
`;
}

function generateDeployScript(network: 'sepolia' | 'mainnet', folderName: string): string {
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
CONTRACT_DIR="contracts/${folderName}"

if [[ -z "\${PRIVATE_KEY:-}" ]]; then
  echo "Error: PRIVATE_KEY not set."
  exit 1
fi

cd "\${CONTRACT_DIR}"
cargo stylus deploy -e "\${RPC_URL}" --private-key "\${PRIVATE_KEY}" --no-verify

echo "Deployment completed. Use is_cacheable() to verify cacheable status."
`;
}

function generateCachingGuide(config: z.infer<typeof SmartCacheCachingConfig>, alreadyHasCaching: boolean, originalFolder: string): string {
    return `# SmartCache Integration Guide

## Folder Structure

\`\`\`
contracts/
<<<<<<< HEAD
├── ${originalFolder}/    # Original contract (without is_cacheable / opt_in_to_cache)
=======
├── cached-contract/          # Contract WITH is_cacheable helper (and stylus-cache-sdk)
>>>>>>> f97544e6af3451b21b8d1e8ba385e505da2403ba
├── cached-contract/          # Contract WITH is_cacheable helper (and stylus-cache-sdk)
│   ├── .cargo/
│   ├── src/
│   │   ├── lib.rs            # Contract + is_cacheable() injected
│   │   └── main.rs
<<<<<<< HEAD
│   └── ...
└── cached-contracts/     # Same contract WITH is_cacheable + opt_in_to_cache
=======
│   ├── .env.example
│   ├── .gitignore
│   ├── Cargo.toml            # Includes stylus-cache-sdk
│   └── rust-toolchain.toml
└── mycontract/               # Original contract (no caching helper)
>>>>>>> f97544e6af3451b21b8d1e8ba385e505da2403ba
│   ├── .env.example
│   ├── .gitignore
│   ├── Cargo.toml            # Includes stylus-cache-sdk
│   └── rust-toolchain.toml
└── mycontract/               # Original contract (no caching helper)
    ├── .cargo/
    ├── src/
    │   ├── lib.rs            # Your selected contract (counter, erc20, vending-machine, etc.)
    │   └── main.rs
    ├── .env.example
    ├── .gitignore
    ├── Cargo.toml
    └── rust-toolchain.toml
\`\`\`

## Quick 3-step setup

1. **Import the cache SDK**

   Add the crate to your \`Cargo.toml\` and import it in your contract:

   \`\`\`rust
   use stylus_cache_sdk::{is_contract_cacheable};
   \`\`\`

2. **Add the helper to your contract**

   \`\`\`rust
   /// Returns whether this contract is cacheable
   pub fn is_cacheable(&self) -> bool {
       is_contract_cacheable()
   }
   \`\`\`

3. **Deploy on Arbitrum Sepolia or Arbitrum One**

   Use the standard Stylus deploy command (replace the endpoint for mainnet):

   \`\`\`bash
   cargo stylus deploy --private-key "\${PRIVATE_KEY}" --endpoint "https://sepolia-rollup.arbitrum.io/rpc"
   \`\`\`

## After Adding is_cacheable

Once your contract has \`is_cacheable()\` (as in \`cached-contract/\`):

1. **Deploy** with \`cargo stylus deploy\`:
   \`\`\`bash
   cd contracts/cached-contracts
   cargo stylus deploy --private-key "\${PRIVATE_KEY}" --endpoint "https://sepolia-rollup.arbitrum.io/rpc"
   \`\`\`

2. **Cache check**: Running \`cargo stylus deploy\` will deploy and activate your contract. Use \`is_cacheable()\` to check whether the contract is cacheable:
   \`\`\`bash
   cast call <CONTRACT_ADDRESS> "is_cacheable()" --rpc-url <RPC_URL>
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

After deploying, verify the cache is active:

### 1. Check if contract is cacheable

\`\`\`bash
cast call <CONTRACT_ADDRESS> "is_cacheable()" --rpc-url <RPC_URL>
\`\`\`

Expected output: \`0x0000...0001\` (true)

### 2. Compare gas usage (before vs after)

\`\`\`bash
# Call a read function and check gasUsed
cast call <CONTRACT_ADDRESS> "get_count()" --rpc-url <RPC_URL> --trace

# After cache is warm, the same call should use less gas
\`\`\`

### 4. Troubleshooting cache issues

| Symptom | Cause | Fix |
|---------|-------|-----|
| \`is_cacheable()\` returns false | Cache SDK not linked | Ensure \`stylus-cache-sdk\` is in Cargo.toml dependencies |
| No gas improvement | Cache not yet warm | Caching improves on repeated calls within a block or across consecutive blocks |

## Resources

- [SmartCache Documentation](https://smartcache.gitbook.io/smartcache-docs)
- [stylus-cache-sdk](https://crates.io/crates/stylus-cache-sdk)
- [Stylus Gas & Caching Deep Dive](https://docs.arbitrum.io/stylus/reference/opcode-gas-pricing)
`;
}

function generateSmartCacheUsageReadme(): string {
    return `# SmartCache is_cacheable() Usage Guide

SmartCache is a gas optimization layer for Arbitrum Stylus that warms storage slots for frequently accessed contracts.

## The is_cacheable Function

To enable your contract for SmartCache, you must implement the \`is_cacheable\` function. This function tells the Arbitrum sequencer that your contract is compatible with the caching layer.

### Implementation Pattern (Stylus Rust)

\`\`\`rust
use stylus_sdk::prelude::*;

#[public]
impl MyContract {
    /// Returns whether this contract is cacheable
    /// SmartCache sequencer checks this to decide if storage should be warmed
    pub fn is_cacheable(&self) -> bool {
        true
    }
}
\`\`\`

### Why use is_cacheable?

1. **Lower Gas Costs**: Repeated access to storage slots becomes significantly cheaper (up to 95% reduction).
2. **Improved Latency**: Faster response times for read-heavy operations.
3. **Optimized for Stylus**: Specifically designed for the WASM-based Stylus runtime.

### Integrating with stylus-cache-sdk

For more advanced caching controls, use the \`stylus-cache-sdk\`:

\`\`\`rust
use stylus_cache_sdk::{is_contract_cacheable};

#[public]
impl MyContract {
    pub fn is_cacheable(&self) -> bool {
        is_contract_cacheable() // Dynamically controlled by SDK
    }
}
\`\`\`

## Supported Contract Types

Currently, SmartCache is optimally supported for **Stylus Rust Contracts**. If you are using other contract types (like Solidity), you may still see benefits from general L2 caching, but the explicit \`is_cacheable\` hook is a Stylus-specific feature.
`;
}
