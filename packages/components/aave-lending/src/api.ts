import {
  createPublicClient,
  encodeFunctionData,
  http,
  type Address,
} from 'viem';
import { arbitrum, arbitrumSepolia, sepolia } from 'viem/chains';
import type {
  AaveAccountDataOptions,
  AaveAccountData,
  AaveLendingOptions,
  AaveInterestRateMode,
  AaveTransactionRequest,
  AaveUserReserveData,
  AaveReserveConfigurationData,
  AaveDataProviderReserveData,
  AaveReserveToken,
} from './types';
import { AAVE_CONFIG } from './constants';

const AAVE_POOL_ABI = [
  {
    inputs: [
      { name: 'asset', type: 'address' },
      { name: 'amount', type: 'uint256' },
      { name: 'onBehalfOf', type: 'address' },
      { name: 'referralCode', type: 'uint16' },
    ],
    name: 'supply',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { name: 'asset', type: 'address' },
      { name: 'amount', type: 'uint256' },
      { name: 'to', type: 'address' },
    ],
    name: 'withdraw',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { name: 'asset', type: 'address' },
      { name: 'amount', type: 'uint256' },
      { name: 'interestRateMode', type: 'uint256' },
      { name: 'referralCode', type: 'uint16' },
      { name: 'onBehalfOf', type: 'address' },
    ],
    name: 'borrow',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { name: 'asset', type: 'address' },
      { name: 'amount', type: 'uint256' },
      { name: 'interestRateMode', type: 'uint256' },
      { name: 'onBehalfOf', type: 'address' },
    ],
    name: 'repay',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { name: 'asset', type: 'address' },
      { name: 'useAsCollateral', type: 'bool' },
    ],
    name: 'setUserUseReserveAsCollateral',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'user', type: 'address' }],
    name: 'getUserAccountData',
    outputs: [
      { name: 'totalCollateralBase', type: 'uint256' },
      { name: 'totalDebtBase', type: 'uint256' },
      { name: 'availableBorrowsBase', type: 'uint256' },
      { name: 'currentLiquidationThreshold', type: 'uint256' },
      { name: 'ltv', type: 'uint256' },
      { name: 'healthFactor', type: 'uint256' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'asset', type: 'address' }],
    name: 'getReserveData',
    outputs: [
      {
        name: '',
        type: 'tuple',
        components: [
          { name: 'configuration', type: 'uint256' },
          { name: 'liquidityIndex', type: 'uint128' },
          { name: 'currentLiquidityRate', type: 'uint128' },
          { name: 'variableBorrowIndex', type: 'uint128' },
          { name: 'currentVariableBorrowRate', type: 'uint128' },
          { name: 'currentStableBorrowRate', type: 'uint128' },
          { name: 'lastUpdateTimestamp', type: 'uint40' },
          { name: 'id', type: 'uint16' },
          { name: 'aTokenAddress', type: 'address' },
          { name: 'stableDebtTokenAddress', type: 'address' },
          { name: 'variableDebtTokenAddress', type: 'address' },
          { name: 'interestRateStrategyAddress', type: 'address' },
          { name: 'accruedToTreasury', type: 'uint128' },
          { name: 'unbacked', type: 'uint128' },
          { name: 'isolationModeTotalDebt', type: 'uint128' },
        ],
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

const AAVE_DATA_PROVIDER_ABI = [
  {
    inputs: [
      { name: 'asset', type: 'address' },
      { name: 'user', type: 'address' },
    ],
    name: 'getUserReserveData',
    outputs: [
      { name: 'currentATokenBalance', type: 'uint256' },
      { name: 'currentStableDebt', type: 'uint256' },
      { name: 'currentVariableDebt', type: 'uint256' },
      { name: 'principalStableDebt', type: 'uint256' },
      { name: 'scaledVariableDebt', type: 'uint256' },
      { name: 'stableBorrowRate', type: 'uint256' },
      { name: 'liquidityRate', type: 'uint256' },
      { name: 'stableRateLastUpdated', type: 'uint40' },
      { name: 'usageAsCollateralEnabled', type: 'bool' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'asset', type: 'address' }],
    name: 'getReserveConfigurationData',
    outputs: [
      { name: 'decimals', type: 'uint256' },
      { name: 'ltv', type: 'uint256' },
      { name: 'liquidationThreshold', type: 'uint256' },
      { name: 'liquidationBonus', type: 'uint256' },
      { name: 'reserveFactor', type: 'uint256' },
      { name: 'usageAsCollateralEnabled', type: 'bool' },
      { name: 'borrowingEnabled', type: 'bool' },
      { name: 'stableBorrowRateEnabled', type: 'bool' },
      { name: 'isActive', type: 'bool' },
      { name: 'isFrozen', type: 'bool' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'asset', type: 'address' }],
    name: 'getReserveData',
    outputs: [
      { name: 'availableLiquidity', type: 'uint256' },
      { name: 'totalStableDebt', type: 'uint256' },
      { name: 'totalVariableDebt', type: 'uint256' },
      { name: 'liquidityRate', type: 'uint256' },
      { name: 'variableBorrowRate', type: 'uint256' },
      { name: 'stableBorrowRate', type: 'uint256' },
      { name: 'averageStableBorrowRate', type: 'uint256' },
      { name: 'liquidityIndex', type: 'uint256' },
      { name: 'variableBorrowIndex', type: 'uint256' },
      { name: 'lastUpdateTimestamp', type: 'uint40' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'getAllReservesTokens',
    outputs: [
      {
        name: '',
        type: 'tuple[]',
        components: [
          { name: 'symbol', type: 'string' },
          { name: 'tokenAddress', type: 'address' },
        ],
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

const ERC20_ABI = [
  {
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    name: 'approve',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
] as const;

/**
 * Get Aave V3 user account data (collateral, debt, health factor).
 */
export async function getAaveAccountData(
  options: AaveAccountDataOptions
): Promise<AaveAccountData> {
  const { chain, walletAddress, poolAddress, poolDataProviderAddress, rpcUrl } =
    options;

  if (!walletAddress.startsWith('0x') || walletAddress.length !== 42) {
    throw new Error('Invalid wallet address. Expected 0x + 40 hex chars.');
  }

  const config = AAVE_CONFIG[chain];
  const pool = poolAddress ?? config.poolAddress;

  const viemChain =
    chain === 'ethereum-sepolia'
      ? sepolia
      : chain === 'arbitrum-sepolia'
        ? arbitrumSepolia
        : arbitrum;
  const transport = rpcUrl ? http(rpcUrl) : http();

  const client = createPublicClient({
    chain: viemChain,
    transport,
  });

  const result = await client.readContract({
    address: pool as Address,
    abi: AAVE_POOL_ABI,
    functionName: 'getUserAccountData',
    args: [walletAddress as Address],
  });

  const [
    totalCollateralBase,
    totalDebtBase,
    availableBorrowsBase,
    currentLiquidationThreshold,
    ltv,
    healthFactor,
  ] = result;

  // Aave returns health factor in 18 decimals; format for display
  const formatBase = (val: bigint) => val.toString();
  const formatRate = (val: bigint) => {
    const n = Number(val) / 1e18;
    return n.toFixed(2);
  };

  return {
    totalCollateralBase: formatBase(totalCollateralBase),
    totalDebtBase: formatBase(totalDebtBase),
    availableBorrowsBase: formatBase(availableBorrowsBase),
    currentLiquidationThreshold: formatRate(currentLiquidationThreshold),
    ltv: formatRate(ltv),
    healthFactor: formatRate(healthFactor),
  };
}

export { AAVE_CONFIG } from './constants';

function getViemChain(chain: AaveLendingOptions['chain']) {
  return chain === 'ethereum-sepolia'
    ? sepolia
    : chain === 'arbitrum-sepolia'
      ? arbitrumSepolia
      : arbitrum;
}

function interestRateModeToValue(mode: AaveInterestRateMode): 1n | 2n {
  return mode === 'stable' ? 1n : 2n;
}

/**
 * Read Aave PoolDataProvider: getUserReserveData(asset, user).
 */
export async function getAaveUserReserveData(options: {
  chain: AaveLendingOptions['chain'];
  walletAddress: string;
  assetAddress: string;
  poolDataProviderAddress?: string;
  rpcUrl?: string;
}): Promise<AaveUserReserveData> {
  const { chain, walletAddress, assetAddress, poolDataProviderAddress, rpcUrl } =
    options;

  const cfg = AAVE_CONFIG[chain];
  const provider = poolDataProviderAddress ?? cfg.poolDataProviderAddress;

  const transport = rpcUrl ? http(rpcUrl) : http();
  const client = createPublicClient({ chain: getViemChain(chain), transport });

  const result = await client.readContract({
    address: provider as Address,
    abi: AAVE_DATA_PROVIDER_ABI,
    functionName: 'getUserReserveData',
    args: [assetAddress as Address, walletAddress as Address],
  });

  const [
    currentATokenBalance,
    currentStableDebt,
    currentVariableDebt,
    principalStableDebt,
    scaledVariableDebt,
    stableBorrowRate,
    liquidityRate,
    stableRateLastUpdated,
    usageAsCollateralEnabled,
  ] = result;

  return {
    currentATokenBalance: currentATokenBalance.toString(),
    currentStableDebt: currentStableDebt.toString(),
    currentVariableDebt: currentVariableDebt.toString(),
    principalStableDebt: principalStableDebt.toString(),
    scaledVariableDebt: scaledVariableDebt.toString(),
    stableBorrowRate: stableBorrowRate.toString(),
    liquidityRate: liquidityRate.toString(),
    stableRateLastUpdated: stableRateLastUpdated.toString(),
    usageAsCollateralEnabled,
  };
}

/**
 * Read Aave PoolDataProvider: getReserveConfigurationData(asset).
 */
export async function getAaveReserveConfigurationData(options: {
  chain: AaveLendingOptions['chain'];
  assetAddress: string;
  poolDataProviderAddress?: string;
  rpcUrl?: string;
}): Promise<AaveReserveConfigurationData> {
  const { chain, assetAddress, poolDataProviderAddress, rpcUrl } = options;

  const cfg = AAVE_CONFIG[chain];
  const provider = poolDataProviderAddress ?? cfg.poolDataProviderAddress;

  const transport = rpcUrl ? http(rpcUrl) : http();
  const client = createPublicClient({ chain: getViemChain(chain), transport });

  const result = await client.readContract({
    address: provider as Address,
    abi: AAVE_DATA_PROVIDER_ABI,
    functionName: 'getReserveConfigurationData',
    args: [assetAddress as Address],
  });

  const [
    decimals,
    ltv,
    liquidationThreshold,
    liquidationBonus,
    reserveFactor,
    usageAsCollateralEnabled,
    borrowingEnabled,
    stableBorrowRateEnabled,
    isActive,
    isFrozen,
  ] = result;

  return {
    decimals: decimals.toString(),
    ltv: ltv.toString(),
    liquidationThreshold: liquidationThreshold.toString(),
    liquidationBonus: liquidationBonus.toString(),
    reserveFactor: reserveFactor.toString(),
    usageAsCollateralEnabled,
    borrowingEnabled,
    stableBorrowRateEnabled,
    isActive,
    isFrozen,
  };
}

/**
 * Read Aave PoolDataProvider: getReserveData(asset).
 */
export async function getAaveDataProviderReserveData(options: {
  chain: AaveLendingOptions['chain'];
  assetAddress: string;
  poolDataProviderAddress?: string;
  rpcUrl?: string;
}): Promise<AaveDataProviderReserveData> {
  const { chain, assetAddress, poolDataProviderAddress, rpcUrl } = options;

  const cfg = AAVE_CONFIG[chain];
  const provider = poolDataProviderAddress ?? cfg.poolDataProviderAddress;

  const transport = rpcUrl ? http(rpcUrl) : http();
  const client = createPublicClient({ chain: getViemChain(chain), transport });

  const result = await client.readContract({
    address: provider as Address,
    abi: AAVE_DATA_PROVIDER_ABI,
    functionName: 'getReserveData',
    args: [assetAddress as Address],
  });

  const [
    availableLiquidity,
    totalStableDebt,
    totalVariableDebt,
    liquidityRate,
    variableBorrowRate,
    stableBorrowRate,
    averageStableBorrowRate,
    liquidityIndex,
    variableBorrowIndex,
    lastUpdateTimestamp,
  ] = result;

  return {
    availableLiquidity: availableLiquidity.toString(),
    totalStableDebt: totalStableDebt.toString(),
    totalVariableDebt: totalVariableDebt.toString(),
    liquidityRate: liquidityRate.toString(),
    variableBorrowRate: variableBorrowRate.toString(),
    stableBorrowRate: stableBorrowRate.toString(),
    averageStableBorrowRate: averageStableBorrowRate.toString(),
    liquidityIndex: liquidityIndex.toString(),
    variableBorrowIndex: variableBorrowIndex.toString(),
    lastUpdateTimestamp: lastUpdateTimestamp.toString(),
  };
}

/**
 * Read Aave PoolDataProvider: getAllReservesTokens().
 */
export async function getAaveAllReservesTokens(options: {
  chain: AaveLendingOptions['chain'];
  poolDataProviderAddress?: string;
  rpcUrl?: string;
}): Promise<AaveReserveToken[]> {
  const { chain, poolDataProviderAddress, rpcUrl } = options;

  const cfg = AAVE_CONFIG[chain];
  const provider = poolDataProviderAddress ?? cfg.poolDataProviderAddress;

  const transport = rpcUrl ? http(rpcUrl) : http();
  const client = createPublicClient({ chain: getViemChain(chain), transport });

  const result = await client.readContract({
    address: provider as Address,
    abi: AAVE_DATA_PROVIDER_ABI,
    functionName: 'getAllReservesTokens',
  });

  return result.map((r) => ({
    symbol: r.symbol,
    tokenAddress: r.tokenAddress,
  }));
}

/**
 * Build calldata for Aave Pool `supply`.
 */
export function buildAaveSupplyTx(options: {
  chain: AaveLendingOptions['chain'];
  assetAddress: string;
  amount: string;
  onBehalfOf: string;
  referralCode?: number;
  poolAddress?: string;
}): AaveTransactionRequest {
  const { chain, assetAddress, amount, onBehalfOf, referralCode, poolAddress } =
    options;
  const cfg = AAVE_CONFIG[chain];
  const pool = poolAddress ?? cfg.poolAddress;

  const data = encodeFunctionData({
    abi: AAVE_POOL_ABI,
    functionName: 'supply',
    args: [
      assetAddress as Address,
      BigInt(amount),
      onBehalfOf as Address,
      referralCode ?? 0,
    ],
  });

  return { to: pool, data, value: '0' };
}

/**
 * Build calldata for Aave Pool `withdraw`.
 */
export function buildAaveWithdrawTx(options: {
  chain: AaveLendingOptions['chain'];
  assetAddress: string;
  amount: string;
  to: string;
  poolAddress?: string;
}): AaveTransactionRequest {
  const { chain, assetAddress, amount, to, poolAddress } = options;
  const cfg = AAVE_CONFIG[chain];
  const pool = poolAddress ?? cfg.poolAddress;

  const data = encodeFunctionData({
    abi: AAVE_POOL_ABI,
    functionName: 'withdraw',
    args: [assetAddress as Address, BigInt(amount), to as Address],
  });

  return { to: pool, data, value: '0' };
}

/**
 * Build calldata for Aave Pool `borrow`.
 */
export function buildAaveBorrowTx(options: {
  chain: AaveLendingOptions['chain'];
  assetAddress: string;
  amount: string;
  interestRateMode: AaveInterestRateMode;
  onBehalfOf: string;
  referralCode?: number;
  poolAddress?: string;
}): AaveTransactionRequest {
  const {
    chain,
    assetAddress,
    amount,
    interestRateMode,
    onBehalfOf,
    referralCode,
    poolAddress,
  } = options;
  const cfg = AAVE_CONFIG[chain];
  const pool = poolAddress ?? cfg.poolAddress;

  const data = encodeFunctionData({
    abi: AAVE_POOL_ABI,
    functionName: 'borrow',
    args: [
      assetAddress as Address,
      BigInt(amount),
      interestRateModeToValue(interestRateMode),
      referralCode ?? 0,
      onBehalfOf as Address,
    ],
  });

  return { to: pool, data, value: '0' };
}

/**
 * Build calldata for Aave Pool `repay`.
 */
export function buildAaveRepayTx(options: {
  chain: AaveLendingOptions['chain'];
  assetAddress: string;
  amount: string;
  interestRateMode: AaveInterestRateMode;
  onBehalfOf: string;
  poolAddress?: string;
}): AaveTransactionRequest {
  const { chain, assetAddress, amount, interestRateMode, onBehalfOf, poolAddress } =
    options;
  const cfg = AAVE_CONFIG[chain];
  const pool = poolAddress ?? cfg.poolAddress;

  const data = encodeFunctionData({
    abi: AAVE_POOL_ABI,
    functionName: 'repay',
    args: [
      assetAddress as Address,
      BigInt(amount),
      interestRateModeToValue(interestRateMode),
      onBehalfOf as Address,
    ],
  });

  return { to: pool, data, value: '0' };
}

/**
 * Build calldata for Aave Pool `setUserUseReserveAsCollateral`.
 */
export function buildAaveSetCollateralTx(options: {
  chain: AaveLendingOptions['chain'];
  assetAddress: string;
  useAsCollateral: boolean;
  poolAddress?: string;
}): AaveTransactionRequest {
  const { chain, assetAddress, useAsCollateral, poolAddress } = options;
  const cfg = AAVE_CONFIG[chain];
  const pool = poolAddress ?? cfg.poolAddress;

  const data = encodeFunctionData({
    abi: AAVE_POOL_ABI,
    functionName: 'setUserUseReserveAsCollateral',
    args: [assetAddress as Address, useAsCollateral],
  });

  return { to: pool, data, value: '0' };
}

/**
 * Build calldata for ERC20 `approve(spender, amount)`.
 * (Useful before `supply` / `repay` when the Pool needs allowance.)
 */
export function buildErc20ApproveTx(options: {
  tokenAddress: string;
  spender: string;
  amount: string;
}): AaveTransactionRequest {
  const { tokenAddress, spender, amount } = options;

  const data = encodeFunctionData({
    abi: ERC20_ABI,
    functionName: 'approve',
    args: [spender as Address, BigInt(amount)],
  });

  return { to: tokenAddress, data, value: '0' };
}
