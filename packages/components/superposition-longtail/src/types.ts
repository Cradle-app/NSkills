import type { Address } from 'viem';

/**
 * Longtail pool information
 */
export interface LongtailPool {
  address: Address;
  token0: Address;
  token1: Address;
  fee: number;
  liquidity: bigint;
  sqrtPriceX96: bigint;
  tick: number;
  token0Symbol: string;
  token1Symbol: string;
  tvlUsd: number;
  volume24h: number;
  apr: number;
}

/**
 * Swap quote
 */
export interface SwapQuote {
  tokenIn: Address;
  tokenOut: Address;
  amountIn: bigint;
  amountOut: bigint;
  priceImpact: number;
  route: SwapRoute[];
  estimatedGas: bigint;
}

/**
 * Swap route step
 */
export interface SwapRoute {
  pool: Address;
  tokenIn: Address;
  tokenOut: Address;
  fee: number;
}

/**
 * Liquidity position
 */
export interface LiquidityPosition {
  tokenId: bigint;
  owner: Address;
  pool: Address;
  token0: Address;
  token1: Address;
  tickLower: number;
  tickUpper: number;
  liquidity: bigint;
  tokensOwed0: bigint;
  tokensOwed1: bigint;
}

/**
 * Swap status
 */
export type SwapStatus =
  | 'idle'
  | 'fetching-quote'
  | 'approving'
  | 'swapping'
  | 'completed'
  | 'error';

/**
 * Token info
 */
export interface TokenInfo {
  address: Address;
  symbol: string;
  name: string;
  decimals: number;
  logoURI?: string;
}
