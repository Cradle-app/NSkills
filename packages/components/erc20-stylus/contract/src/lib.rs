//! # ERC-20 Stylus Token Contract
//!
//! A feature-rich ERC-20 token implementation for Arbitrum Stylus.
//!
//! ## Features
//! - **Ownable**: Owner-controlled contract management
//! - **Mintable**: Owner can mint new tokens
//! - **Burnable**: Token holders can burn their tokens
//! - **Pausable**: Owner can pause/unpause transfers
//!
//! ## Deployment
//! ```bash
//! # Install cargo-stylus
//! cargo install cargo-stylus
//!
//! # Build the contract
//! cargo stylus check
//!
//! # Deploy to Arbitrum Sepolia
//! cargo stylus deploy --private-key <YOUR_PRIVATE_KEY> --endpoint https://sepolia-rollup.arbitrum.io/rpc
//! ```

#![cfg_attr(not(feature = "export-abi"), no_main)]
extern crate alloc;

use alloc::string::String;
use alloc::vec::Vec;
use stylus_sdk::{
    alloy_primitives::{Address, U256},
    alloy_sol_types::sol,
    evm, msg,
    prelude::*,
};

// Solidity-style events and errors
sol! {
    // ERC-20 Events
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
    
    // Ownership Events
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    
    // Pausable Events
    event Paused(address account);
    event Unpaused(address account);
    
    // Errors
    error InsufficientBalance(address from, uint256 available, uint256 required);
    error InsufficientAllowance(address spender, uint256 available, uint256 required);
    error InvalidReceiver(address receiver);
    error InvalidSender(address sender);
    error UnauthorizedAccount(address account);
    error EnforcedPause();
    error ExpectedPause();
}

// Storage layout for the ERC-20 token
sol_storage! {
    #[entrypoint]
    pub struct ERC20Token {
        // Token metadata
        string name;
        string symbol;
        uint8 decimals;
        
        // Token state
        uint256 total_supply;
        mapping(address => uint256) balances;
        mapping(address => mapping(address => uint256)) allowances;
        
        // Ownable
        address owner;
        
        // Pausable
        bool paused;
        
        // Initialization flag
        bool initialized;
    }
}

/// ERC-20 Token Interface
#[public]
impl ERC20Token {
    // ============================================
    // Initialization
    // ============================================

    /// Initialize the token with name, symbol, decimals, and initial supply
    pub fn initialize(
        &mut self,
        name: String,
        symbol: String,
        decimals: u8,
        initial_supply: U256,
        owner: Address,
    ) -> Result<(), Vec<u8>> {
        if self.initialized.get() {
            return Err("Already initialized".into());
        }
        
        self.name.set_str(&name);
        self.symbol.set_str(&symbol);
        self.decimals.set(U256::from(decimals));
        self.owner.set(owner);
        self.paused.set(false);
        self.initialized.set(true);
        
        // Mint initial supply to owner
        if initial_supply > U256::ZERO {
            self.mint_internal(owner, initial_supply)?;
        }
        
        evm::log(OwnershipTransferred {
            previousOwner: Address::ZERO,
            newOwner: owner,
        });
        
        Ok(())
    }

    // ============================================
    // ERC-20 Standard Functions
    // ============================================

    /// Returns the name of the token
    pub fn name(&self) -> String {
        self.name.get_string()
    }

    /// Returns the symbol of the token
    pub fn symbol(&self) -> String {
        self.symbol.get_string()
    }

    /// Returns the number of decimals the token uses
    pub fn decimals(&self) -> u8 {
        self.decimals.get().try_into().unwrap_or(18)
    }

    /// Returns the total token supply
    pub fn total_supply(&self) -> U256 {
        self.total_supply.get()
    }

    /// Returns the balance of the specified address
    pub fn balance_of(&self, account: Address) -> U256 {
        self.balances.get(account)
    }

    /// Returns the remaining allowance for a spender
    pub fn allowance(&self, owner: Address, spender: Address) -> U256 {
        self.allowances.get(owner).get(spender)
    }

