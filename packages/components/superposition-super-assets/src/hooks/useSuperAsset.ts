'use client';

import { useState, useCallback } from 'react';
import { useAccount, usePublicClient, useWalletClient } from 'wagmi';
import type { SuperAssetSymbol, WrapStatus } from '../types';
import { getSuperAssetAddress, getUnderlyingAddress } from '../constants';
import { SUPER_ASSET_ABI, ERC20_ABI } from '../abi';

export interface UseSuperAssetOptions {
  onSuccess?: (txHash: string) => void;
  onError?: (error: Error) => void;
}

/**
 * Hook for interacting with a Super Asset (wrap/unwrap)
 */
export function useSuperAsset(
  asset: SuperAssetSymbol,
  options: UseSuperAssetOptions = {}
) {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();

  const [status, setStatus] = useState<WrapStatus>('idle');
  const [error, setError] = useState<Error | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  const superAssetAddress = getSuperAssetAddress(asset);
  const underlyingAddress = getUnderlyingAddress(asset);

  /**
   * Wrap underlying token to Super Asset
   */
  const wrap = useCallback(
    async (amount: bigint): Promise<string | null> => {
      if (!address || !walletClient || !publicClient) {
        setError(new Error('Wallet not connected'));
        return null;
      }

      setStatus('approving');
      setError(null);

      try {
        // Check and approve underlying token
        const allowance = await publicClient.readContract({
          address: underlyingAddress,
          abi: ERC20_ABI,
          functionName: 'allowance',
          args: [address, superAssetAddress],
        });

        if (allowance < amount) {
          const approveHash = await walletClient.writeContract({
            address: underlyingAddress,
            abi: ERC20_ABI,
            functionName: 'approve',
            args: [superAssetAddress, amount],
          });
          await publicClient.waitForTransactionReceipt({ hash: approveHash });
        }

        // Wrap tokens
        setStatus('wrapping');
        const hash = await walletClient.writeContract({
          address: superAssetAddress,
          abi: SUPER_ASSET_ABI,
          functionName: 'wrap',
          args: [amount],
        });

        setTxHash(hash);
        await publicClient.waitForTransactionReceipt({ hash });
        setStatus('completed');
        options.onSuccess?.(hash);

        return hash;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Wrap failed');
        setError(error);
        setStatus('error');
        options.onError?.(error);
        return null;
      }
    },
    [address, walletClient, publicClient, superAssetAddress, underlyingAddress, options]
  );

  /**
   * Unwrap Super Asset to underlying token
   */
  const unwrap = useCallback(
    async (amount: bigint): Promise<string | null> => {
      if (!address || !walletClient || !publicClient) {
        setError(new Error('Wallet not connected'));
        return null;
      }

      setStatus('unwrapping');
      setError(null);

      try {
        const hash = await walletClient.writeContract({
          address: superAssetAddress,
          abi: SUPER_ASSET_ABI,
          functionName: 'unwrap',
          args: [amount],
        });

        setTxHash(hash);
        await publicClient.waitForTransactionReceipt({ hash });
        setStatus('completed');
        options.onSuccess?.(hash);

        return hash;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Unwrap failed');
        setError(error);
        setStatus('error');
        options.onError?.(error);
        return null;
      }
    },
    [address, walletClient, publicClient, superAssetAddress, options]
  );

  /**
   * Reset state
   */
  const reset = useCallback(() => {
    setStatus('idle');
    setError(null);
    setTxHash(null);
  }, []);

  return {
    status,
    error,
    txHash,
    isLoading: status !== 'idle' && status !== 'completed' && status !== 'error',
    wrap,
    unwrap,
    reset,
    superAssetAddress,
    underlyingAddress,
  };
}
