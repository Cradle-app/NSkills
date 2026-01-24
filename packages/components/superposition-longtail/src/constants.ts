import type { Address } from 'viem';

/**
 * Superposition chain ID
 */
export const SUPERPOSITION_CHAIN_ID = 55244;

/**
 * Longtail contract addresses (verified from docs.long.so)
 * Source: https://docs.long.so/
 */
export const LONGTAIL_CONTRACTS = {
  /** Main Longtail AMM contract */
  AMM: '0xF3334049A3ce7e890bd4f8C6a0FBC70e38fd3746' as Address,
  /** NFT Position Manager */
  NFT_MANAGER: '0xdD193817F66276d1EAd064dF8F3112b553A50d10' as Address,
  /** Position Handler */
  POSITION_HANDLER: '0x1aC593E976bD676Aa9609677AB41d52436e40260' as Address,
  /** Permit2 Router for gas-optimized swaps */
  PERMIT2_ROUTER: '0x244517Dc59943E8CdFbD424Bdb3262c5f04a1387' as Address,
  /** Leo Protocol proxy */
  LEO_PROXY: '0xC5a5bB74e41A01927d29dbffA8Ab796c784bCBA8' as Address,
} as const;

/**
 * Common tokens on Superposition (verified from docs.long.so)
 * Source: https://docs.long.so/
 */
export const COMMON_TOKENS = {
  /** Native ETH - use zero address for swaps */
  ETH: '0x0000000000000000000000000000000000000000' as Address,
  /** Wrapped ETH */
  WETH: '0x1fB719f10b56d7a85DCD32f27f897375fB21cfdd' as Address,
  /** USDC (fUSDC - base asset for Longtail pools) */
  USDC: '0x6c030c5CC283F791B26816f325b9C632d964F8A1' as Address,
  /** ARB token */
  ARB: '0xA2555701754464d32D9624149E3fDb459F3c8DE4' as Address,
  /** FLY governance token */
  FLY: '0x80eFAD50D395671C13C4b1FA2969f7a7Aa9EF7b3' as Address,
  // Super Assets - TODO: wrapping contract addresses not publicly documented
  // See: https://docs.superposition.so/superposition-mainnet/super-layer/super-assets
  sUSDC: '0x0000000000000000000000000000000000000000' as Address,
  sETH: '0x0000000000000000000000000000000000000000' as Address,
} as const;

/**
 * Fee tiers (in hundredths of a bip)
 */
export const FEE_TIERS = {
  LOWEST: 100, // 0.01%
  LOW: 500, // 0.05%
  MEDIUM: 3000, // 0.3%
  HIGH: 10000, // 1%
} as const;

/**
 * Default slippage tolerance (%)
 */
export const DEFAULT_SLIPPAGE = 0.5;

/**
 * Longtail app URL
 */
export const LONGTAIL_APP_URL = 'https://long.so';

/**
 * Explorer URL
 */
export const EXPLORER_URL = 'https://explorer.superposition.so';