    /// Transfer tokens to a recipient
    pub fn transfer(&mut self, to: Address, value: U256) -> Result<bool, Vec<u8>> {
        self.require_not_paused()?;
        let from = msg::sender();
        self.transfer_internal(from, to, value)?;
        Ok(true)
    }

    /// Approve a spender to spend tokens on behalf of the caller
    pub fn approve(&mut self, spender: Address, value: U256) -> Result<bool, Vec<u8>> {
        let owner = msg::sender();
        self.approve_internal(owner, spender, value)?;
        Ok(true)
    }

    /// Transfer tokens from one address to another using allowance
    pub fn transfer_from(
        &mut self,
        from: Address,
        to: Address,
        value: U256,
    ) -> Result<bool, Vec<u8>> {
        self.require_not_paused()?;
        let spender = msg::sender();
        self.spend_allowance(from, spender, value)?;
        self.transfer_internal(from, to, value)?;
        Ok(true)
    }

    // ============================================
    // Extended Functions
    // ============================================

    /// Increase the allowance for a spender
    pub fn increase_allowance(&mut self, spender: Address, added_value: U256) -> Result<bool, Vec<u8>> {
        let owner = msg::sender();
        let current_allowance = self.allowances.get(owner).get(spender);
        self.approve_internal(owner, spender, current_allowance + added_value)?;
        Ok(true)
    }

    /// Decrease the allowance for a spender
    pub fn decrease_allowance(&mut self, spender: Address, subtracted_value: U256) -> Result<bool, Vec<u8>> {
        let owner = msg::sender();
        let current_allowance = self.allowances.get(owner).get(spender);
        if current_allowance < subtracted_value {
            return Err(InsufficientAllowance {
                spender,
                available: current_allowance,
                required: subtracted_value,
            }.encode().into());
        }
        self.approve_internal(owner, spender, current_allowance - subtracted_value)?;
        Ok(true)
    }

    // ============================================
    // Mintable Functions (Owner Only)
    // ============================================

    /// Mint new tokens to an address (owner only)
    pub fn mint(&mut self, to: Address, amount: U256) -> Result<(), Vec<u8>> {
        self.require_owner()?;
        self.mint_internal(to, amount)
    }

    // ============================================
    // Burnable Functions
    // ============================================

    /// Burn tokens from the caller's balance
    pub fn burn(&mut self, amount: U256) -> Result<(), Vec<u8>> {
        self.require_not_paused()?;
        let from = msg::sender();
        self.burn_internal(from, amount)
    }

    /// Burn tokens from an address using allowance
    pub fn burn_from(&mut self, from: Address, amount: U256) -> Result<(), Vec<u8>> {
        self.require_not_paused()?;
        let spender = msg::sender();
        self.spend_allowance(from, spender, amount)?;
        self.burn_internal(from, amount)
    }

    // ============================================
    // Pausable Functions (Owner Only)
    // ============================================

    /// Pause token transfers (owner only)
    pub fn pause(&mut self) -> Result<(), Vec<u8>> {
        self.require_owner()?;
        self.require_not_paused()?;
        self.paused.set(true);
        evm::log(Paused {
            account: msg::sender(),
        });
        Ok(())
    }

    /// Unpause token transfers (owner only)
    pub fn unpause(&mut self) -> Result<(), Vec<u8>> {
        self.require_owner()?;
        self.require_paused()?;
        self.paused.set(false);
        evm::log(Unpaused {
            account: msg::sender(),
        });
        Ok(())
    }

    /// Check if the contract is paused
    pub fn is_paused(&self) -> bool {
        self.paused.get()
    }

    // ============================================
    // Ownable Functions
    // ============================================

    /// Returns the current owner
    pub fn owner(&self) -> Address {
        self.owner.get()
    }

    /// Transfer ownership to a new address (owner only)
    pub fn transfer_ownership(&mut self, new_owner: Address) -> Result<(), Vec<u8>> {
        self.require_owner()?;
        if new_owner == Address::ZERO {
            return Err("New owner is zero address".into());
        }
        let old_owner = self.owner.get();
        self.owner.set(new_owner);
        evm::log(OwnershipTransferred {
            previousOwner: old_owner,
            newOwner: new_owner,
        });
        Ok(())
    }

