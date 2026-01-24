import type { Address } from 'viem';
import type { SourceChain, BridgeToken } from './types';

/**
 * Superposition chain ID (mainnet)
 */
export const SUPERPOSITION_CHAIN_ID = 55244;

/**
 * Superposition testnet chain ID
 */
export const SUPERPOSITION_TESTNET_CHAIN_ID = 98985;

/**
 * Source chain IDs
 */
export const CHAIN_IDS: Record<SourceChain, number> = {
  arbitrum: 42161,
  ethereum: 1,
  optimism: 10,
  base: 8453,
};

/**
 * Chain names for display
 */
export const CHAIN_NAMES: Record<SourceChain, string> = {
  arbitrum: 'Arbitrum',
  ethereum: 'Ethereum',
  optimism: 'Optimism',
  base: 'Base',
};

/**
 * Token addresses per chain
 * Note: Update with actual addresses
 */
export const TOKEN_ADDRESSES: Record<SourceChain, Partial<Record<BridgeToken, Address>>> = {
  arbitrum: {
    ETH: '0x0000000000000000000000000000000000000000',
    USDC: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
    USDT: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9',
    WETH: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1',
    ARB: '0x912CE59144191C1204E64559FE8253a0e49E6548',
  },
  ethereum: {
    ETH: '0x0000000000000000000000000000000000000000',
    USDC: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    USDT: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
    WETH: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
  },
  optimism: {
    ETH: '0x0000000000000000000000000000000000000000',
    USDC: '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85',
    WETH: '0x4200000000000000000000000000000000000006',
  },
  base: {
    ETH: '0x0000000000000000000000000000000000000000',
    USDC: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
    WETH: '0x4200000000000000000000000000000000000006',
  },
};

/**
 * Default slippage tolerance (%)
 */
export const DEFAULT_SLIPPAGE = 0.5;

/**
 * Bridge URLs
 */
export const BRIDGE_URLS = {
  mainnet: 'https://bridge.superposition.so',
  testnet: 'https://bridge.superposition.so',
};

/**
 * Explorer URLs
 */
export const EXPLORER_URLS = {
  superposition: 'https://explorer.superposition.so',
  superpositionTestnet: 'https://testnet-explorer.superposition.so',
};
