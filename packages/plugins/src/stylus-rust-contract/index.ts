import { z } from 'zod';
import {
    BasePlugin,
    type PluginMetadata,
    type PluginPort,
    type CodegenOutput,
    type BlueprintNode,
    type ExecutionContext,
} from '@dapp-forge/plugin-sdk';
import { StylusRustContractConfig } from '@dapp-forge/blueprint-schema';

/**
 * Stylus Rust Contract Plugin
 * Guides users on creating Stylus Rust contracts for Arbitrum
 */
export class StylusRustContractPlugin extends BasePlugin<z.infer<typeof StylusRustContractConfig>> {
    readonly metadata: PluginMetadata = {
        id: 'stylus-rust-contract',
        name: 'Stylus Rust Contract',
        version: '0.1.0',
        description: 'Guide for building Rust smart contracts on Arbitrum Stylus',
        category: 'contracts',
        tags: ['rust', 'stylus', 'arbitrum', 'wasm', 'tutorial'],
    };

    readonly configSchema = StylusRustContractConfig as unknown as z.ZodType<z.infer<typeof StylusRustContractConfig>>;

    readonly ports: PluginPort[] = [
        {
            id: 'contract-out',
            name: 'Contract Code',
            type: 'output',
            dataType: 'contract',
        },
    ];

    getDefaultConfig(): Partial<z.infer<typeof StylusRustContractConfig>> {
        return {
            network: 'arbitrum-sepolia',
            exampleType: 'counter',
            contractCode: '',
        };
    }

    async generate(
        node: BlueprintNode,
        context: ExecutionContext
    ): Promise<CodegenOutput> {
        const config = this.configSchema.parse(node.config);
        const output = this.createEmptyOutput();

        const contractName = config.contractName || 'MyContract';
        const hasSmartCache = context.pathContext?.nodeTypes?.has('smartcache-caching') ?? false;
        
        // Use plural folder name if SmartCache is taking over, matching its 'mycontracts' output
        const folderBase = contractName.toLowerCase();
        const contractDir = hasSmartCache 
            ? `contracts/${folderBase}${folderBase.endsWith('s') ? '' : 's'}` 
            : `contracts/${folderBase}`;

        // Always generate the contract source — smartcache reads it from nodeOutputs
        const contractCode = config.contractCode || getExampleContract(config.exampleType);
        this.addFile(
            output,
            `${contractDir}/src/lib.rs`,
            contractCode
        );

        if (!hasSmartCache) {
            const crateName = contractName.toLowerCase().replace(/-/g, '_');

            // Generate full counter-contract template structure
            this.addFile(output, `${contractDir}/Cargo.toml`, generateStylusCargoToml(contractName));
            this.addFile(output, `${contractDir}/src/main.rs`, generateMainRs(crateName));
            this.addFile(output, `${contractDir}/rust-toolchain.toml`, RUST_TOOLCHAIN_TOML);
            this.addFile(output, `${contractDir}/.cargo/config.toml`, CARGO_CONFIG_TOML);
            this.addFile(output, `${contractDir}/.gitignore`, CONTRACT_GITIGNORE);
            this.addFile(output, `${contractDir}/.env.example`, CONTRACT_ENV_EXAMPLE);

            // Generate setup guide
            this.addFile(output, `${contractDir}/STYLUS_SETUP.md`, generateSetupGuide(config));

            // Generate deployment scripts
            this.addFile(output, 'scripts/deploy-sepolia.sh', generateDeployScript('sepolia'));
            this.addFile(output, 'scripts/deploy-mainnet.sh', generateDeployScript('mainnet'));

            // Add scripts
            this.addScript(output, 'stylus:build', `cd ${contractDir} && cargo build --release --target wasm32-unknown-unknown`);
            this.addScript(output, 'stylus:check', `cd ${contractDir} && cargo stylus check`);
            this.addScript(output, 'deploy:sepolia', 'bash scripts/deploy-sepolia.sh');
            this.addScript(output, 'deploy:mainnet', 'bash scripts/deploy-mainnet.sh');
        }

        // Always add environment variables so they appear in .env.example
        this.addEnvVar(output, 'STYLUS_RPC_URL', 'Arbitrum RPC URL for deployment', {
            required: true,
            defaultValue: config.network === 'arbitrum'
                ? 'https://arb1.arbitrum.io/rpc'
                : 'https://sepolia-rollup.arbitrum.io/rpc',
        });
        this.addEnvVar(output, 'DEPLOYER_PRIVATE_KEY', 'Private key for deployment', {
            required: true,
            secret: true,
        });

        context.logger.info(`Generated Stylus Rust Contract: ${contractName}`, {
            nodeId: node.id,
            network: config.network,
            smartCachePresent: hasSmartCache,
        });

        return output;
    }
}

