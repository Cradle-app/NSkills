'use client';

import { useMemo, useEffect } from 'react';
import { useBlueprintStore } from '@/store/blueprint';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Database, Zap, ExternalLink, ArrowRight, AlertCircle, Link2, Rocket, Globe } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CodeBlock } from '@/components/ui/code-block';

interface Props {
    nodeId: string;
    config: Record<string, unknown>;
}

// Template labels for display
const TEMPLATE_LABELS: Record<string, string> = {
    'counter': 'Counter',
    'vending-machine': 'Vending Machine',
    'storage': 'Storage Mapping',
    'erc20-stylus': 'ERC-20 Stylus',
    'erc721-stylus': 'ERC-721 Stylus',
    'erc1155-stylus': 'ERC-1155 Stylus',
    'custom': 'Custom Contract',
};

// RPC endpoints for deployment
const RPC_ENDPOINTS: Record<string, string> = {
    'arbitrum-sepolia': 'https://sepolia-rollup.arbitrum.io/rpc',
    'arbitrum': 'https://arb1.arbitrum.io/rpc',
};

// The caching imports to add
const CACHE_IMPORTS = `use stylus_cache_sdk::{is_contract_cacheable};`;

// The caching function to add to existing impl
const CACHE_FUNCTIONS = `
    /// Returns whether this contract is cacheable
    pub fn is_cacheable(&self) -> bool {
        is_contract_cacheable()
    }`;

function addCachingToContract(code: string): string {
    if (!code.trim()) return '';

    let modified = code;

    // Check if caching is already added
    if (modified.includes('stylus_cache_sdk')) {
        return modified;
    }

    // Add import after the last use statement
    const useStatements = modified.match(/use [^;]+;/g);
    if (useStatements && useStatements.length > 0) {
        const lastUse = useStatements[useStatements.length - 1];
        modified = modified.replace(lastUse, `${lastUse}\n${CACHE_IMPORTS}`);
    } else {
        // Add at the beginning if no use statements
        modified = `${CACHE_IMPORTS}\n\n${modified}`;
    }

    // Find ALL #[public] impl blocks
    const implRegex = /#\[public\]\s*(?!#\[implements)impl\s+(\w+)(?:\s+for\s+\w+)?\s*\{/g;
    const implMatches: { index: number; match: string; structName: string }[] = [];
    let match;

    while ((match = implRegex.exec(modified)) !== null) {
        const afterMatch = modified.slice(match.index);
        let braceCount = 0;
        let implContent = '';
        let foundOpenBrace = false;

        for (let i = 0; i < afterMatch.length; i++) {
            if (afterMatch[i] === '{') {
                if (!foundOpenBrace) foundOpenBrace = true;
                braceCount++;
            }
            if (afterMatch[i] === '}') {
                braceCount--;
                if (braceCount === 0 && foundOpenBrace) {
                    implContent = afterMatch.slice(match[0].length, i);
                    break;
                }
            }
        }

        // Only add if impl has actual function content
        if (implContent.includes('fn ')) {
            implMatches.push({
                index: match.index,
                match: match[0],
                structName: match[1]
            });
        }
    }

    // Add to the LAST valid impl block
    if (implMatches.length > 0) {
        const lastImpl = implMatches[implMatches.length - 1];
        const implStart = lastImpl.index;
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
            modified = modified.slice(0, implEnd) + CACHE_FUNCTIONS + '\n' + modified.slice(implEnd);
        }
    } else {
        // Last resort: create a new impl block
        const structMatch = modified.match(/#\[entrypoint\]\s*(?:#\[storage\])?\s*(?:pub\s+)?struct\s+(\w+)/);
        if (structMatch) {
            const structName = structMatch[1];
            const newImplBlock = `
/// Caching functions added by SmartCache
#[public]
impl ${structName} {
    /// Returns whether this contract is cacheable
    pub fn is_cacheable(&self) -> bool {
        is_contract_cacheable()
    }
}`;
            modified = modified + newImplBlock;
        }
    }

    return modified;
}

