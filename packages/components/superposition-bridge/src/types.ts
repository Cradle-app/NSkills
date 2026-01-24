import type { Address } from 'viem';

/**
 * Supported bridge tokens
 */
export type BridgeToken = 'ETH' | 'USDC' | 'USDT' | 'WETH' | 'ARB';

/**
 * Supported source chains for bridging
 */
export type SourceChain = 'arbitrum' | 'ethereum' | 'optimism' | 'base';

/**
 * Bridge quote information
 */
export interface BridgeQuote {
  fromChainId: number;
  toChainId: number;
  fromToken: Address;
  toToken: Address;
  fromAmount: bigint;
  toAmount: bigint;
  estimatedGas: bigint;
  bridgeFee: bigint;
  route: BridgeRoute;
}

/**
 * Bridge route details
 */
export interface BridgeRoute {
  provider: string;
  steps: BridgeStep[];
  estimatedTime: number; // seconds
}

/**
 * Individual step in a bridge route
 */
export interface BridgeStep {
  type: 'swap' | 'bridge' | 'approve';
  tool: string;
  fromChain: number;
  toChain: number;
  fromToken: Address;
  toToken: Address;
  fromAmount: string;
  toAmount: string;
}

/**
 * Bridge transaction record
 */
export interface BridgeTransaction {
  hash: string;
  status: 'pending' | 'completed' | 'failed';
  fromChain: number;
  toChain: number;
  amount: bigint;
  token: Address;
  timestamp: number;
}

/**
 * Bridge operation status
 */
export type BridgeStatus =
  | 'idle'
  | 'fetching-quote'
  | 'approving'
  | 'bridging'
  | 'waiting-confirmation'
  | 'completed'
  | 'error';