    /// Renounce ownership (owner only)
    pub fn renounce_ownership(&mut self) -> Result<(), Vec<u8>> {
        self.require_owner()?;
        let old_owner = self.owner.get();
        self.owner.set(Address::ZERO);
        evm::log(OwnershipTransferred {
            previousOwner: old_owner,
            newOwner: Address::ZERO,
        });
        Ok(())
    }
}

// Internal functions
impl ERC20Token {
    fn require_owner(&self) -> Result<(), Vec<u8>> {
        if msg::sender() != self.owner.get() {
            return Err(UnauthorizedAccount {
                account: msg::sender(),
            }.encode().into());
        }
        Ok(())
    }

    fn require_not_paused(&self) -> Result<(), Vec<u8>> {
        if self.paused.get() {
            return Err(EnforcedPause {}.encode().into());
        }
        Ok(())
    }

    fn require_paused(&self) -> Result<(), Vec<u8>> {
        if !self.paused.get() {
            return Err(ExpectedPause {}.encode().into());
        }
        Ok(())
    }

    fn transfer_internal(&mut self, from: Address, to: Address, value: U256) -> Result<(), Vec<u8>> {
        if from == Address::ZERO {
            return Err(InvalidSender { sender: from }.encode().into());
        }
        if to == Address::ZERO {
            return Err(InvalidReceiver { receiver: to }.encode().into());
        }

        let from_balance = self.balances.get(from);
        if from_balance < value {
            return Err(InsufficientBalance {
                from,
                available: from_balance,
                required: value,
            }.encode().into());
        }

        self.balances.setter(from).set(from_balance - value);
        let to_balance = self.balances.get(to);
        self.balances.setter(to).set(to_balance + value);

        evm::log(Transfer { from, to, value });
        Ok(())
    }

    fn approve_internal(&mut self, owner: Address, spender: Address, value: U256) -> Result<(), Vec<u8>> {
        if owner == Address::ZERO {
            return Err(InvalidSender { sender: owner }.encode().into());
        }
        if spender == Address::ZERO {
            return Err(InvalidReceiver { receiver: spender }.encode().into());
        }

        self.allowances.setter(owner).setter(spender).set(value);
        evm::log(Approval { owner, spender, value });
        Ok(())
    }

    fn spend_allowance(&mut self, owner: Address, spender: Address, value: U256) -> Result<(), Vec<u8>> {
        let current_allowance = self.allowances.get(owner).get(spender);
        if current_allowance != U256::MAX {
            if current_allowance < value {
                return Err(InsufficientAllowance {
                    spender,
                    available: current_allowance,
                    required: value,
                }.encode().into());
            }
            self.allowances.setter(owner).setter(spender).set(current_allowance - value);
        }
        Ok(())
    }

    fn mint_internal(&mut self, to: Address, amount: U256) -> Result<(), Vec<u8>> {
        if to == Address::ZERO {
            return Err(InvalidReceiver { receiver: to }.encode().into());
        }

        let total_supply = self.total_supply.get();
        self.total_supply.set(total_supply + amount);
        
        let balance = self.balances.get(to);
        self.balances.setter(to).set(balance + amount);

        evm::log(Transfer {
            from: Address::ZERO,
            to,
            value: amount,
        });
        Ok(())
    }

    fn burn_internal(&mut self, from: Address, amount: U256) -> Result<(), Vec<u8>> {
        if from == Address::ZERO {
            return Err(InvalidSender { sender: from }.encode().into());
        }

        let balance = self.balances.get(from);
        if balance < amount {
            return Err(InsufficientBalance {
                from,
                available: balance,
                required: amount,
            }.encode().into());
        }

        self.balances.setter(from).set(balance - amount);
        let total_supply = self.total_supply.get();
        self.total_supply.set(total_supply - amount);

        evm::log(Transfer {
            from,
            to: Address::ZERO,
            value: amount,
        });
        Ok(())
    }
}