// Template contracts (synchronized with stylus-rust-contract-form)
const TEMPLATES: Record<string, string> = {
    counter: `//!
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
}`,
    'vending-machine': `//!
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
}`,
    storage: `sol_storage! {
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
}`,
    'erc20-stylus': `// Only run this as a WASM if the export-abi feature is not set.
#![cfg_attr(not(any(feature = "export-abi", test)), no_main)]
extern crate alloc;

// Modules and imports
mod erc20;

use alloy_primitives::{Address, U256};
use stylus_sdk::{
    msg,
    prelude::*
};
use crate::erc20::{Erc20, Erc20Params, Erc20Error};

/// Immutable definitions
struct SuperPositionTokenParams;
impl Erc20Params for SuperPositionTokenParams {
    const NAME: &'static str = "SuperPositionToken";
    const SYMBOL: &'static str = "SPT";
    const DECIMALS: u8 = 18;
}

// Define the entrypoint as a Solidity storage object. The sol_storage! macro
// will generate Rust-equivalent structs with all fields mapped to Solidity-equivalent
// storage slots and types.
sol_storage! {
    #[entrypoint]
    struct SuperPositionToken {
        // Allows erc20 to access SuperPositionToken's storage and make calls
        #[borrow]
        Erc20<SuperPositionTokenParams> erc20;
    }
}

#[public]
#[inherit(Erc20<SuperPositionTokenParams>)]
impl SuperPositionToken {
    /// Mints tokens
    pub fn mint(&mut self, value: U256) -> Result<(), Erc20Error> {
        self.erc20.mint(msg::sender(), value)?;
        Ok(())
    }

    /// Mints tokens to another address
    pub fn mint_to(&mut self, to: Address, value: U256) -> Result<(), Erc20Error> {
        self.erc20.mint(to, value)?;
        Ok(())
    }

    /// Burns tokens
    pub fn burn(&mut self, value: U256) -> Result<(), Erc20Error> {
        self.erc20.burn(msg::sender(), value)?;
        Ok(())
    }
}`,
    'erc721-stylus': `extern crate alloc;

// Modules and imports
mod erc721;

/// Import the Stylus SDK along with alloy primitive types for use in our program.
use stylus_sdk::{
    abi::Bytes,
    call::Call,
    contract,
    msg,
    prelude::*,
    alloy_primitives::{Address, U256}
};
use alloy_sol_types::sol;
use crate::erc721::{Erc721, Erc721Params};

// Interfaces for the Art contract and the ERC20 contract
sol_interface! {
    interface NftArt {
        function initialize(address token_contract_address) external;
        function generateArt(uint256 token_id, address owner) external returns(string);
    }
}

struct SuperPositionNFTParams;

/// Immutable definitions
impl Erc721Params for SuperPositionNFTParams {
    const NAME: &'static str = "SuperPositionNFT";
    const SYMBOL: &'static str = "SPTNFT";
}

// Define the entrypoint as a Solidity storage object. The sol_storage! macro
// will generate Rust-equivalent structs with all fields mapped to Solidity-equivalent
// storage slots and types.
sol_storage! {
    #[entrypoint]
    struct SuperPositionNFT {
        address art_contract_address;

        #[borrow] // Allows erc721 to access MyToken's storage and make calls
        Erc721<SuperPositionNFTParams> erc721;
    }
}

// Declare Solidity error types
sol! {
    /// Contract has already been initialized
    error AlreadyInitialized();
    /// A call to an external contract failed
    error ExternalCallFailed();
}

/// Represents the ways methods may fail.
#[derive(SolidityError)]
pub enum SuperPositionNFTError {
    AlreadyInitialized(AlreadyInitialized),
    ExternalCallFailed(ExternalCallFailed),
}

#[public]
#[inherit(Erc721<SuperPositionNFTParams>)]
impl SuperPositionNFT {
    /// Mints an NFT, but does not call onErc712Received
    pub fn mint(&mut self) -> Result<(), Vec<u8>> {
        let minter = msg::sender();
        self.erc721.mint(minter)?;
        Ok(())
    }

    /// Mints an NFT to the specified address, and does not call onErc712Received
    pub fn mint_to(&mut self, to: Address) -> Result<(), Vec<u8>> {
        self.erc721.mint(to)?;
        Ok(())
    }

    /// Mints an NFT and calls onErc712Received with empty data
    pub fn safe_mint(&mut self, to: Address) -> Result<(), Vec<u8>> {
        Erc721::safe_mint(self, to, Vec::new())?;
        Ok(())
    }

    /// Burns an NFT
    pub fn burn(&mut self, token_id: U256) -> Result<(), Vec<u8>> {
        // This function checks that msg::sender() owns the specified token_id
        self.erc721.burn(msg::sender(), token_id)?;
        Ok(())
    }
}`,
    'erc1155-stylus': `// SPDX-License-Identifier: MIT
#![cfg_attr(not(any(test, feature = "export-abi")), no_main)]
extern crate alloc;

pub mod erc1155;

use alloc::vec::Vec;
use erc1155::Erc1155;
use stylus_sdk::{alloy_primitives::{Address, U256}, prelude::*};

#[entrypoint]
#[storage]
pub struct My1155 {
    erc1155: Erc1155,
}

#[public]
impl My1155 {
    pub fn balance_of(&self, account: Address, id: U256) -> U256 {
        self.erc1155.balance_of(account, id)
    }

    pub fn balance_of_batch(&self, accounts: Vec<Address>, ids: Vec<U256>) -> Result<Vec<U256>, Vec<u8>> {
        self.erc1155.balance_of_batch(accounts, ids).map_err(|e| e.into())
    }

    pub fn set_approval_for_all(&mut self, operator: Address, approved: bool) -> Result<(), Vec<u8>> {
        self.erc1155.set_approval_for_all(operator, approved).map_err(|e| e.into())
    }

    pub fn is_approved_for_all(&self, account: Address, operator: Address) -> bool {
        self.erc1155.is_approved_for_all(account, operator)
    }

    pub fn safe_transfer_from(
        &mut self,
        from: Address,
        to: Address,
        id: U256,
        value: U256,
        data: Vec<u8>,
    ) -> Result<(), Vec<u8>> {
        self.erc1155.safe_transfer_from(from, to, id, value, data).map_err(|e| e.into())
    }

    pub fn safe_batch_transfer_from(
        &mut self,
        from: Address,
        to: Address,
        ids: Vec<U256>,
        values: Vec<U256>,
        data: Vec<u8>,
    ) -> Result<(), Vec<u8>> {
        self.erc1155.safe_batch_transfer_from(from, to, ids, values, data).map_err(|e| e.into())
    }
}`,
};

