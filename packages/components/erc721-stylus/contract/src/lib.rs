//! # ERC-721 Stylus NFT Contract
//!
//! A feature-rich ERC-721 NFT implementation for Arbitrum Stylus.
//!
//! ## Features
//! - **Ownable**: Owner-controlled contract management
//! - **Mintable**: Owner can mint new NFTs
//! - **Burnable**: Token holders can burn their NFTs
//! - **Pausable**: Owner can pause/unpause transfers
//! - **Enumerable**: Track all tokens and owner tokens
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
    // ERC-721 Events
    event Transfer(address indexed from, address indexed to, uint256 indexed tokenId);
    event Approval(address indexed owner, address indexed approved, uint256 indexed tokenId);
    event ApprovalForAll(address indexed owner, address indexed operator, bool approved);
    
    // Ownership Events
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    
    // Pausable Events
    event Paused(address account);
    event Unpaused(address account);
    
    // Metadata Events
    event BaseURIUpdated(string oldBaseURI, string newBaseURI);
    
    // Errors
    error ERC721InvalidOwner(address owner);
    error ERC721NonexistentToken(uint256 tokenId);
    error ERC721IncorrectOwner(address sender, uint256 tokenId, address owner);
    error ERC721InvalidSender(address sender);
    error ERC721InvalidReceiver(address receiver);
    error ERC721InsufficientApproval(address operator, uint256 tokenId);
    error ERC721InvalidApprover(address approver);
    error ERC721InvalidOperator(address operator);
    error UnauthorizedAccount(address account);
    error EnforcedPause();
    error ExpectedPause();
    error MaxSupplyReached(uint256 maxSupply);
}

// Storage layout for the ERC-721 NFT
sol_storage! {
    #[entrypoint]
    pub struct ERC721Token {
        // Collection metadata
        string name;
        string symbol;
        string base_uri;
        
        // Token state
        uint256 total_supply;
        uint256 max_supply;  // 0 means unlimited
        uint256 next_token_id;
        
        // Token ownership
        mapping(uint256 => address) owners;
        mapping(address => uint256) balances;
        mapping(uint256 => address) token_approvals;
        mapping(address => mapping(address => bool)) operator_approvals;
        
        // Enumerable
        mapping(uint256 => uint256) all_tokens_index;
        mapping(address => mapping(uint256 => uint256)) owned_tokens;
        mapping(uint256 => uint256) owned_tokens_index;
        
        // Ownable
        address owner;
        
        // Pausable
        bool paused;
        
        // Initialization flag
        bool initialized;
    }
}

/// ERC-721 NFT Interface
#[public]
impl ERC721Token {
    // ============================================
    // Initialization
    // ============================================

    /// Initialize the NFT collection with name, symbol, base URI, and max supply
    pub fn initialize(
        &mut self,
        name: String,
        symbol: String,
        base_uri: String,
        max_supply: U256,
        owner: Address,
    ) -> Result<(), Vec<u8>> {
        if self.initialized.get() {
            return Err("Already initialized".into());
        }
        
        self.name.set_str(&name);
        self.symbol.set_str(&symbol);
        self.base_uri.set_str(&base_uri);
        self.max_supply.set(max_supply);
        self.owner.set(owner);
        self.paused.set(false);
        self.next_token_id.set(U256::from(1)); // Start token IDs at 1
        self.initialized.set(true);
        
        evm::log(OwnershipTransferred {
            previousOwner: Address::ZERO,
            newOwner: owner,
        });
        
        Ok(())
    }

    // ============================================
    // ERC-721 Standard Functions
    // ============================================

    /// Returns the name of the collection
    pub fn name(&self) -> String {
        self.name.get_string()
    }

    /// Returns the symbol of the collection
    pub fn symbol(&self) -> String {
        self.symbol.get_string()
    }

    /// Returns the base URI for token metadata
    pub fn base_uri(&self) -> String {
        self.base_uri.get_string()
    }

