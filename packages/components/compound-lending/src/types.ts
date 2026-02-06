export type SupportedCompoundChain = 'arbitrum';

export interface CompoundLendingOptions {
  chain: SupportedCompoundChain;
  cometAddress?: string;
  rpcUrl?: string;
}

export interface CompoundAccountDataOptions extends CompoundLendingOptions {
  walletAddress: string;
}

export interface CompoundAccountData {
  supplyBalance: string;
  borrowBalance: string;
  supplyAPY: string;
  borrowAPY: string;
  utilization: string;
}

export interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}
