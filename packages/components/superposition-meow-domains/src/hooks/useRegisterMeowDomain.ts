// Superposition Meow Domain Registration Hook
// @cradle/superposition-meow-domains

'use client';

import { useState, useCallback } from 'react';
import { useAccount, usePublicClient, useWalletClient } from 'wagmi';
import { parseEther, type Address } from 'viem';
import { 
  MEOW_DOMAINS_CONTRACTS, 
  MEOW_DOMAINS_CONFIG,
  validateDomainName,
  normalizeDomainName,
} from '../constants';
import { PUNK_TLD_ABI } from '../abi';
import type {
  DomainMetadata,
  DomainStatus,
  UseRegisterMeowDomainReturn,
} from '../types';

export interface UseRegisterOptions {
  /** Network to use (default: 'mainnet') */
  network?: 'mainnet' | 'testnet';
  /** Referrer address for affiliate rewards */
  referrer?: Address;
}

/**
 * Hook for registering .meow domains
 * 
 * @param options - Configuration options
 * @returns Registration functions and state
 * 
 * @example
 * ```tsx
 * const { register, checkAvailability, getPrice, isLoading } = useRegisterMeowDomain();
 * 
 * // Check if available
 * const available = await checkAvailability('myname');
 * 
 * // Get price
 * const price = await getPrice('myname');
 * 
 * // Register with metadata
 * const txHash = await register('myname', undefined, { twitter: 'myhandle' });
 * ```
 */
export function useRegisterMeowDomain(
  options: UseRegisterOptions = {}
): UseRegisterMeowDomainReturn {
  const { 
    network = 'mainnet', 
    referrer = '0x0000000000000000000000000000000000000000' as Address 
  } = options;
  
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();

  const [status, setStatus] = useState<DomainStatus>('idle');
  const [error, setError] = useState<Error | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  const isLoading = status === 'loading' || status === 'registering';
  const contracts = MEOW_DOMAINS_CONTRACTS[network];

  /**
   * Check if domain is available
   */
  const checkAvailability = useCallback(
    async (name: string): Promise<boolean> => {
      if (!publicClient) return false;

      const normalized = normalizeDomainName(name);
      
      // Validate name first
      const validation = validateDomainName(normalized);
      if (!validation.valid) {
        return false;
      }

      try {
        const holder = await publicClient.readContract({
          address: contracts.tld,
          abi: PUNK_TLD_ABI,
          functionName: 'getDomainHolder',
          args: [normalized],
        }) as Address;

        // Domain is available if holder is zero address
        return holder === '0x0000000000000000000000000000000000000000';
      } catch {
        return false;
      }
    },
    [publicClient, contracts.tld]
  );

  /**
   * Get domain price
   */
  const getPrice = useCallback(
    async (name: string, duration?: number): Promise<bigint> => {
      if (!publicClient) return 0n;

      try {
        const price = await publicClient.readContract({
          address: contracts.tld,
          abi: PUNK_TLD_ABI,
          functionName: 'price',
          args: [],
        }) as bigint;

        return price;
      } catch {
        // Default price fallback
        return parseEther('0.001');
      }
    },
    [publicClient, contracts.tld]
  );

  /**
   * Register a domain
   */
  const register = useCallback(
    async (
      name: string,
      duration?: number,
      metadata?: DomainMetadata
    ): Promise<string> => {
      if (!address) {
        throw new Error('Wallet not connected');
      }
      if (!walletClient) {
        throw new Error('Wallet client not available');
      }
      if (!publicClient) {
        throw new Error('Public client not available');
      }

      const normalized = normalizeDomainName(name);
      
      // Validate name
      const validation = validateDomainName(normalized);
      if (!validation.valid) {
        const err = new Error(validation.error);
        setError(err);
        setStatus('error');
        throw err;
      }

      setStatus('registering');
      setError(null);

      try {
        // Check availability
        const isAvailable = await checkAvailability(normalized);
        if (!isAvailable) {
          throw new Error('Domain is not available');
        }

        // Get price
        const price = await getPrice(normalized);

        // Register domain
        const { request } = await publicClient.simulateContract({
          address: contracts.tld,
          abi: PUNK_TLD_ABI,
          functionName: 'mint',
          args: [normalized, address, referrer],
          value: price,
          account: address,
        });

        const hash = await walletClient.writeContract(request);
        setTxHash(hash);

        // Wait for confirmation
        await publicClient.waitForTransactionReceipt({ hash });

        // If metadata provided, update it
        if (metadata && Object.keys(metadata).length > 0) {
          const { request: editRequest } = await publicClient.simulateContract({
            address: contracts.tld,
            abi: PUNK_TLD_ABI,
            functionName: 'editData',
            args: [normalized, JSON.stringify(metadata)],
            account: address,
          });

          await walletClient.writeContract(editRequest);
        }

        setStatus('success');
        return hash;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Registration failed');
        setError(error);
        setStatus('error');
        throw error;
      }
    },
    [address, walletClient, publicClient, contracts.tld, referrer, checkAvailability, getPrice]
  );

  return {
    status,
    error,
    isLoading,
    txHash,
    register,
    checkAvailability,
    getPrice,
  };
}