    /// Returns the token URI for a specific token
    pub fn token_uri(&self, token_id: U256) -> Result<String, Vec<u8>> {
        self.require_token_exists(token_id)?;
        let base = self.base_uri.get_string();
        Ok(format!("{}{}", base, token_id))
    }

    /// Returns the total supply of tokens
    pub fn total_supply(&self) -> U256 {
        self.total_supply.get()
    }

    /// Returns the maximum supply (0 = unlimited)
    pub fn max_supply(&self) -> U256 {
        self.max_supply.get()
    }

    /// Returns the balance of NFTs for an address
    pub fn balance_of(&self, owner: Address) -> Result<U256, Vec<u8>> {
        if owner == Address::ZERO {
            return Err(ERC721InvalidOwner { owner }.encode().into());
        }
        Ok(self.balances.get(owner))
    }

    /// Returns the owner of a specific token
    pub fn owner_of(&self, token_id: U256) -> Result<Address, Vec<u8>> {
        let owner = self.owners.get(token_id);
        if owner == Address::ZERO {
            return Err(ERC721NonexistentToken { tokenId: token_id }.encode().into());
        }
        Ok(owner)
    }

    /// Returns the approved address for a token
    pub fn get_approved(&self, token_id: U256) -> Result<Address, Vec<u8>> {
        self.require_token_exists(token_id)?;
        Ok(self.token_approvals.get(token_id))
    }

    /// Check if an operator is approved for all tokens of an owner
    pub fn is_approved_for_all(&self, owner: Address, operator: Address) -> bool {
        self.operator_approvals.get(owner).get(operator)
    }

    /// Approve an address to transfer a specific token
    pub fn approve(&mut self, to: Address, token_id: U256) -> Result<(), Vec<u8>> {
        let owner = self.owner_of(token_id)?;
        let caller = msg::sender();
        
        if to == owner {
            return Err("Cannot approve to current owner".into());
        }
        
        if caller != owner && !self.is_approved_for_all(owner, caller) {
            return Err(ERC721InvalidApprover { approver: caller }.encode().into());
        }
        
        self.token_approvals.setter(token_id).set(to);
        evm::log(Approval { owner, approved: to, tokenId: token_id });
        Ok(())
    }

    /// Set approval for all tokens for an operator
    pub fn set_approval_for_all(&mut self, operator: Address, approved: bool) -> Result<(), Vec<u8>> {
        let owner = msg::sender();
        if operator == Address::ZERO {
            return Err(ERC721InvalidOperator { operator }.encode().into());
        }
        if operator == owner {
            return Err("Cannot set approval for self".into());
        }
        
        self.operator_approvals.setter(owner).setter(operator).set(approved);
        evm::log(ApprovalForAll { owner, operator, approved });
        Ok(())
    }

    /// Transfer a token from one address to another
    pub fn transfer_from(
        &mut self,
        from: Address,
        to: Address,
        token_id: U256,
    ) -> Result<(), Vec<u8>> {
        self.require_not_paused()?;
        
        let caller = msg::sender();
        if !self.is_approved_or_owner(caller, token_id)? {
            return Err(ERC721InsufficientApproval { operator: caller, tokenId: token_id }.encode().into());
        }
        
        self.transfer_internal(from, to, token_id)
    }

    /// Safely transfer a token (checks if receiver can handle ERC721)
    pub fn safe_transfer_from(
        &mut self,
        from: Address,
        to: Address,
        token_id: U256,
    ) -> Result<(), Vec<u8>> {
        self.transfer_from(from, to, token_id)
        // Note: In a full implementation, this would check ERC721Receiver interface
    }

    /// Safely transfer with data
    pub fn safe_transfer_from_with_data(
        &mut self,
        from: Address,
        to: Address,
        token_id: U256,
        _data: Vec<u8>,
    ) -> Result<(), Vec<u8>> {
        self.safe_transfer_from(from, to, token_id)
    }

    // ============================================
    // Mintable Functions (Owner Only)
    // ============================================