export function SmartCacheCachingForm({ nodeId, config }: Props) {
    const { updateNodeConfig, blueprint } = useBlueprintStore();

    const updateConfig = (key: string, value: unknown) => {
        updateNodeConfig(nodeId, { ...config, [key]: value });
    };

    const autoOptIn = (config.autoOptIn as boolean) ?? true;
    const deployNetwork = (config.deployNetwork as string) ?? 'arbitrum-sepolia';

    // Find connected stylus-rust-contract nodes by looking at edges
    const connectedContract = useMemo(() => {
        // Find edges where this node is the target (receiving input)
        const incomingEdges = blueprint.edges.filter(edge => edge.target === nodeId);

        // Find the source nodes that are contract types
        for (const edge of incomingEdges) {
            const sourceNode = blueprint.nodes.find(n => n.id === edge.source);
            if (!sourceNode) continue;

            const nodeConfig = sourceNode.config as Record<string, unknown>;

            // Handle specialized token nodes
            if (['erc20-stylus', 'erc721-stylus', 'erc1155-stylus'].includes(sourceNode.type)) {
                const templateName = TEMPLATE_LABELS[sourceNode.type] || sourceNode.type;
                const code = TEMPLATES[sourceNode.type];
                if (code) {
                    return { code, templateName, exampleType: sourceNode.type };
                }
            }

            // Handle general stylus-rust-contract nodes
            if (sourceNode.type === 'stylus-rust-contract') {
                const exampleType = (nodeConfig.exampleType as string) ?? 'counter';
                const contractCode = nodeConfig.contractCode as string;
                const templateLabel = TEMPLATE_LABELS[exampleType] || exampleType;

                // If custom, use contractCode; otherwise use template
                if (exampleType === 'custom' && contractCode) {
                    return { code: contractCode, templateName: templateLabel, exampleType };
                } else if (TEMPLATES[exampleType]) {
                    return { code: TEMPLATES[exampleType], templateName: templateLabel, exampleType };
                }
            }
        }
        return null;
    }, [blueprint.edges, blueprint.nodes, nodeId]);

    // Get the cached version of the code
    const cachedCode = useMemo(() => {
        if (connectedContract?.code) {
            return addCachingToContract(connectedContract.code);
        }
        return '';
    }, [connectedContract]);

    // Persist contract code and exampleType to config so plugin can use them during generation
    useEffect(() => {
        if (connectedContract?.code) {
            updateNodeConfig(nodeId, {
                contractCode: connectedContract.code,
                exampleType: connectedContract.exampleType,
            });
        }
    }, [nodeId, connectedContract?.code, connectedContract?.exampleType]);

    // Generate deployment command based on selected network
    const deployCommand = `cargo stylus deploy \\
  --endpoint='${RPC_ENDPOINTS[deployNetwork]}' \\
  --private-key="<YOUR_PRIVATE_KEY>"`;

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center gap-2 p-3 rounded-lg border border-forge-border/50 bg-gradient-to-r from-accent-cyan/10 to-transparent">
                <Database className="w-5 h-5 text-accent-cyan" />
                <div>
                    <h3 className="text-sm font-medium text-white">SmartCache Caching</h3>
                    <p className="text-[11px] text-forge-muted">Enable contract caching for cheaper gas costs</p>
                </div>
            </div>

            {/* Connection Status */}
            {connectedContract ? (
                <div className="p-3 rounded-lg border border-green-500/30 bg-green-500/5">
                    <div className="flex items-center gap-2">
                        <Link2 className="w-4 h-4 text-green-400" />
                        <span className="text-xs font-medium text-white">
                            Connected to: <span className="text-accent-cyan">{connectedContract.templateName}</span>
                        </span>
                    </div>
                    <p className="text-[10px] text-forge-muted mt-1">
                        Contract code will be automatically enhanced with caching functions
                    </p>
                </div>
            ) : (
                <div className="p-3 rounded-lg border border-amber-500/30 bg-amber-500/5">
                    <div className="flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-amber-400" />
                        <span className="text-xs font-medium text-white">
                            No contract connected
                        </span>
                    </div>
                    <p className="text-[10px] text-forge-muted mt-1">
                        Connect a Stylus Rust Contract node to this node to enable caching
                    </p>
                </div>
            )}

            {/* Benefits */}
            <div className="grid grid-cols-2 gap-2">
                <div className="p-2.5 rounded-lg border border-accent-cyan/20 bg-accent-cyan/5">
                    <div className="flex items-center gap-1.5 mb-1">
                        <Zap className="w-3.5 h-3.5 text-accent-cyan" />
                        <span className="text-[11px] font-medium text-white">Cheaper Calls</span>
                    </div>
                    <p className="text-[10px] text-forge-muted">Reduced gas for repeated operations</p>
                </div>
                <div className="p-2.5 rounded-lg border border-accent-cyan/20 bg-accent-cyan/5">
                    <div className="flex items-center gap-1.5 mb-1">
                        <Zap className="w-3.5 h-3.5 text-accent-cyan" />
                        <span className="text-[11px] font-medium text-white">Faster Execution</span>
                    </div>
                    <p className="text-[10px] text-forge-muted">Cached WASM bytecode</p>
                </div>
            </div>

            {/* Crate Version Info */}
            <div className="p-3 rounded-lg border border-forge-border/30 bg-forge-elevated/30">
                <div className="flex items-center justify-between">
                    <span className="text-xs text-white">Crate Version</span>
                    <span className="text-xs font-mono text-accent-cyan">0.1.0</span>
                </div>
                <p className="text-[10px] text-forge-muted mt-1">
                    Add to your Cargo.toml: <code className="text-accent-cyan">stylus_cache_sdk = "0.1.0"</code>
                </p>
            </div>

            {/* Auto Opt-in */}
            <div className="flex items-center justify-between p-3 rounded-lg border border-forge-border/30 bg-forge-elevated/50">
                <div>
                    <span className="text-xs text-white">Cache Awareness</span>
                    <p className="text-[10px] text-forge-muted">Track whether your contract is cacheable via is_cacheable()</p>
                </div>
                <Switch
                    checked={autoOptIn}
                    onCheckedChange={(checked) => updateConfig('autoOptIn', checked)}
                />
            </div>

            {/* Deployment Section */}
            {cachedCode && (
                <div className="space-y-3 p-3 rounded-lg border border-accent-cyan/30 bg-accent-cyan/5">
                    <div className="flex items-center gap-2">
                        <Rocket className="w-4 h-4 text-accent-cyan" />
                        <span className="text-xs font-medium text-white">Deploy Your Contract</span>
                    </div>

                    <p className="text-[10px] text-forge-muted">
                        After adding the caching code and <code className="text-accent-cyan">stylus_cache_sdk</code> crate,
                        deploy your contract using the command below. The contract will be automatically cached.
                    </p>

                    {/* Network Selector */}
                    <div>
                        <div className="flex items-center gap-1.5 mb-1.5">
                            <Globe className="w-3 h-3 text-forge-muted" />
                            <label className="text-xs text-forge-muted">Deployment Network</label>
                        </div>
                        <Select value={deployNetwork} onValueChange={(v) => updateConfig('deployNetwork', v)}>
                            <SelectTrigger className="h-8 text-xs">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="arbitrum-sepolia">Arbitrum Sepolia (Testnet)</SelectItem>
                                <SelectItem value="arbitrum">Arbitrum One (Mainnet)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Deploy Command */}
                    <div>
                        <label className="text-xs text-forge-muted mb-1.5 block">Deploy Command</label>
                        <CodeBlock code={deployCommand} language="bash" maxHeight="100px" />
                    </div>

                    <p className="text-[10px] text-amber-400">
                        ⚠️ Replace <code>&lt;YOUR_PRIVATE_KEY&gt;</code> with your actual private key
                    </p>
                </div>
            )}

            {/* Output Preview */}
            {cachedCode && (
                <div>
                    <div className="flex items-center gap-2 mb-1.5">
                        <ArrowRight className="w-3 h-3 text-accent-cyan" />
                        <label className="text-xs text-forge-muted">Contract with Caching Added</label>
                    </div>
                    <CodeBlock code={cachedCode} language="rust" maxHeight="300px" />
                </div>
            )}

            {/* What gets added info */}
            {!cachedCode && (
                <div className="p-3 rounded-lg border border-forge-border/30 bg-forge-elevated/30">
                    <p className="text-xs text-forge-muted mb-2">We'll automatically add:</p>
                    <ul className="text-[10px] text-forge-muted space-y-1">
                        <li>• <code className="text-accent-cyan">stylus_cache_sdk</code> import</li>
                        <li>• <code className="text-accent-cyan">is_cacheable()</code> function</li>
                    </ul>
                </div>
            )}

            {/* Documentation Link */}
            <a
                href="https://smartcache.gitbook.io/smartcache-docs/caching-strategies/rust-crate/installation"
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                    'flex items-center justify-between p-2.5 rounded-lg text-xs',
                    'border border-forge-border/30 bg-forge-elevated/50',
                    'hover:bg-forge-elevated hover:border-accent-cyan/30 transition-colors group'
                )}
            >
                <span className="text-white">SmartCache Documentation</span>
                <ExternalLink className="w-3.5 h-3.5 text-forge-muted group-hover:text-accent-cyan" />
            </a>
        </div>
    );
}
