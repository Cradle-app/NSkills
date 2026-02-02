extern crate alloc;

// Modules and imports
mod erc721;

/// Import the Stylus SDK along with alloy primitive types for use in our program.
use stylus_sdk::{
    abi::Bytes,
    call::Call,
    contract,
    msg,
    prelude::*,
    alloy_primitives::{Address, U256},
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
    const NAME: &'static str = "Cradle Genesis Builder";
    const SYMBOL: &'static str = "CGB";
    const BASE_TOKEN_URI: &'static str = "";
}

/// Same metadata for all tokens (achievement badge). Set after uploading metadata.json to IPFS.
/// All 1000 mints point to this single metadata file.
const SINGLE_METADATA_URI: &str = "ipfs://bafkreia3ktnze2mjrwrt3qrdzgws7olmoc2norvoxssktv2wda2upuavta";

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
    /// Initialize the art contract address. Call once after deployment.
    /// The art contract's generateArt(token_id, owner) returns the metadata URI.
    /// For video NFTs, that metadata JSON must include "animation_url" (MP4/WEBM).
    pub fn initialize(&mut self, art_contract: Address) -> Result<(), Vec<u8>> {
        if !self.art_contract_address.get().is_zero() {
            return Err(SuperPositionNFTError::AlreadyInitialized(AlreadyInitialized {}).into());
        }
        self.art_contract_address.set(art_contract);
        Ok(())
    }

    /// Returns the metadata URI for a token. All tokens share the same metadata (achievement badge).
    /// Set SINGLE_METADATA_URI to your metadata's IPFS CID after uploading metadata.json to Pinata.
    pub fn token_uri(&self, token_id: U256) -> Result<String, Vec<u8>> {
        let _ = self.erc721.owner_of(token_id).map_err(|_| vec![])?; // validate exists
        if !SINGLE_METADATA_URI.is_empty() && !SINGLE_METADATA_URI.contains("REPLACE_WITH") {
            return Ok(SINGLE_METADATA_URI.to_string());
        }
        let base = SuperPositionNFTParams::BASE_TOKEN_URI;
        if base.is_empty() {
            return Ok(String::new());
        }
        let mut uri = base.to_string();
        if !uri.ends_with('/') {
            uri.push('/');
        }
        uri.push_str(&token_id.to_string());
        uri.push_str(".json");
        Ok(uri)
    }

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
}