// ── Embedded template file constants ─────────────────────────────────────────
// These mirror apps/web/src/components/counter-contract/* so the generated
// output always contains the full project structure.

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

function generateDeployScript(network: 'sepolia' | 'mainnet'): string {
    const rpcUrl = network === 'sepolia' 
        ? 'https://sepolia-rollup.arbitrum.io/rpc'
        : 'https://arb1.arbitrum.io/rpc';
    
    const networkName = network === 'sepolia' ? 'Arbitrum Sepolia' : 'Arbitrum One';

    return `#!/bin/bash
# Stylus ${networkName} Deployment Script
# This script deploys your Stylus contract to ${networkName}

# Load .env if present (ignore comments)
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
fi

# Fail on error, undefined var, or pipefail
set -euo pipefail

# ${networkName} RPC URL
RPC_URL="${rpcUrl}"

# Check for PRIVATE_KEY environment variable
if [[ -z "\${PRIVATE_KEY:-}" ]]; then
  echo "Error: PRIVATE_KEY environment variable is not set."
  echo "Please set your private key: export PRIVATE_KEY=your_private_key_here"
  exit 1
fi

# Check for required tools
for cmd in cast cargo rustup curl; do
  if ! command -v "$cmd" &> /dev/null; then
    echo "Error: $cmd is not installed."
    exit 1
  fi
done

# Ensure the wasm target is installed for the active toolchain
if ! rustup target list --installed | grep -q "^wasm32-unknown-unknown$"; then
  echo "Rust target wasm32-unknown-unknown not found. Adding target using rustup..."
  if ! rustup target add wasm32-unknown-unknown; then
    echo "Error: Failed to add wasm32-unknown-unknown target via rustup."
    echo "If you're using a custom toolchain, ensure rustup is configured correctly."
    exit 1
  fi
  echo "wasm32-unknown-unknown target installed."
else
  echo "wasm32-unknown-unknown target already installed."
fi

# (Optional) check that \`cargo stylus\` can be invoked
if ! cargo stylus --help &> /dev/null; then
  echo "Warning: 'cargo stylus' didn't respond to --help. It may still work when run as a subcommand; continuing..."
fi

# Check if we can connect to ${networkName}
echo "Checking connection to ${networkName}..."
if ! curl -s -X POST -H "Content-Type: application/json" \\
  --data '{"jsonrpc":"2.0","method":"net_version","params":[],"id":1}' \\
  "\${RPC_URL}" > /dev/null; then
    echo "Error: Cannot connect to ${networkName} RPC"
    exit 1
fi
echo "Connected to ${networkName}!"

echo "Deploying the Stylus contract using cargo stylus..."
deploy_output=$(cargo stylus deploy -e "\${RPC_URL}" --private-key "\${PRIVATE_KEY}" --no-verify 2>&1) || true

# If cargo stylus failed, exit with helpful output
if [[ $? -ne 0 ]]; then
    echo "Error: Contract deployment failed"
    echo "Deploy output: $deploy_output"
    exit 1
fi

# Extract deployment transaction hash using more precise pattern
deployment_tx=$(echo "$deploy_output" | grep -i "transaction\\|tx" | grep -oE '0x[a-fA-F0-9]{64}' | head -1)

# Extract contract address using more precise pattern
contract_address=$(echo "$deploy_output" | grep -i "contract\\|deployed" | grep -oE '0x[a-fA-F0-9]{40}' | head -1)

# If the above patterns don't work, try alternative patterns for cargo stylus output
if [[ -z "$deployment_tx" ]]; then
    deployment_tx=$(echo "$deploy_output" | grep -oE '0x[a-fA-F0-9]{64}' | head -1)
fi

if [[ -z "$contract_address" ]]; then
    contract_address=$(echo "$deploy_output" | grep -oE '0x[a-fA-F0-9]{40}' | head -1)
fi

# Verify extraction was successful
if [[ -z "$deployment_tx" ]]; then
    echo "Error: Could not extract deployment transaction hash from output"
    echo "Deploy output: $deploy_output"
    exit 1
fi

echo "Stylus contract deployed successfully!"
echo "Transaction hash: $deployment_tx"

if [[ ! -z "$contract_address" ]]; then
    echo "Contract address: $contract_address"
fi

echo "Deployment completed successfully on ${networkName}!"
`;
}

