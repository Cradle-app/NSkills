import type { Address } from 'viem';

/**
 * Supported Super Asset symbols
 */
export type SuperAssetSymbol = 'sUSDC' | 'sETH' | 'sWETH';

/**
 * Super Asset information
 */
export interface SuperAsset {
  symbol: SuperAssetSymbol;
  name: string;
  address: Address;
  underlyingAddress: Address;
  underlyingSymbol: string;
  decimals: number;
  apy: number;
  totalSupply: bigint;
  exchangeRate: bigint;
}

/**
 * User's Super Asset balance
 */
export interface SuperAssetBalance {
  asset: SuperAssetSymbol;
  balance: bigint;
  underlyingValue: bigint;
  pendingYield: bigint;
  totalYieldEarned: bigint;
}

/**
 * Yield tracking data
 */
export interface YieldData {
  asset: SuperAssetSymbol;
  currentApy: number;
  totalYieldEarned: bigint;
  pendingYield: bigint;
  lastClaimTimestamp: number;
}

/**
 * Wrap/unwrap operation status
 */
export type WrapStatus =
  | 'idle'
  | 'approving'
  | 'wrapping'
  | 'unwrapping'
  | 'completed'
  | 'error';
