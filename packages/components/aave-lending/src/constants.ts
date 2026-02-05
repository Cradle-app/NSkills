import type { SupportedAaveChain } from './types';

/**
 * Aave V3 contract addresses per chain.
 * Reference: https://github.com/try-flowforge/backend/blob/main/src/services/lending/providers/AaveProvider.ts
 */
export const AAVE_CONFIG: Record<
  SupportedAaveChain,
  { poolAddress: string; poolDataProviderAddress: string }
> = {
  arbitrum: {
    poolAddress: '0x794a61358D6845594F94dc1DB02A252b5b4814aD',
    poolDataProviderAddress: '0x69FA688f1Dc47d4B5d8029D5a35FB7a548310654',
  },
  'ethereum-sepolia': {
    poolAddress: '0x6Ae43d3271ff6888e7Fc43Fd7321a503ff738951',
    poolDataProviderAddress: '0x3e9708d80f7B3e43118013075F7e95CE3AB31F31',
  },
  'arbitrum-sepolia': {
    poolAddress: '0xb4a7914f7f99dcb62ee13554e4ea75e9a4f2578d',
    poolDataProviderAddress: '0x393c04f982D4696010f3E118A42698D08F005483',
  },
};
