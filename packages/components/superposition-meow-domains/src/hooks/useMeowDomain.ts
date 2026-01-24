// Superposition Meow Domain Resolution Hook
// @cradle/superposition-meow-domains

'use client';

import { useState, useCallback, useEffect } from 'react';
import { usePublicClient } from 'wagmi';
import { type Address } from 'viem';
import { 
  MEOW_DOMAINS_CONTRACTS, 
  MEOW_DOMAINS_CONFIG,
  normalizeDomainName,
  formatDomainName,
} from '../constants';
import { PUNK_TLD_ABI } from '../abi';
import type {
  DomainInfo,
  DomainMetadata,
  DomainStatus,
  UseMeowDomainReturn,
} from '../types';

export interface UseMeowDomainOptions {
  /** Network to use (default: 'mainnet') */
  network?: 'mainnet' | 'testnet';
  /** Whether to fetch metadata (default: true) */
  fetchMetadata?: boolean;
}

/**
 * Hook for resolving .meow domains to addresses
 * 
 * @param domain - The domain name to resolve (with or without .meow suffix)
 * @param options - Configuration options
 * @returns Domain resolution result
 * 
 * @example
 * ```tsx
 * const { address, metadata, isLoading } = useMeowDomain('vitalik.meow');
 * ```
 */
export function useMeowDomain(
  domain: string,
  options: UseMeowDomainOptions = {}
): UseMeowDomainReturn {
  const { network = 'mainnet', fetchMetadata = true } = options;
  const publicClient = usePublicClient();

  const [status, setStatus] = useState<DomainStatus>('idle');
  const [address, setAddress] = useState<Address | null>(null);
  const [domainInfo, setDomainInfo] = useState<DomainInfo | null>(null);
  const [metadata, setMetadata] = useState<DomainMetadata | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const isLoading = status === 'loading' || status === 'resolving';
  const contracts = MEOW_DOMAINS_CONTRACTS[network];

  // Normalize domain name (remove .meow suffix if present)
  const normalizedDomain = normalizeDomainName(domain);

  /**
   * Resolve domain to address
   */
  const resolve = useCallback(async () => {
    if (!normalizedDomain || !publicClient) return;

    setStatus('resolving');
    setError(null);

    try {
      // Get domain holder address
      const holder = await publicClient.readContract({
        address: contracts.tld,
        abi: PUNK_TLD_ABI,
        functionName: 'getDomainHolder',
        args: [normalizedDomain],
      }) as Address;

      // Check if domain is registered (not zero address)
      if (holder === '0x0000000000000000000000000000000000000000') {
        setAddress(null);
        setDomainInfo(null);
        setMetadata(null);
        setStatus('idle');
        return;
      }

      setAddress(holder);

      // Fetch domain data (metadata) if requested
      if (fetchMetadata) {
        try {
          const [, data] = await publicClient.readContract({
            address: contracts.tld,
            abi: PUNK_TLD_ABI,
            functionName: 'getDomainData',
            args: [normalizedDomain],
          }) as [Address, string];

          // Parse metadata from JSON string
          let parsedMetadata: DomainMetadata = {};
          try {
            parsedMetadata = data ? JSON.parse(data) : {};
          } catch {
            // Invalid JSON, use empty metadata
          }

          setMetadata(parsedMetadata);
          setDomainInfo({
            name: formatDomainName(normalizedDomain),
            owner: holder,
            resolver: contracts.resolver,
            registrationDate: 0, // Not available from contract
            metadata: parsedMetadata,
          });
        } catch {
          // Metadata fetch failed, but we have the address
          setMetadata(null);
          setDomainInfo({
            name: formatDomainName(normalizedDomain),
            owner: holder,
            resolver: contracts.resolver,
            registrationDate: 0,
            metadata: {},
          });
        }
      }

      setStatus('success');
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to resolve domain');
      setError(error);
      setStatus('error');
    }
  }, [normalizedDomain, publicClient, contracts, fetchMetadata]);

  // Auto-resolve when domain changes
  useEffect(() => {
    if (normalizedDomain) {
      resolve();
    } else {
      setAddress(null);
      setDomainInfo(null);
      setMetadata(null);
      setStatus('idle');
    }
  }, [normalizedDomain, resolve]);

  return {
    status,
    address,
    domain: domainInfo,
    metadata,
    isLoading,
    error,
    refetch: resolve,
  };
}
