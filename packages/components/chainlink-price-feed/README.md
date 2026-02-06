# @cradle/chainlink-price-feed

Chainlink Data Feeds integration for Cradle-generated projects. Reads price data from AggregatorV3Interface contracts on Arbitrum and Arbitrum Sepolia.

## Installation

```bash
pnpm add @cradle/chainlink-price-feed
```

## Usage

```tsx
import { useChainlinkPrice, getChainlinkPrice } from '@cradle/chainlink-price-feed';

// React hook (optionally with wagmi usePublicClient for custom RPC)
function PriceDisplay() {
  const { data, loading, error, refetch } = useChainlinkPrice({
    chain: 'arbitrum',
    feedAddress: '0x639Fe6ab55C921f74e7fac1ee960C0B6293ba612', // ETH/USD
  });
  if (loading) return <span>Loading...</span>;
  if (error) return <span>Error: {error.message}</span>;
  return <span>{data?.formattedPrice ?? '—'}</span>;
}

// Or call API directly (uses public RPC)
const result = await getChainlinkPrice({
  chain: 'arbitrum',
  feedAddress: '0x639Fe6ab55C921f74e7fac1ee960C0B6293ba612',
});
```

## Resources

- [Chainlink Data Feeds](https://docs.chain.link/data-feeds)
- [Price Feed Addresses (Arbitrum)](https://docs.chain.link/data-feeds/price-feeds/addresses?network=arbitrum)
