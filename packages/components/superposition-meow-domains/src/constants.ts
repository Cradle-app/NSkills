// Superposition Meow Domains Constants
// @cradle/superposition-meow-domains

import type { Address } from 'viem';

/**
 * Meow Domains contract addresses
 * Based on Punk Domains protocol
 * Source: https://github.com/fluidity-money/meow.domains/blob/main/src/abi/tlds.json
 */
export const MEOW_DOMAINS_CONTRACTS = {
  mainnet: {
    /** .meow TLD contract on Superposition mainnet (verified from meow.domains repo) */
    tld: '0x4087fb91A1fBdef05761C02714335D232a2Bf3a1' as Address,
    /** Punk Domains Resolver on Superposition */
    resolver: '0xC6c17896fa051083324f2aD0Ed4555dC46D96E7f' as Address,
    /** Registry - same as TLD for Punk Domains */
    registry: '0x4087fb91A1fBdef05761C02714335D232a2Bf3a1' as Address,
  },
  testnet: {
    /** TODO: Testnet contracts not yet available */
    tld: '0x0000000000000000000000000000000000000000' as Address,
    resolver: '0x0000000000000000000000000000000000000000' as Address,
    registry: '0x0000000000000000000000000000000000000000' as Address,
  },
} as const;

/**
 * Meow Domains configuration
 */
export const MEOW_DOMAINS_CONFIG = {
  /** Top-level domain */
  tld: '.meow',
  
  /** Minimum domain name length */
  minNameLength: 3,
  
  /** Maximum domain name length */
  maxNameLength: 50,
  
  /** Default registration duration (1 year in seconds) */
  defaultDuration: 365 * 24 * 60 * 60,
  
  /** Supported metadata keys */
  metadataKeys: ['twitter', 'url', 'email', 'avatar', 'description'] as const,
} as const;

/**
 * Chain configuration
 */
export const SUPERPOSITION_CHAINS = {
  mainnet: {
    id: 55244,
    name: 'Superposition',
    rpcUrl: 'https://rpc.superposition.so',
    explorerUrl: 'https://explorer.superposition.so',
  },
  testnet: {
    id: 98985,
    name: 'Superposition Testnet',
    rpcUrl: 'https://testnet-rpc.superposition.so',
    explorerUrl: 'https://testnet-explorer.superposition.so',
  },
} as const;

/**
 * Domain validation patterns
 */
export const DOMAIN_VALIDATION = {
  /** Valid characters: lowercase letters, numbers, hyphens (not at start/end) */
  namePattern: /^[a-z0-9][a-z0-9-]*[a-z0-9]$|^[a-z0-9]$/,
  
  /** Reserved names that cannot be registered */
  reservedNames: ['admin', 'superposition', 'meow', 'official', 'support'] as string[],
} as const;

/**
 * Validate a domain name
 */
export function validateDomainName(name: string): { valid: boolean; error?: string } {
  const normalized = name.toLowerCase().replace(MEOW_DOMAINS_CONFIG.tld, '').trim();
  
  if (normalized.length < MEOW_DOMAINS_CONFIG.minNameLength) {
    return { 
      valid: false, 
      error: `Domain name must be at least ${MEOW_DOMAINS_CONFIG.minNameLength} characters` 
    };
  }
  
  if (normalized.length > MEOW_DOMAINS_CONFIG.maxNameLength) {
    return { 
      valid: false, 
      error: `Domain name must be at most ${MEOW_DOMAINS_CONFIG.maxNameLength} characters` 
    };
  }
  
  if (!DOMAIN_VALIDATION.namePattern.test(normalized)) {
    return { 
      valid: false, 
      error: 'Domain name can only contain lowercase letters, numbers, and hyphens' 
    };
  }
  
  if (DOMAIN_VALIDATION.reservedNames.includes(normalized)) {
    return { 
      valid: false, 
      error: 'This domain name is reserved' 
    };
  }
  
  return { valid: true };
}

/**
 * Normalize a domain name (remove .meow suffix if present, lowercase)
 */
export function normalizeDomainName(name: string): string {
  return name.toLowerCase().replace(MEOW_DOMAINS_CONFIG.tld, '').trim();
}

/**
 * Format a domain name with .meow suffix
 */
export function formatDomainName(name: string): string {
  const normalized = normalizeDomainName(name);
  return `${normalized}${MEOW_DOMAINS_CONFIG.tld}`;
}
