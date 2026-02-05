export type SupportedChainlinkChain = 'arbitrum' | 'arbitrum-sepolia';

export interface ChainlinkPriceOptions {
  chain: SupportedChainlinkChain;
  /** AggregatorV3Interface contract address */
  feedAddress: string;
  /** Optional: reject price older than this many seconds */
  staleAfterSeconds?: number;
  /** Optional: custom RPC URL (defaults to public RPC for chain) */
  rpcUrl?: string;
}

export interface ChainlinkPriceRaw {
  roundId: bigint;
  answer: bigint;
  startedAt: number;
  updatedAt: number;
  answeredInRound: bigint;
  decimals: number;
}

export interface ChainlinkPriceResult {
  formattedPrice: string;
  raw: ChainlinkPriceRaw;
  isStale: boolean;
}

export interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}
