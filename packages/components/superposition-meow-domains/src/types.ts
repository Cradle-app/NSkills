// Superposition Meow Domains Types
// @cradle/superposition-meow-domains

import type { Address } from 'viem';

/**
 * Metadata that can be attached to a .meow domain
 */
export interface DomainMetadata {
  /** Twitter/X handle */
  twitter?: string;
  /** Website URL */
  url?: string;
  /** Email address */
  email?: string;
  /** Avatar image URL */
  avatar?: string;
  /** Bio/description */
  description?: string;
}

/**
 * Full domain information
 */
export interface DomainInfo {
  /** The domain name including .meow */
  name: string;
  /** Owner address */
  owner: Address;
  /** Resolver contract address */
  resolver: Address;
  /** Registration timestamp */
  registrationDate: number;
  /** Expiration timestamp (if applicable) */
  expirationDate?: number;
  /** Associated metadata */
  metadata: DomainMetadata;
}

/**
 * Domain registration request
 */
export interface DomainRegistration {
  /** Domain name (without .meow) */
  name: string;
  /** Registration duration in seconds */
  duration: number;
  /** Optional metadata to set */
  metadata?: DomainMetadata;
}

/**
 * Domain operation status
 */
export type DomainStatus = 'idle' | 'loading' | 'resolving' | 'registering' | 'success' | 'error';

/**
 * Return type for useMeowDomain hook
 */
export interface UseMeowDomainReturn {
  /** Current operation status */
  status: DomainStatus;
  /** Resolved owner address */
  address: Address | null;
  /** Full domain information */
  domain: DomainInfo | null;
  /** Domain metadata */
  metadata: DomainMetadata | null;
  /** Whether a resolution is in progress */
  isLoading: boolean;
  /** Error if resolution failed */
  error: Error | null;
  /** Manually refetch domain data */
  refetch: () => Promise<void>;
}

/**
 * Return type for useRegisterMeowDomain hook
 */
export interface UseRegisterMeowDomainReturn {
  /** Current operation status */
  status: DomainStatus;
  /** Error if registration failed */
  error: Error | null;
  /** Whether a registration is in progress */
  isLoading: boolean;
  /** Transaction hash of registration */
  txHash: string | null;
  /** Register a new domain */
  register: (name: string, duration?: number, metadata?: DomainMetadata) => Promise<string>;
  /** Check if a domain is available */
  checkAvailability: (name: string) => Promise<boolean>;
  /** Get the price for registering a domain */
  getPrice: (name: string, duration?: number) => Promise<bigint>;
}

/**
 * Return type for useMeowReverseLookup hook
 */
export interface UseReverseLookupReturn {
  /** The primary domain for the address */
  domain: string | null;
  /** Whether lookup is in progress */
  isLoading: boolean;
  /** Error if lookup failed */
  error: Error | null;
}
