import {
  createPublicClient,
  encodeFunctionData,
  http,
  type Address,
} from 'viem';
import { arbitrum } from 'viem/chains';
import type {
  CompoundAccountDataOptions,
  CompoundAccountData,
  CompoundLendingOptions,
  CompoundTransactionRequest,
} from './types';
import { COMPOUND_CONFIG } from './constants';

const COMPOUND_COMET_ABI = [
  {
    inputs: [
      { name: 'asset', type: 'address' },
      { name: 'amount', type: 'uint256' },
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
    ],
    name: 'withdraw',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'amount', type: 'uint256' }],
    name: 'borrow',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'amount', type: 'uint256' }],
    name: 'repay',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { name: 'dst', type: 'address' },
      { name: 'asset', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    name: 'supplyTo',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'asset', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    name: 'withdrawTo',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
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

function getViemChain(_chain: CompoundLendingOptions['chain']) {
  // Only arbitrum is currently supported
  return arbitrum;
}

/**
 * Build calldata for Compound V3 `supply(asset, amount)`.
 */
export function buildCompoundSupplyTx(options: {
  chain: CompoundLendingOptions['chain'];
  cometAddress?: string;
  assetAddress: string;
  amount: string;
}): CompoundTransactionRequest {
  const { chain, cometAddress, assetAddress, amount } = options;
  const cfg = COMPOUND_CONFIG[chain];
  const comet = (cometAddress ?? cfg.cometAddress) as Address;

  const data = encodeFunctionData({
    abi: COMPOUND_COMET_ABI,
    functionName: 'supply',
    args: [assetAddress as Address, BigInt(amount)],
  });

  return { to: comet, data, value: '0' };
}

/**
 * Build calldata for Compound V3 `withdraw(asset, amount)`.
 */
export function buildCompoundWithdrawTx(options: {
  chain: CompoundLendingOptions['chain'];
  cometAddress?: string;
  assetAddress: string;
  amount: string;
}): CompoundTransactionRequest {
  const { chain, cometAddress, assetAddress, amount } = options;
  const cfg = COMPOUND_CONFIG[chain];
  const comet = (cometAddress ?? cfg.cometAddress) as Address;

  const data = encodeFunctionData({
    abi: COMPOUND_COMET_ABI,
    functionName: 'withdraw',
    args: [assetAddress as Address, BigInt(amount)],
  });

  return { to: comet, data, value: '0' };
}

/**
 * Build calldata for Compound V3 `borrow(amount)`.
 * (Borrow base asset from Comet.)
 */
export function buildCompoundBorrowTx(options: {
  chain: CompoundLendingOptions['chain'];
  cometAddress?: string;
  amount: string;
}): CompoundTransactionRequest {
  const { chain, cometAddress, amount } = options;
  const cfg = COMPOUND_CONFIG[chain];
  const comet = (cometAddress ?? cfg.cometAddress) as Address;

  const data = encodeFunctionData({
    abi: COMPOUND_COMET_ABI,
    functionName: 'borrow',
    args: [BigInt(amount)],
  });

  return { to: comet, data, value: '0' };
}

/**
 * Build calldata for Compound V3 `repay(amount)`.
 * (Repay base asset to Comet.)
 */
export function buildCompoundRepayTx(options: {
  chain: CompoundLendingOptions['chain'];
  cometAddress?: string;
  amount: string;
}): CompoundTransactionRequest {
  const { chain, cometAddress, amount } = options;
  const cfg = COMPOUND_CONFIG[chain];
  const comet = (cometAddress ?? cfg.cometAddress) as Address;

  const data = encodeFunctionData({
    abi: COMPOUND_COMET_ABI,
    functionName: 'repay',
    args: [BigInt(amount)],
  });

  return { to: comet, data, value: '0' };
}

/**
 * Build calldata for Compound V3 `supplyTo(dst, asset, amount)`.
 */
export function buildCompoundSupplyToTx(options: {
  chain: CompoundLendingOptions['chain'];
  cometAddress?: string;
  dst: string;
  assetAddress: string;
  amount: string;
}): CompoundTransactionRequest {
  const { chain, cometAddress, dst, assetAddress, amount } = options;
  const cfg = COMPOUND_CONFIG[chain];
  const comet = (cometAddress ?? cfg.cometAddress) as Address;

  const data = encodeFunctionData({
    abi: COMPOUND_COMET_ABI,
    functionName: 'supplyTo',
    args: [dst as Address, assetAddress as Address, BigInt(amount)],
  });

  return { to: comet, data, value: '0' };
}

/**
 * Build calldata for Compound V3 `withdrawTo(to, asset, amount)`.
 */
export function buildCompoundWithdrawToTx(options: {
  chain: CompoundLendingOptions['chain'];
  cometAddress?: string;
  to: string;
  assetAddress: string;
  amount: string;
}): CompoundTransactionRequest {
  const { chain, cometAddress, to, assetAddress, amount } = options;
  const cfg = COMPOUND_CONFIG[chain];
  const comet = (cometAddress ?? cfg.cometAddress) as Address;

  const data = encodeFunctionData({
    abi: COMPOUND_COMET_ABI,
    functionName: 'withdrawTo',
    args: [to as Address, assetAddress as Address, BigInt(amount)],
  });

  return { to: comet, data, value: '0' };
}

/**
 * Build calldata for ERC20 `approve(spender, amount)`
 * to grant allowance to the Comet or other spender.
 */
export function buildCompoundErc20ApproveTx(options: {
  tokenAddress: string;
  spender: string;
  amount: string;
}): CompoundTransactionRequest {
  const { tokenAddress, spender, amount } = options;

  const data = encodeFunctionData({
    abi: ERC20_ABI,
    functionName: 'approve',
    args: [spender as Address, BigInt(amount)],
  });

  return { to: tokenAddress, data, value: '0' };
}
