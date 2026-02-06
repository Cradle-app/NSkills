export type SupportedUniswapChain = 'arbitrum' | 'arbitrum-sepolia' | 'ethereum-sepolia';

export type UniswapSwapType = 'exact-input';

export interface UniswapQuoteOptions {
  chain: SupportedUniswapChain;
  tokenIn: string;
  tokenOut: string;
  amountIn: string;
  /**
   * Uniswap V3 fee tier in hundredths of a bip, e.g.
   * 100 (0.01%), 500 (0.05%), 3000 (0.3%), 10000 (1%).
   * Defaults to 3000 if not provided.
   */
  fee?: number;
  /**
   * Optional override for RPC URL. When omitted, a public RPC
   * for the given chain will be used.
   */
  rpcUrl?: string;
}

export interface UniswapQuote {
  /** Raw quoted output amount (no slippage applied) */
  amountOut: string;
  /** Fee tier used for this quote */
  fee: number;
}

export interface UniswapBuildTxOptions {
  chain: SupportedUniswapChain;
  tokenIn: string;
  tokenOut: string;
  amountIn: string;
  /** Minimum acceptable output after slippage, in tokenOut units (wei) */
  minAmountOut: string;
  /** Recipient of the output tokens */
  recipient: string;
  /** Uniswap V3 fee tier; defaults to 3000 (0.3%) */
  fee?: number;
}

export interface UniswapTransactionRequest {
  /** Uniswap router address */
  to: string;
  /** Encoded calldata for the swap */
  data: `0x${string}`;
  /** ETH value (usually 0 for ERC20 -> ERC20 swaps) */
  value?: string;
}

