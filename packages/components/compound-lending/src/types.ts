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

export type CompoundOperation =
  | 'supply'
  | 'withdraw'
  | 'borrow'
  | 'repay'
  | 'supply-to'
  | 'withdraw-to'
  | 'erc20-approve';

export interface CompoundTransactionRequest {
  /** Contract address to call */
  to: string;
  /** Encoded calldata */
  data: `0x${string}`;
  /** ETH value (usually 0 for Comet) */
  value?: string;
}

export interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}
