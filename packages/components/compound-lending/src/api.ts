import { createPublicClient, http, type Address } from 'viem';
import { arbitrum } from 'viem/chains';
import type {
  CompoundAccountDataOptions,
  CompoundAccountData,
} from './types';
import { COMPOUND_CONFIG } from './constants';

const COMPOUND_COMET_ABI = [
  {
    inputs: [{ name: 'account', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'account', type: 'address' }],
    name: 'borrowBalanceOf',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'getUtilization',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'utilization', type: 'uint256' }],
    name: 'getSupplyRate',
    outputs: [{ name: '', type: 'uint64' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'utilization', type: 'uint256' }],
    name: 'getBorrowRate',
    outputs: [{ name: '', type: 'uint64' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

/**
 * Convert Compound rate (per-second) to APY percentage.
 */
function rateToAPY(rate: string): string {
  const SECONDS_PER_YEAR = 31536000;
  const ratePerSecond = Number(rate) / 1e18;
  const apy = (Math.pow(1 + ratePerSecond, SECONDS_PER_YEAR) - 1) * 100;
  return apy.toFixed(2);
}

/**
 * Get Compound V3 Comet account data (supply balance, borrow balance, rates).
 * Reference: https://github.com/try-flowforge/backend/blob/main/src/services/lending/providers/CompoundProvider.ts
 */
export async function getCompoundAccountData(
  options: CompoundAccountDataOptions
): Promise<CompoundAccountData> {
  const { chain, walletAddress, cometAddress, rpcUrl } = options;

  if (!walletAddress.startsWith('0x') || walletAddress.length !== 42) {
    throw new Error('Invalid wallet address. Expected 0x + 40 hex chars.');
  }

  const config = COMPOUND_CONFIG[chain];
  const comet = cometAddress ?? config.cometAddress;

  const transport = rpcUrl ? http(rpcUrl) : http();
  const client = createPublicClient({
    chain: arbitrum,
    transport,
  });

  const [supplyBalance, borrowBalance, utilization] = await Promise.all([
    client.readContract({
      address: comet as Address,
      abi: COMPOUND_COMET_ABI,
      functionName: 'balanceOf',
      args: [walletAddress as Address],
    }),
    client.readContract({
      address: comet as Address,
      abi: COMPOUND_COMET_ABI,
      functionName: 'borrowBalanceOf',
      args: [walletAddress as Address],
    }),
    client.readContract({
      address: comet as Address,
      abi: COMPOUND_COMET_ABI,
      functionName: 'getUtilization',
    }),
  ]);

  const [supplyRate, borrowRate] = await Promise.all([
    client.readContract({
      address: comet as Address,
      abi: COMPOUND_COMET_ABI,
      functionName: 'getSupplyRate',
      args: [utilization],
    }),
    client.readContract({
      address: comet as Address,
      abi: COMPOUND_COMET_ABI,
      functionName: 'getBorrowRate',
      args: [utilization],
    }),
  ]);

  const utilizationPct = (Number(utilization) / 1e18 * 100).toFixed(2);

  return {
    supplyBalance: supplyBalance.toString(),
    borrowBalance: borrowBalance.toString(),
    supplyAPY: rateToAPY(String(supplyRate)),
    borrowAPY: rateToAPY(String(borrowRate)),
    utilization: utilizationPct,
  };
}

export { COMPOUND_CONFIG } from './constants';
