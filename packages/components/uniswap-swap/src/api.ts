import {
  createPublicClient,
  encodeFunctionData,
  http,
  type Address,
} from 'viem';
import { arbitrum, arbitrumSepolia, sepolia } from 'viem/chains';
import type {
  SupportedUniswapChain,
  UniswapQuoteOptions,
  UniswapQuote,
  UniswapBuildTxOptions,
  UniswapTransactionRequest,
} from './types';
import { DEFAULT_FEE_TIER, UNISWAP_CONFIG } from './constants';

const UNISWAP_V3_ROUTER_ABI = [
  {
    inputs: [
      {
        components: [
          { name: 'tokenIn', type: 'address' },
          { name: 'tokenOut', type: 'address' },
          { name: 'fee', type: 'uint24' },
          { name: 'recipient', type: 'address' },
          { name: 'amountIn', type: 'uint256' },
          { name: 'amountOutMinimum', type: 'uint256' },
          { name: 'sqrtPriceLimitX96', type: 'uint160' },
        ],
        name: 'params',
        type: 'tuple',
      },
    ],
    name: 'exactInputSingle',
    outputs: [{ name: 'amountOut', type: 'uint256' }],
    stateMutability: 'payable',
    type: 'function',
  },
] as const;

const UNISWAP_V3_QUOTER_ABI = [
  {
    inputs: [
      {
        components: [
          { name: 'tokenIn', type: 'address' },
          { name: 'tokenOut', type: 'address' },
          { name: 'amountIn', type: 'uint256' },
          { name: 'fee', type: 'uint24' },
          { name: 'sqrtPriceLimitX96', type: 'uint160' },
        ],
        name: 'params',
        type: 'tuple',
      },
    ],
    name: 'quoteExactInputSingle',
    outputs: [
      { name: 'amountOut', type: 'uint256' },
      { name: 'sqrtPriceX96After', type: 'uint160' },
      { name: 'initializedTicksCrossed', type: 'uint32' },
      { name: 'gasEstimate', type: 'uint256' },
    ],
    stateMutability: 'nonpayable',
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

function getViemChain(chain: SupportedUniswapChain) {
  switch (chain) {
    case 'arbitrum':
      return arbitrum;
    case 'arbitrum-sepolia':
      return arbitrumSepolia;
    case 'ethereum-sepolia':
      return sepolia;
    default:
      return arbitrum;
  }
}

/**
 * Get an exact-input quote from Uniswap V3 Quoter for a given token pair.
 * This does not apply any slippage – callers should compute their own
 * minimum acceptable output.
 */
export async function getUniswapExactInputQuote(
  options: UniswapQuoteOptions
): Promise<UniswapQuote> {
  const { chain, tokenIn, tokenOut, amountIn, rpcUrl, fee } = options;

  if (!tokenIn || tokenIn.length !== 42 || !tokenIn.startsWith('0x')) {
    throw new Error('Invalid tokenIn address. Expected 0x + 40 hex chars.');
  }
  if (!tokenOut || tokenOut.length !== 42 || !tokenOut.startsWith('0x')) {
    throw new Error('Invalid tokenOut address. Expected 0x + 40 hex chars.');
  }
  if (!amountIn || BigInt(amountIn) <= 0n) {
    throw new Error('amountIn must be > 0.');
  }

  const cfg = UNISWAP_CONFIG[chain];
  const transport = rpcUrl ? http(rpcUrl) : http();
  const client = createPublicClient({
    chain: getViemChain(chain),
    transport,
  });

  const selectedFee = fee ?? DEFAULT_FEE_TIER;

  const result = await client.readContract({
    address: cfg.contracts.uniswapQuoter as Address,
    abi: UNISWAP_V3_QUOTER_ABI,
    functionName: 'quoteExactInputSingle',
    args: [
      {
        tokenIn: tokenIn as Address,
        tokenOut: tokenOut as Address,
        amountIn: BigInt(amountIn),
        fee: selectedFee,
        sqrtPriceLimitX96: 0n,
      },
    ],
  });

  const [amountOut] = result as readonly [bigint, bigint, bigint, bigint];

  return {
    amountOut: amountOut.toString(),
    fee: selectedFee,
  };
}

/**
 * Build calldata for Uniswap V3 `exactInputSingle`.
 * Caller is responsible for computing `minAmountOut` with desired slippage.
 */
export function buildUniswapExactInputTx(
  options: UniswapBuildTxOptions
): UniswapTransactionRequest {
  const { chain, tokenIn, tokenOut, amountIn, minAmountOut, recipient, fee } =
    options;

  if (!tokenIn || tokenIn.length !== 42 || !tokenIn.startsWith('0x')) {
    throw new Error('Invalid tokenIn address. Expected 0x + 40 hex chars.');
  }
  if (!tokenOut || tokenOut.length !== 42 || !tokenOut.startsWith('0x')) {
    throw new Error('Invalid tokenOut address. Expected 0x + 40 hex chars.');
  }
  if (!recipient || recipient.length !== 42 || !recipient.startsWith('0x')) {
    throw new Error('Invalid recipient address. Expected 0x + 40 hex chars.');
  }
  if (!amountIn || BigInt(amountIn) <= 0n) {
    throw new Error('amountIn must be > 0.');
  }
  if (!minAmountOut || BigInt(minAmountOut) <= 0n) {
    throw new Error('minAmountOut must be > 0.');
  }

  const cfg = UNISWAP_CONFIG[chain];
  const selectedFee = fee ?? DEFAULT_FEE_TIER;

  const data = encodeFunctionData({
    abi: UNISWAP_V3_ROUTER_ABI,
    functionName: 'exactInputSingle',
    args: [
      {
        tokenIn: tokenIn as Address,
        tokenOut: tokenOut as Address,
        fee: selectedFee,
        recipient: recipient as Address,
        amountIn: BigInt(amountIn),
        amountOutMinimum: BigInt(minAmountOut),
        sqrtPriceLimitX96: 0n,
      },
    ],
  });

  return {
    to: cfg.contracts.uniswapRouter,
    data,
    value: '0',
  };
}

/**
 * Build calldata for ERC20 `approve(spender, amount)` to grant allowance
 * to the Uniswap router (or any other spender).
 */
export function buildUniswapErc20ApproveTx(options: {
  tokenAddress: string;
  spender: string;
  amount: string;
}): UniswapTransactionRequest {
  const { tokenAddress, spender, amount } = options;

  if (!tokenAddress || tokenAddress.length !== 42 || !tokenAddress.startsWith('0x')) {
    throw new Error('Invalid token address. Expected 0x + 40 hex chars.');
  }
  if (!spender || spender.length !== 42 || !spender.startsWith('0x')) {
    throw new Error('Invalid spender address. Expected 0x + 40 hex chars.');
  }
  if (!amount || BigInt(amount) <= 0n) {
    throw new Error('approve amount must be > 0.');
  }

  const data = encodeFunctionData({
    abi: ERC20_ABI,
    functionName: 'approve',
    args: [spender as Address, BigInt(amount)],
  });

  return {
    to: tokenAddress,
    data,
    value: '0',
  };
}

