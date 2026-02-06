import type { SupportedCompoundChain } from './types';

/**
 * Compound V3 Comet contract addresses per chain.
 */
export const COMPOUND_CONFIG: Record<SupportedCompoundChain, { cometAddress: string }> = {
  arbitrum: {
    // cUSDCv3 on Arbitrum
    cometAddress: '0xA5EDBDD9646f8dFF606d7448e414884C7d905dCA',
  },
};
