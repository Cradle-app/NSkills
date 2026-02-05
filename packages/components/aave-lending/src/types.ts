export type SupportedAaveChain = 'arbitrum' | 'ethereum-sepolia' | 'arbitrum-sepolia';

export interface AaveLendingOptions {
  chain: SupportedAaveChain;
  /** Optional pool address override */
  poolAddress?: string;
  /** Optional pool data provider override */
  poolDataProviderAddress?: string;
  /** Optional RPC URL */
  rpcUrl?: string;
}

export interface AaveAccountDataOptions extends AaveLendingOptions {
  walletAddress: string;
}

export interface AaveAccountData {
  totalCollateralBase: string;
  totalDebtBase: string;
  availableBorrowsBase: string;
  currentLiquidationThreshold: string;
  ltv: string;
  healthFactor: string;
}

export interface AaveReserveData {
  asset: string;
  symbol: string;
  decimals: number;
  supplyAPY: string;
  variableBorrowAPY: string;
  availableLiquidity: string;
  ltv: string;
  liquidationThreshold: string;
  isActive: boolean;
}

export interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}
