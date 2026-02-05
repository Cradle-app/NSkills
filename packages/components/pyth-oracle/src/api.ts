import type { PythPriceOptions, PythPriceResult, PythPriceRaw } from './types';

/**
 * Fetch latest price from Pyth Hermes HTTP API.
 *
 * Docs: https://docs.pyth.network/price-feeds
 */
export async function getPythPrice(options: PythPriceOptions): Promise<PythPriceResult> {
  const { chain, priceFeedId, staleAfterSeconds } = options;

  if (!priceFeedId.startsWith('0x') || priceFeedId.length !== 66) {
    throw new Error('Invalid Pyth price feed ID. Expected 32-byte hex string starting with 0x.');
  }

  // Map chain names to Hermes API format
  // Note: Some price feeds may not be available on testnets
  // For Arbitrum Sepolia, many feeds might not exist, so we'll try mainnet as fallback
  const hermesChain = chain === 'arbitrum-sepolia' ? 'arbitrum_sepolia' : 'arbitrum';

  // Construct URL with proper array parameter encoding (ids%5B%5D = ids[])
  // URLSearchParams might not handle [] correctly, so we'll construct manually
  const baseUrl = 'https://hermes.pyth.network/v2/updates/price/latest';
  const encodedFeedId = encodeURIComponent(priceFeedId);
  
  // Try with chain parameter first
  let url = `${baseUrl}?ids%5B%5D=${encodedFeedId}&chain=${encodeURIComponent(hermesChain)}`;
  let res = await fetch(url);

  // If we get a 404 on testnet, try mainnet (many feeds are mainnet-only)
  if (!res.ok && res.status === 404 && chain === 'arbitrum-sepolia') {
    url = `${baseUrl}?ids%5B%5D=${encodedFeedId}&chain=arbitrum`;
    res = await fetch(url);
  }

  // If still failing, try without chain parameter (some feeds work globally)
  if (!res.ok && res.status === 404) {
    url = `${baseUrl}?ids%5B%5D=${encodedFeedId}`;
    res = await fetch(url);
  }

  if (!res.ok) {
    const errorText = await res.text().catch(() => res.statusText);
    throw new Error(
      `Pyth HTTP error: ${res.status} ${res.statusText}. ${errorText ? `Details: ${errorText}` : ''}`
    );
  }

  const json = await res.json();

  if (!Array.isArray(json.parsed) || json.parsed.length === 0) {
    throw new Error('No price data returned from Pyth');
  }

  // Find the item matching our priceFeedId (in case multiple IDs were returned)
  const item = json.parsed.find((p: { id: string }) => p.id === priceFeedId) || json.parsed[0];

  if (!item || !item.price) {
    throw new Error('Invalid price data structure returned from Pyth');
  }

  const raw: PythPriceRaw = {
    id: item.id,
    price: item.price.price,
    conf: item.price.conf,
    expo: item.price.expo,
    publishTime: item.price.publish_time,
  };

  const nowSeconds = Math.floor(Date.now() / 1000);
  const isStale =
    staleAfterSeconds !== undefined
      ? nowSeconds - raw.publishTime > staleAfterSeconds
      : false;

  const formattedPrice = formatPythPrice(raw.price, raw.expo);

  return {
    formattedPrice,
    raw,
    isStale,
  };
}

export function formatPythPrice(price: string, expo: number): string {
  const big = BigInt(price);
  const decimals = Math.abs(expo);
  const factor = BigInt(10) ** BigInt(decimals) as unknown as bigint;
  const integer = big / factor;
  const fraction = big % factor;

  const integerStr = integer.toString();
  let fractionStr = fraction.toString().padStart(decimals, '0');
  // Limit to 6 decimal places for display
  if (fractionStr.length > 6) {
    fractionStr = fractionStr.slice(0, 6);
  }

  return `${integerStr}.${fractionStr}`;
}