    /// Mint a new NFT to an address (owner only)
    pub fn mint(&mut self, to: Address) -> Result<U256, Vec<u8>> {
        self.require_owner()?;
        self.require_not_paused()?;
        
        let max_supply = self.max_supply.get();
        let current_supply = self.total_supply.get();
        
        if max_supply > U256::ZERO && current_supply >= max_supply {
            return Err(MaxSupplyReached { maxSupply: max_supply }.encode().into());
        }
        
        let token_id = self.next_token_id.get();
        self.next_token_id.set(token_id + U256::from(1));
        
        self.mint_internal(to, token_id)?;
        Ok(token_id)
    }

    /// Mint multiple NFTs to an address (owner only)
    pub fn mint_batch(&mut self, to: Address, count: U256) -> Result<Vec<U256>, Vec<u8>> {
        self.require_owner()?;
        self.require_not_paused()?;
        
        let max_supply = self.max_supply.get();
        let current_supply = self.total_supply.get();
        
        if max_supply > U256::ZERO && current_supply + count > max_supply {
            return Err(MaxSupplyReached { maxSupply: max_supply }.encode().into());
        }
        
        let mut token_ids = Vec::new();
        let count_usize: usize = count.try_into().unwrap_or(0);
        
        for _ in 0..count_usize {
            let token_id = self.next_token_id.get();
            self.next_token_id.set(token_id + U256::from(1));
            self.mint_internal(to, token_id)?;
            token_ids.push(token_id);
        }
        
        Ok(token_ids)
    }

    // ============================================
    // Burnable Functions
    // ============================================

