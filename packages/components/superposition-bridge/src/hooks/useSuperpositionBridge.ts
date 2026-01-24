'use client';

import { useState, useCallback } from 'react';
import { useAccount, usePublicClient, useWalletClient } from 'wagmi';
import type { Address } from 'viem';
import type { BridgeQuote, BridgeStatus, BridgeToken, SourceChain } from '../types';
import {
  SUPERPOSITION_CHAIN_ID,
  CHAIN_IDS,
  TOKEN_ADDRESSES,
  DEFAULT_SLIPPAGE,
} from '../constants';

export interface UseBridgeOptions {
  slippage?: number;
  onSuccess?: (txHash: string) => void;
  onError?: (error: Error) => void;
}

/**
 * Hook for bridging assets to Superposition L3
 */
export function useSuperpositionBridge(options: UseBridgeOptions = {}) {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();

  const [status, setStatus] = useState<BridgeStatus>('idle');
  const [quote, setQuote] = useState<BridgeQuote | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  const slippage = options.slippage ?? DEFAULT_SLIPPAGE;

  /**
   * Get a bridge quote using Li.Fi
   */
  const getQuote = useCallback(
    async (
      sourceChain: SourceChain,
      token: BridgeToken,
      amount: bigint
    ): Promise<BridgeQuote | null> => {
      if (!address) {
        setError(new Error('Wallet not connected'));
        return null;
      }

      setStatus('fetching-quote');
      setError(null);

      try {
        const fromChainId = CHAIN_IDS[sourceChain];
        const tokenAddresses = TOKEN_ADDRESSES[sourceChain];
        const fromToken = tokenAddresses[token];

        if (!fromToken) {
          throw new Error(`Token ${token} not supported on ${sourceChain}`);
        }

        // Dynamic import of Li.Fi SDK
        const { getRoutes } = await import('@lifi/sdk');

        const routes = await getRoutes({
          fromChainId,
          toChainId: SUPERPOSITION_CHAIN_ID,
          fromTokenAddress: fromToken,
          toTokenAddress: fromToken,
          fromAmount: amount.toString(),
          fromAddress: address,
          toAddress: address,
          options: {
            slippage: slippage / 100,
            order: 'RECOMMENDED',
          },
        });

        if (!routes.routes || routes.routes.length === 0) {
          throw new Error('No routes found for this bridge');
        }

        const bestRoute = routes.routes[0];
        const bridgeQuote: BridgeQuote = {
          fromChainId,
          toChainId: SUPERPOSITION_CHAIN_ID,
          fromToken,
          toToken: fromToken,
          fromAmount: amount,
          toAmount: BigInt(bestRoute.toAmount),
          estimatedGas: BigInt(bestRoute.gasCostUSD || '0'),
          bridgeFee: BigInt(0),
          route: {
            provider: bestRoute.steps[0]?.toolDetails?.name || 'Unknown',
            steps: bestRoute.steps.map((step) => ({
              type: step.type as 'swap' | 'bridge' | 'approve',
              tool: step.tool,
              fromChain: step.action.fromChainId,
              toChain: step.action.toChainId,
              fromToken: step.action.fromToken.address as Address,
              toToken: step.action.toToken.address as Address,
              fromAmount: step.action.fromAmount,
              toAmount: step.estimate.toAmount,
            })),
            estimatedTime: bestRoute.steps.reduce(
              (acc, step) => acc + (step.estimate.executionDuration || 0),
              0
            ),
          },
        };

        setQuote(bridgeQuote);
        setStatus('idle');
        return bridgeQuote;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to get quote');
        setError(error);
        setStatus('error');
        options.onError?.(error);
        return null;
      }
    },
    [address, slippage, options]
  );

  /**
   * Execute bridge transaction
   */
  const bridge = useCallback(
    async (
      sourceChain: SourceChain,
      token: BridgeToken,
      amount: bigint
    ): Promise<string | null> => {
      if (!address || !walletClient) {
        setError(new Error('Wallet not connected'));
        return null;
      }

      try {
        // Get fresh quote
        const bridgeQuote = await getQuote(sourceChain, token, amount);
        if (!bridgeQuote) return null;

        setStatus('bridging');

        // Dynamic import of Li.Fi SDK
        const { getRoutes, executeRoute } = await import('@lifi/sdk');

        const fromChainId = CHAIN_IDS[sourceChain];
        const tokenAddresses = TOKEN_ADDRESSES[sourceChain];
        const fromToken = tokenAddresses[token];

        if (!fromToken) {
          throw new Error(`Token ${token} not supported on ${sourceChain}`);
        }

        const routes = await getRoutes({
          fromChainId,
          toChainId: SUPERPOSITION_CHAIN_ID,
          fromTokenAddress: fromToken,
          toTokenAddress: fromToken,
          fromAmount: amount.toString(),
          fromAddress: address,
          toAddress: address,
        });

        if (!routes.routes || routes.routes.length === 0) {
          throw new Error('No routes found');
        }

        // The Li.Fi SDK executeRoute helper returns a rich object whose exact
        // type is not exported in a way that's convenient to consume here.
        // We only care about the transaction hash, so we treat the result as
        // an opaque object and safely read a transactionHash field if present.
        const executionResult = (await executeRoute(
          routes.routes[0],
          {}
        )) as { transactionHash?: string } | undefined;
        const hash = executionResult?.transactionHash ?? null;

        setTxHash(hash);
        setStatus('waiting-confirmation');

        // Wait and complete
        setStatus('completed');
        if (hash) {
          options.onSuccess?.(hash);
        }

        return hash;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Bridge failed');
        setError(error);
        setStatus('error');
        options.onError?.(error);
        return null;
      }
    },
    [address, walletClient, getQuote, options]
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
    // State
    status,
    quote,
    error,
    txHash,
    isLoading:
      status === 'fetching-quote' ||
      status === 'bridging' ||
      status === 'waiting-confirmation',

    // Actions
    getQuote,
    bridge,
    reset,

    // Config
    supportedTokens: ['ETH', 'USDC', 'USDT', 'WETH', 'ARB'] as const,
    supportedChains: ['arbitrum', 'ethereum', 'optimism', 'base'] as const,
  };
}
