import type { Address } from 'viem';
import type { SuperAsset, SuperAssetSymbol } from './types';

/**
 * Superposition chain ID
 */
export const SUPERPOSITION_CHAIN_ID = 55244;

/**
 * Super Assets on Superposition mainnet
 * 
 * NOTE: Super Asset wrapping contract addresses are not yet publicly documented.
 * Super Assets are yield-bearing wrapped tokens that earn rewards on every transaction.
 * 
 * For updates, check:
 * - https://docs.superposition.so/superposition-mainnet/super-layer/super-assets
 * - https://long.so (Longtail uses Super Assets for trading pairs)
 * 
 * Underlying token addresses are verified from docs.long.so
 */
export const SUPER_ASSETS: SuperAsset[] = [
  {
    symbol: 'sUSDC',
    name: 'Super USDC',
    // TODO: Super USDC wrapper - check docs.superposition.so for verified address
    address: '0x0000000000000000000000000000000000000000' as Address,
    // USDC address verified from docs.long.so
    underlyingAddress: '0x6c030c5CC283F791B26816f325b9C632d964F8A1' as Address,
    underlyingSymbol: 'USDC',
    decimals: 6,
    apy: 5.5,
    totalSupply: BigInt(0),
    exchangeRate: BigInt(1e18),
  },
  {
    symbol: 'sETH',
    name: 'Super ETH',
    // TODO: Super ETH wrapper - check docs.superposition.so for verified address
    address: '0x0000000000000000000000000000000000000000' as Address,
    // Native ETH (zero address)
    underlyingAddress: '0x0000000000000000000000000000000000000000' as Address,
    underlyingSymbol: 'ETH',
    decimals: 18,
    apy: 4.2,
    totalSupply: BigInt(0),
    exchangeRate: BigInt(1e18),
  },
  {
    symbol: 'sWETH',
    name: 'Super WETH',
    // TODO: Super WETH wrapper - check docs.superposition.so for verified address
    address: '0x0000000000000000000000000000000000000000' as Address,
    // WETH address verified from docs.long.so
    underlyingAddress: '0x1fB719f10b56d7a85DCD32f27f897375fB21cfdd' as Address,
    underlyingSymbol: 'WETH',
    decimals: 18,
    apy: 4.2,
    totalSupply: BigInt(0),
    exchangeRate: BigInt(1e18),
  },
];

/**
 * Get Super Asset address by symbol
 */
export function getSuperAssetAddress(symbol: SuperAssetSymbol): Address {
  const asset = SUPER_ASSETS.find((a) => a.symbol === symbol);
  if (!asset) throw new Error(`Unknown Super Asset: ${symbol}`);
  return asset.address;
}

/**
 * Get underlying token address for a Super Asset
 */
export function getUnderlyingAddress(symbol: SuperAssetSymbol): Address {
  const asset = SUPER_ASSETS.find((a) => a.symbol === symbol);
  if (!asset) throw new Error(`Unknown Super Asset: ${symbol}`);
  return asset.underlyingAddress;
}

/**
 * Get Super Asset info by symbol
 */
export function getSuperAssetInfo(symbol: SuperAssetSymbol): SuperAsset {
  const asset = SUPER_ASSETS.find((a) => a.symbol === symbol);
  if (!asset) throw new Error(`Unknown Super Asset: ${symbol}`);
  return asset;
}

/**
 * Check if an address is a Super Asset
 */
export function isSuperAsset(address: Address): boolean {
  return SUPER_ASSETS.some(
    (a) => a.address.toLowerCase() === address.toLowerCase()
  );
}