function generateStylusCargoToml(name: string): string {
    const folderName = name.toLowerCase();
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
hex = { version = "0.4", default-features = false }

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

/**
 * Returns the exact same contract code that the UI form shows for each template type.
 * This ensures the generated output matches the preview the user sees in the
 * stylus-rust-contract-form.tsx TEMPLATES object.
 */
function getExampleContract(type: string): string {
    if (type === 'counter') {
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

    if (type === 'vending-machine') {
        return `//!
//! Stylus Cupcake Example
//!

#![cfg_attr(not(feature = "export-abi"), no_main)]
extern crate alloc;

use alloy_primitives::{Address, Uint};
use stylus_sdk::alloy_primitives::U256;
use stylus_sdk::prelude::*;
use stylus_sdk::{block, console};

sol_storage! {
    #[entrypoint]
    pub struct VendingMachine {
        mapping(address => uint256) cupcake_balances;
        mapping(address => uint256) cupcake_distribution_times;
    }
}

#[public]
impl VendingMachine {
    pub fn give_cupcake_to(&mut self, user_address: Address) -> bool {
        let last_distribution = self.cupcake_distribution_times.get(user_address);
        let five_seconds_from_last_distribution = last_distribution + U256::from(5);
        let current_time = block::timestamp();
        let user_can_receive_cupcake =
            five_seconds_from_last_distribution <= Uint::<256, 4>::from(current_time);

        if user_can_receive_cupcake {
            let mut balance_accessor = self.cupcake_balances.setter(user_address);
            let balance = balance_accessor.get() + U256::from(1);
            balance_accessor.set(balance);

            let mut time_accessor = self.cupcake_distribution_times.setter(user_address);
            let new_distribution_time = block::timestamp();
            time_accessor.set(Uint::<256, 4>::from(new_distribution_time));
            return true;
        } else {
            console!(
                "HTTP 429: Too Many Cupcakes (wait at least 5 seconds between cupcakes)"
            );
            return false;
        }
    }

    pub fn get_cupcake_balance_for(&self, user_address: Address) -> Uint<256, 4> {
        return self.cupcake_balances.get(user_address);
    }
}
`;
    }

    if (type === 'erc20') {
        return `// SPDX-License-Identifier: MIT
// Compatible with OpenZeppelin Contracts for Stylus ^0.3.0

#![cfg_attr(not(any(test, feature = "export-abi")), no_main)]
extern crate alloc;

use alloc::vec::Vec;
use openzeppelin_stylus::token::erc20::extensions::burnable::IErc20Burnable;
use openzeppelin_stylus::token::erc20::{self, Erc20, IErc20};
use stylus_sdk::alloy_primitives::{Address, U256};
use stylus_sdk::prelude::*;

#[entrypoint]
#[storage]
struct MyToken {
    erc20: Erc20,
}

#[public]
#[implements(IErc20<Error = erc20::Error>, IErc20Burnable<Error = erc20::Error>)]
impl MyToken {}

#[public]
impl IErc20 for MyToken {
    type Error = erc20::Error;

    fn total_supply(&self) -> U256 {
        self.erc20.total_supply()
    }

    fn balance_of(&self, account: Address) -> U256 {
        self.erc20.balance_of(account)
    }

    fn transfer(&mut self, to: Address, value: U256) -> Result<bool, Self::Error> {
        Ok(self.erc20.transfer(to, value)?)
    }

    fn allowance(&self, owner: Address, spender: Address) -> U256 {
        self.erc20.allowance(owner, spender)
    }

    fn approve(&mut self, spender: Address, value: U256) -> Result<bool, Self::Error> {
        Ok(self.erc20.approve(spender, value)?)
    }

    fn transfer_from(&mut self, from: Address, to: Address, value: U256) -> Result<bool, Self::Error> {
        Ok(self.erc20.transfer_from(from, to, value)?)
    }
}

#[public]
impl IErc20Burnable for MyToken {
    type Error = erc20::Error;

    fn burn(&mut self, value: U256) -> Result<(), Self::Error> {
        Ok(self.erc20.burn(value)?)
    }

    fn burn_from(&mut self, account: Address, value: U256) -> Result<(), Self::Error> {
        Ok(self.erc20.burn_from(account, value)?)
    }
}
`;
    }

    if (type === 'erc721') {
        return `// SPDX-License-Identifier: MIT
// Compatible with OpenZeppelin Contracts for Stylus ^0.3.0

#![cfg_attr(not(any(test, feature = "export-abi")), no_main)]
extern crate alloc;

use alloc::vec::Vec;
use openzeppelin_stylus::token::erc721::extensions::burnable::IErc721Burnable;
use openzeppelin_stylus::token::erc721::{self, Erc721, IErc721};
use openzeppelin_stylus::utils::introspection::erc165::IErc165;
use stylus_sdk::abi::Bytes;
use stylus_sdk::alloy_primitives::{Address, FixedBytes, U256};
use stylus_sdk::prelude::*;

#[entrypoint]
#[storage]
struct MyToken {
    erc721: Erc721,
}

#[public]
#[implements(IErc721<Error = erc721::Error>, IErc721Burnable<Error = erc721::Error>, IErc165)]
impl MyToken {}

#[public]
impl IErc721 for MyToken {
    type Error = erc721::Error;

    fn balance_of(&self, owner: Address) -> Result<U256, Self::Error> {
        Ok(self.erc721.balance_of(owner)?)
    }

    fn owner_of(&self, token_id: U256) -> Result<Address, Self::Error> {
        Ok(self.erc721.owner_of(token_id)?)
    }

    fn safe_transfer_from(&mut self, from: Address, to: Address, token_id: U256) -> Result<(), Self::Error> {
        Ok(self.erc721.safe_transfer_from(from, to, token_id)?)
    }

    #[selector(name = "safeTransferFrom")]
    fn safe_transfer_from_with_data(&mut self, from: Address, to: Address, token_id: U256, data: Bytes) -> Result<(), Self::Error> {
        Ok(self.erc721.safe_transfer_from_with_data(from, to, token_id, data)?)
    }

    fn transfer_from(&mut self, from: Address, to: Address, token_id: U256) -> Result<(), Self::Error> {
        Ok(self.erc721.transfer_from(from, to, token_id)?)
    }

    fn approve(&mut self, to: Address, token_id: U256) -> Result<(), Self::Error> {
        Ok(self.erc721.approve(to, token_id)?)
    }

    fn set_approval_for_all(&mut self, operator: Address, approved: bool) -> Result<(), Self::Error> {
        Ok(self.erc721.set_approval_for_all(operator, approved)?)
    }

    fn get_approved(&self, token_id: U256) -> Result<Address, Self::Error> {
        Ok(self.erc721.get_approved(token_id)?)
    }

    fn is_approved_for_all(&self, owner: Address, operator: Address) -> bool {
        self.erc721.is_approved_for_all(owner, operator)
    }
}

#[public]
impl IErc721Burnable for MyToken {
    type Error = erc721::Error;

    fn burn(&mut self, token_id: U256) -> Result<(), Self::Error> {
        Ok(self.erc721.burn(token_id)?)
    }
}

#[public]
impl IErc165 for MyToken {
    fn supports_interface(&self, interface_id: FixedBytes<4>) -> bool {
        self.erc721.supports_interface(interface_id)
    }
}
`;
    }

    if (type === 'erc1155') {
        return `// SPDX-License-Identifier: MIT
// Compatible with OpenZeppelin Contracts for Stylus ^0.3.0

#![cfg_attr(not(any(test, feature = "export-abi")), no_main)]
extern crate alloc;

use alloc::vec::Vec;
use openzeppelin_stylus::token::erc1155::extensions::{
    Erc1155Supply, IErc1155Burnable, IErc1155Supply
};
use openzeppelin_stylus::token::erc1155::{self, IErc1155};
use openzeppelin_stylus::utils::introspection::erc165::IErc165;
use stylus_sdk::abi::Bytes;
use stylus_sdk::alloy_primitives::{Address, FixedBytes, U256};
use stylus_sdk::prelude::*;

#[entrypoint]
#[storage]
struct MyToken {
    erc1155_supply: Erc1155Supply,
}

#[public]
#[implements(IErc1155<Error = erc1155::Error>, IErc1155Burnable<Error = erc1155::Error>, IErc1155Supply, IErc165)]
impl MyToken {}

#[public]
impl IErc1155 for MyToken {
    type Error = erc1155::Error;

    fn balance_of(&self, account: Address, id: U256) -> U256 {
        self.erc1155_supply.balance_of(account, id)
    }

    fn balance_of_batch(&self, accounts: Vec<Address>, ids: Vec<U256>) -> Result<Vec<U256>, Self::Error> {
        Ok(self.erc1155_supply.balance_of_batch(accounts, ids)?)
    }

    fn set_approval_for_all(&mut self, operator: Address, approved: bool) -> Result<(), Self::Error> {
        Ok(self.erc1155_supply.set_approval_for_all(operator, approved)?)
    }

    fn is_approved_for_all(&self, account: Address, operator: Address) -> bool {
        self.erc1155_supply.is_approved_for_all(account, operator)
    }

    fn safe_transfer_from(&mut self, from: Address, to: Address, id: U256, value: U256, data: Bytes) -> Result<(), Self::Error> {
        Ok(self.erc1155_supply.safe_transfer_from(from, to, id, value, data)?)
    }

    fn safe_batch_transfer_from(
        &mut self,
        from: Address,
        to: Address,
        ids: Vec<U256>,
        values: Vec<U256>,
        data: Bytes,
    ) -> Result<(), Self::Error> {
        Ok(self.erc1155_supply.safe_batch_transfer_from(from, to, ids, values, data)?)
    }
}

#[public]
impl IErc1155Burnable for MyToken {
    type Error = erc1155::Error;

    fn burn(&mut self, account: Address, token_id: U256, value: U256) -> Result<(), Self::Error> {
        Ok(self.erc1155_supply._burn(account, token_id, value)?)
    }

    fn burn_batch(&mut self, account: Address, token_ids: Vec<U256>, values: Vec<U256>) -> Result<(), Self::Error> {
        Ok(self.erc1155_supply._burn_batch(account, token_ids, values)?)
    }
}

#[public]
impl IErc1155Supply for MyToken {
    fn total_supply(&self, id: U256) -> U256 {
        self.erc1155_supply.total_supply(id)
    }

    #[selector(name = "totalSupply")]
    fn total_supply_all(&self) -> U256 {
        self.erc1155_supply.total_supply_all()
    }

    fn exists(&self, id: U256) -> bool {
        self.erc1155_supply.exists(id)
    }
}

#[public]
impl IErc165 for MyToken {
    fn supports_interface(&self, interface_id: FixedBytes<4>) -> bool {
        self.erc1155_supply.supports_interface(interface_id)
    }
}
`;
    }

    if (type === 'storage') {
        return `#![cfg_attr(not(feature = "export-abi"), no_main)]
extern crate alloc;

use stylus_sdk::{alloy_primitives::{U256, Address}, prelude::*};

sol_storage! {
    #[entrypoint]
    pub struct Storage {
        mapping(address => uint256) balances;
    }
}

#[public]
impl Storage {
    pub fn get_balance(&self, addr: Address) -> U256 {
        self.balances.get(addr)
    }

    pub fn set_balance(&mut self, addr: Address, value: U256) {
        self.balances.insert(addr, value);
    }
}
`;
    }

    // Custom template fallback
    return `//! Custom Stylus Contract
//! Add your contract logic here.

#![cfg_attr(not(feature = "export-abi"), no_main)]
extern crate alloc;

use stylus_sdk::{alloy_primitives::U256, prelude::*};

sol_storage! {
    #[entrypoint]
    pub struct MyContract {
        // Add your storage variables here
    }
}

#[public]
impl MyContract {
    // Add your public functions here
}
`;
}

function generateSetupGuide(config: z.infer<typeof StylusRustContractConfig>): string {
    return `# Stylus Rust Contract Setup Guide

## Prerequisites

1. **Install Rust** (if not already installed):
   \`\`\`bash
   curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
   \`\`\`

2. **Add WASM target**:
   \`\`\`bash
   rustup target add wasm32-unknown-unknown
   \`\`\`

3. **Install Cargo Stylus CLI**:
   \`\`\`bash
   cargo install cargo-stylus
   \`\`\`

## Project Structure

\`\`\`
contracts/
└── ${config.contractName?.toLowerCase() || 'mycontract'}/
    ├── Cargo.toml
    └── src/
        └── lib.rs
\`\`\`

## Building Your Contract

\`\`\`bash
pnpm stylus:build
\`\`\`

## Checking Deployment Readiness

\`\`\`bash
pnpm stylus:check
\`\`\`

## Deploying to ${config.network === 'arbitrum' ? 'Arbitrum One' : 'Arbitrum Sepolia'}

1. Set your environment variables in \`.env\`:
   \`\`\`
   STYLUS_RPC_URL=${config.network === 'arbitrum' ? 'https://arb1.arbitrum.io/rpc' : 'https://sepolia-rollup.arbitrum.io/rpc'}
   DEPLOYER_PRIVATE_KEY=your_private_key_here
   \`\`\`

2. Deploy:
   \`\`\`bash
   pnpm stylus:deploy
   \`\`\`

---

## Stylus SDK Patterns

### Storage with \\\`sol_storage!\\\`

\\\`\\\`\\\`rust
sol_storage! {
    #[entrypoint]
    pub struct MyContract {
        uint256 count;
        bool paused;
        address owner;
        mapping(address => uint256) balances;
    }
}
\\\`\\\`\\\`

Access: \\\`self.count.get()\\\` / \\\`self.count.set(value)\\\`.

### Public & Payable Methods

\\\`\\\`\\\`rust
#[public]
impl MyContract {
    pub fn read_value(&self) -> U256 { self.count.get() }
    pub fn write_value(&mut self, val: U256) { self.count.set(val); }

    #[payable]
    pub fn deposit(&mut self) {
        let value = msg::value();
        // ...
    }
}
\\\`\\\`\\\`

### Events

\\\`\\\`\\\`rust
sol! {
    event Transfer(address indexed from, address indexed to, uint256 value);
}

evm::log(Transfer { from: caller, to: recipient, value: amount });
\\\`\\\`\\\`

### Error Handling

\\\`\\\`\\\`rust
sol! {
    error InsufficientBalance(uint256 available, uint256 required);
    error Unauthorized(address caller);
}

#[derive(SolidityError)]
pub enum MyError {
    InsufficientBalance(InsufficientBalance),
    Unauthorized(Unauthorized),
}
\\\`\\\`\\\`

### Cross-Contract Calls

\\\`\\\`\\\`rust
sol_interface! {
    interface IERC20 {
        function balanceOf(address owner) external view returns (uint256);
        function transfer(address to, uint256 amount) external returns (bool);
    }
}

let token = IERC20::new(token_address);
let balance = token.balance_of(self, owner)?;
\\\`\\\`\\\`

### Testing

\\\`\\\`\\\`toml
[dev-dependencies]
stylus-sdk = { version = "0.10.0", features = ["stylus-test"] }
\\\`\\\`\\\`

\\\`\\\`\\\`rust
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_counter() {
        let mut contract = Counter::default();
        contract.increment();
        assert_eq!(contract.get_count(), U256::from(1));
    }
}
\\\`\\\`\\\`

Run with \\\`cargo test\\\`. The \\\`stylus-test\\\` feature simulates tx context without deployment.

---

## Post-Deployment Verification

1. **Export ABI** for frontend consumption:
   \\\`\\\`\\\`bash
   cargo stylus export-abi --output=./abi.json --json
   \\\`\\\`\\\`

2. **Verify on Arbiscan**:
   - Navigate to your contract on [Arbiscan](https://arbiscan.io) or [Sepolia Arbiscan](https://sepolia.arbiscan.io)
   - Go to **Contract** tab → **Verify & Publish** → select **Stylus**
   - Upload source and verify against the deployment hash

3. **Test with cast**:
   \\\`\\\`\\\`bash
   cast call <ADDR> "get_count()" --rpc-url <RPC_URL>
   cast send <ADDR> "increment()" --private-key $PK --rpc-url <RPC_URL>
   \\\`\\\`\\\`

4. **Estimate gas** before mainnet:
   \\\`\\\`\\\`bash
   cargo stylus deploy --estimate-gas --endpoint="<RPC_URL>"
   \\\`\\\`\\\`

---

## Resources

- [Arbitrum Stylus Quickstart](https://docs.arbitrum.io/stylus/quickstart)
- [Stylus SDK Documentation](https://docs.rs/stylus-sdk)
- [Stylus by Example](https://stylus-by-example.org/)
- [Stylus Examples](https://github.com/OffchainLabs/stylus-hello-world)
- [Cargo Stylus CLI](https://github.com/OffchainLabs/stylus-sdk-rs/blob/main/cargo-stylus/README.md)
- [Arbiscan Contract Verification](https://docs.arbitrum.io/stylus/how-tos/verifying-contracts-arbiscan)
`;
}
