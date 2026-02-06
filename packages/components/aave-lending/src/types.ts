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

export type AaveInterestRateMode = 'stable' | 'variable';

export type AaveOperation =
  | 'supply'
  | 'withdraw'
  | 'borrow'
  | 'repay'
  | 'enable-collateral'
  | 'disable-collateral'
  | 'erc20-approve';

export interface AaveTransactionRequest {
  /** Contract address the tx should be sent to */
  to: string;
  /** Encoded calldata */
  data: `0x${string}`;
  /** ETH value (usually 0 for Aave Pool calls) */
  value?: string;
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

export interface AaveUserReserveData {
  currentATokenBalance: string;
  currentStableDebt: string;
  currentVariableDebt: string;
  principalStableDebt: string;
  scaledVariableDebt: string;
  stableBorrowRate: string;
  liquidityRate: string;
  stableRateLastUpdated: string;
  usageAsCollateralEnabled: boolean;
}

export interface AaveReserveConfigurationData {
  decimals: string;
  ltv: string;
  liquidationThreshold: string;
  liquidationBonus: string;
  reserveFactor: string;
  usageAsCollateralEnabled: boolean;
  borrowingEnabled: boolean;
  stableBorrowRateEnabled: boolean;
  isActive: boolean;
  isFrozen: boolean;
}

export interface AaveDataProviderReserveData {
  availableLiquidity: string;
  totalStableDebt: string;
  totalVariableDebt: string;
  liquidityRate: string;
  variableBorrowRate: string;
  stableBorrowRate: string;
  averageStableBorrowRate: string;
  liquidityIndex: string;
  variableBorrowIndex: string;
  lastUpdateTimestamp: string;
}

export interface AaveReserveToken {
  symbol: string;
  tokenAddress: string;
}

export interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}
