import { createPublicClient, http, type Address } from 'viem';
import { arbitrum, arbitrumSepolia, sepolia } from 'viem/chains';
import type {
  AaveAccountDataOptions,
  AaveAccountData,
  AaveLendingOptions,
} from './types';
import { AAVE_CONFIG } from './constants';

const AAVE_POOL_ABI = [
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
] as const;

/**
 * Get Aave V3 user account data (collateral, debt, health factor).
 * Reference: https://github.com/try-flowforge/backend/blob/main/src/services/lending/providers/AaveProvider.ts
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
