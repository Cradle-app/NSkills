// @cradle/superposition-meow-domains
// Superposition .meow domain resolution and registration

// Types
export type {
  DomainMetadata,
  DomainInfo,
  DomainRegistration,
  DomainStatus,
  UseMeowDomainReturn,
  UseRegisterMeowDomainReturn,
  UseReverseLookupReturn,
} from './types';

// Constants
export {
  MEOW_DOMAINS_CONTRACTS,
  MEOW_DOMAINS_CONFIG,
  SUPERPOSITION_CHAINS,
  DOMAIN_VALIDATION,
  validateDomainName,
  normalizeDomainName,
  formatDomainName,
} from './constants';

// ABI
export { PUNK_TLD_ABI } from './abi';

// Hooks
export {
  useMeowDomain,
  useMeowReverseLookup,
  useRegisterMeowDomain,
  type UseMeowDomainOptions,
  type UseReverseLookupOptions,
  type UseRegisterOptions,
} from './hooks';
