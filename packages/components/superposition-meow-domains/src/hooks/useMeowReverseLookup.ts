// Superposition Meow Domain Reverse Lookup Hook
// @cradle/superposition-meow-domains

'use client';

import { useState, useEffect } from 'react';
import { usePublicClient } from 'wagmi';
import { type Address } from 'viem';
import { MEOW_DOMAINS_CONTRACTS, MEOW_DOMAINS_CONFIG } from '../constants';
import { PUNK_TLD_ABI } from '../abi';
import type { UseReverseLookupReturn } from '../types';

export interface UseReverseLookupOptions {
  /** Network to use (default: 'mainnet') */
  network?: 'mainnet' | 'testnet';
}

/**
 * Hook for reverse lookup (address to .meow domain)
 * 
 * @param address - The address to look up
 * @param options - Configuration options
 * @returns The primary domain for the address
 * 
 * @example
 * ```tsx
 * const { domain, isLoading } = useMeowReverseLookup('0x...');
 * // domain = 'vitalik.meow' or null
 * ```
 */
export function useMeowReverseLookup(
  address: Address | undefined,
  options: UseReverseLookupOptions = {}
): UseReverseLookupReturn {
  const { network = 'mainnet' } = options;
  const publicClient = usePublicClient();

  const [domain, setDomain] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const contracts = MEOW_DOMAINS_CONTRACTS[network];

  useEffect(() => {
    if (!address || !publicClient) {
      setDomain(null);
      return;
    }

    const lookup = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const name = await publicClient.readContract({
          address: contracts.tld,
          abi: PUNK_TLD_ABI,
          functionName: 'defaultNames',
          args: [address],
        }) as string;

        if (name && name !== '') {
          setDomain(`${name}${MEOW_DOMAINS_CONFIG.tld}`);
        } else {
          setDomain(null);
        }
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Reverse lookup failed'));
        setDomain(null);
      } finally {
        setIsLoading(false);
      }
    };

    lookup();
  }, [address, publicClient, contracts.tld]);

  return {
    domain,
    isLoading,
    error,
  };
}