    /// Burn a token (caller must be owner or approved)
    pub fn burn(&mut self, token_id: U256) -> Result<(), Vec<u8>> {
        self.require_not_paused()?;
        
        let caller = msg::sender();
        if !self.is_approved_or_owner(caller, token_id)? {
            return Err(ERC721InsufficientApproval { operator: caller, tokenId: token_id }.encode().into());
        }
        
        self.burn_internal(token_id)
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

    /// Update the base URI (owner only)
    pub fn set_base_uri(&mut self, new_base_uri: String) -> Result<(), Vec<u8>> {
        self.require_owner()?;
        let old_base_uri = self.base_uri.get_string();
        self.base_uri.set_str(&new_base_uri);
        evm::log(BaseURIUpdated {
            oldBaseURI: old_base_uri,
            newBaseURI: new_base_uri,
        });
        Ok(())
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

    // ============================================
    // Enumerable Functions
    // ============================================

    /// Returns the token ID at a given index
    pub fn token_by_index(&self, index: U256) -> Result<U256, Vec<u8>> {
        if index >= self.total_supply.get() {
            return Err("Index out of bounds".into());
        }
        // For this implementation, we use sequential IDs
        Ok(index + U256::from(1))
    }

    /// Returns the token ID at a given index for an owner
    pub fn token_of_owner_by_index(&self, owner: Address, index: U256) -> Result<U256, Vec<u8>> {
        let balance = self.balances.get(owner);
        if index >= balance {
            return Err("Index out of bounds".into());
        }
        Ok(self.owned_tokens.get(owner).get(index))
    }

    // ============================================
    // ERC-165 Interface Detection
    // ============================================

    /// Check if the contract supports an interface
    pub fn supports_interface(&self, interface_id: [u8; 4]) -> bool {
        // ERC165: 0x01ffc9a7
        // ERC721: 0x80ac58cd
        // ERC721Metadata: 0x5b5e139f
        // ERC721Enumerable: 0x780e9d63
        matches!(
            interface_id,
            [0x01, 0xff, 0xc9, 0xa7] |  // ERC165
            [0x80, 0xac, 0x58, 0xcd] |  // ERC721
            [0x5b, 0x5e, 0x13, 0x9f] |  // ERC721Metadata
            [0x78, 0x0e, 0x9d, 0x63]    // ERC721Enumerable
        )
    }
}

// Internal functions
impl ERC721Token {
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

    fn require_token_exists(&self, token_id: U256) -> Result<(), Vec<u8>> {
        if self.owners.get(token_id) == Address::ZERO {
            return Err(ERC721NonexistentToken { tokenId: token_id }.encode().into());
        }
        Ok(())
    }

    fn is_approved_or_owner(&self, spender: Address, token_id: U256) -> Result<bool, Vec<u8>> {
        let owner = self.owner_of(token_id)?;
        Ok(
            spender == owner ||
            self.is_approved_for_all(owner, spender) ||
            self.token_approvals.get(token_id) == spender
        )
    }

    fn transfer_internal(&mut self, from: Address, to: Address, token_id: U256) -> Result<(), Vec<u8>> {
        let owner = self.owner_of(token_id)?;
        
        if owner != from {
            return Err(ERC721IncorrectOwner { sender: from, tokenId: token_id, owner }.encode().into());
        }
        
        if to == Address::ZERO {
            return Err(ERC721InvalidReceiver { receiver: to }.encode().into());
        }
        
        // Clear approvals
        self.token_approvals.setter(token_id).set(Address::ZERO);
        
        // Update balances
        let from_balance = self.balances.get(from);
        self.balances.setter(from).set(from_balance - U256::from(1));
        let to_balance = self.balances.get(to);
        self.balances.setter(to).set(to_balance + U256::from(1));
        
        // Update ownership
        self.owners.setter(token_id).set(to);
        
        // Update enumerable data
        self.remove_token_from_owner_enumeration(from, token_id);
        self.add_token_to_owner_enumeration(to, token_id);
        
        evm::log(Transfer { from, to, tokenId: token_id });
        Ok(())
    }

    fn mint_internal(&mut self, to: Address, token_id: U256) -> Result<(), Vec<u8>> {
        if to == Address::ZERO {
            return Err(ERC721InvalidReceiver { receiver: to }.encode().into());
        }
        
        // Update ownership
        self.owners.setter(token_id).set(to);
        
        // Update balances
        let to_balance = self.balances.get(to);
        self.balances.setter(to).set(to_balance + U256::from(1));
        
        // Update total supply
        let total_supply = self.total_supply.get();
        self.total_supply.set(total_supply + U256::from(1));
        
        // Update enumerable data
        self.add_token_to_owner_enumeration(to, token_id);
        
        evm::log(Transfer {
            from: Address::ZERO,
            to,
            tokenId: token_id,
        });
        Ok(())
    }

    fn burn_internal(&mut self, token_id: U256) -> Result<(), Vec<u8>> {
        let owner = self.owner_of(token_id)?;
        
        // Clear approvals
        self.token_approvals.setter(token_id).set(Address::ZERO);
        
        // Update balances
        let balance = self.balances.get(owner);
        self.balances.setter(owner).set(balance - U256::from(1));
        
        // Update total supply
        let total_supply = self.total_supply.get();
        self.total_supply.set(total_supply - U256::from(1));
        
        // Clear ownership
        self.owners.setter(token_id).set(Address::ZERO);
        
        // Update enumerable data
        self.remove_token_from_owner_enumeration(owner, token_id);
        
        evm::log(Transfer {
            from: owner,
            to: Address::ZERO,
            tokenId: token_id,
        });
        Ok(())
    }

    fn add_token_to_owner_enumeration(&mut self, owner: Address, token_id: U256) {
        let length = self.balances.get(owner);
        self.owned_tokens.setter(owner).setter(length - U256::from(1)).set(token_id);
        self.owned_tokens_index.setter(token_id).set(length - U256::from(1));
    }

    fn remove_token_from_owner_enumeration(&mut self, owner: Address, token_id: U256) {
        let last_index = self.balances.get(owner); // Balance already decremented
        let token_index = self.owned_tokens_index.get(token_id);
        
        if token_index != last_index {
            let last_token_id = self.owned_tokens.get(owner).get(last_index);
            self.owned_tokens.setter(owner).setter(token_index).set(last_token_id);
            self.owned_tokens_index.setter(last_token_id).set(token_index);
        }
        
        self.owned_tokens.setter(owner).setter(last_index).set(U256::ZERO);
        self.owned_tokens_index.setter(token_id).set(U256::ZERO);
    }
}
