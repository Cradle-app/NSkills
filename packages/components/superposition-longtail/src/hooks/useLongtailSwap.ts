'use client';

import { useState, useCallback } from 'react';
import { useAccount, usePublicClient, useWalletClient } from 'wagmi';
import type { Address } from 'viem';
import type { SwapQuote, SwapStatus } from '../types';
import { LONGTAIL_CONTRACTS, DEFAULT_SLIPPAGE } from '../constants';
import { LONGTAIL_ROUTER_ABI, ERC20_ABI } from '../abi';

export interface UseSwapOptions {
  slippage?: number;
  onSuccess?: (txHash: string) => void;
  onError?: (error: Error) => void;
}

/**
 * Hook for swapping tokens on Longtail AMM
 */
export function useLongtailSwap(options: UseSwapOptions = {}) {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();

  const [status, setStatus] = useState<SwapStatus>('idle');
  const [quote, setQuote] = useState<SwapQuote | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  const slippage = options.slippage ?? DEFAULT_SLIPPAGE;

  /**
   * Get a swap quote
   */
  const getQuote = useCallback(
    async (
      tokenIn: Address,
      tokenOut: Address,
      amountIn: bigint,
      fee: number = 3000
    ): Promise<SwapQuote | null> => {
      if (!publicClient) {
        setError(new Error('Public client not available'));
        return null;
      }

      setStatus('fetching-quote');
      setError(null);

      try {
        // In production, this would call a quoter contract
        // For now, simulate a quote with ~1% fee
        const estimatedOutput = (amountIn * BigInt(99)) / BigInt(100);

        const swapQuote: SwapQuote = {
          tokenIn,
          tokenOut,
          amountIn,
          amountOut: estimatedOutput,
          priceImpact: 0.1,
          route: [
            {
              pool: LONGTAIL_CONTRACTS.AMM,
              tokenIn,
              tokenOut,
              fee,
            },
          ],
          estimatedGas: BigInt(200000),
        };

        setQuote(swapQuote);
        setStatus('idle');
        return swapQuote;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to get quote');
        setError(error);
        setStatus('error');
        options.onError?.(error);
        return null;
      }
    },
    [publicClient, options]
  );

  /**
   * Execute a swap
   */
  const swap = useCallback(
    async (
      tokenIn: Address,
      tokenOut: Address,
      amountIn: bigint,
      fee: number = 3000
    ): Promise<string | null> => {
      if (!address || !walletClient || !publicClient) {
        setError(new Error('Wallet not connected'));
        return null;
      }

      try {
        // Get fresh quote
        const swapQuote = await getQuote(tokenIn, tokenOut, amountIn, fee);
        if (!swapQuote) return null;

        // Check and approve if needed
        setStatus('approving');
        const allowance = await publicClient.readContract({
          address: tokenIn,
          abi: ERC20_ABI,
          functionName: 'allowance',
          args: [address, LONGTAIL_CONTRACTS.PERMIT2_ROUTER],
        });

        if (allowance < amountIn) {
          const approveHash = await walletClient.writeContract({
            address: tokenIn,
            abi: ERC20_ABI,
            functionName: 'approve',
            args: [LONGTAIL_CONTRACTS.PERMIT2_ROUTER, amountIn],
          });
          await publicClient.waitForTransactionReceipt({ hash: approveHash });
        }

        // Execute swap
        setStatus('swapping');
        const minAmountOut =
          (swapQuote.amountOut * BigInt(100 - Math.floor(slippage * 100))) /
          BigInt(10000);
        const deadline = BigInt(Math.floor(Date.now() / 1000) + 1800);

        const hash = await walletClient.writeContract({
          address: LONGTAIL_CONTRACTS.PERMIT2_ROUTER,
          abi: LONGTAIL_ROUTER_ABI,
          functionName: 'exactInputSingle',
          args: [
            {
              tokenIn,
              tokenOut,
              fee,
              recipient: address,
              deadline,
              amountIn,
              amountOutMinimum: minAmountOut,
              sqrtPriceLimitX96: BigInt(0),
            },
          ],
        });

        setTxHash(hash);
        await publicClient.waitForTransactionReceipt({ hash });
        setStatus('completed');
        options.onSuccess?.(hash);

        return hash;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Swap failed');
        setError(error);
        setStatus('error');
        options.onError?.(error);
        return null;
      }
    },
    [address, walletClient, publicClient, getQuote, slippage, options]
  );

  /**
   * Reset state
   */
  const reset = useCallback(() => {
    setStatus('idle');
    setQuote(null);
    setError(null);
    setTxHash(null);
  }, []);

  return {
    status,
    quote,
    error,
    txHash,
    isLoading: status !== 'idle' && status !== 'completed' && status !== 'error',
    getQuote,
    swap,
    reset,
  };
}
