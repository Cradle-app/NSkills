import type { SupportedCompoundChain } from './types';

/**
 * Compound V3 Comet contract addresses per chain.
 */
export const COMPOUND_CONFIG: Record<SupportedCompoundChain, { cometAddress: string }> = {
  arbitrum: {
    // cUSDCv3 on Arbitrum
    cometAddress: '0x9c4ec768c28520B50860ea7a15bd7213a9fF58bf',
  },
};
