export type SupportedPythChain = 'arbitrum' | 'arbitrum-sepolia';

export interface PythPriceOptions {
  chain: SupportedPythChain;
  priceFeedId: string;
  staleAfterSeconds?: number;
}

export interface PythPriceRaw {
  id: string;
  price: string;
  conf: string;
  expo: number;
  publishTime: number;
}

export interface PythPriceResult {
  /** Formatted human-readable price (string) */
  formattedPrice: string;
  /** Raw Pyth price data */
  raw: PythPriceRaw;
  /** Whether the price is considered stale based on staleAfterSeconds */
  isStale: boolean;
}

export interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}

