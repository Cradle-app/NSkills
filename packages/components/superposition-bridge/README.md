# @cradle/superposition-bridge

Bridge assets to Superposition L3 via Li.Fi cross-chain routing.

## Installation

```bash
pnpm add @cradle/superposition-bridge @lifi/sdk
```

## Usage

```tsx
import { useSuperpositionBridge } from '@cradle/superposition-bridge';

function BridgeComponent() {
  const { getQuote, bridge, quote, status, error } = useSuperpositionBridge();

  const handleBridge = async () => {
    // Get a quote first
    const quote = await getQuote('arbitrum', 'ETH', BigInt(1e18));
    
    if (quote) {
      // Execute the bridge
      const txHash = await bridge('arbitrum', 'ETH', BigInt(1e18));
      console.log('Bridge tx:', txHash);
    }
  };

  return (
    <div>
      <button onClick={handleBridge} disabled={status !== 'idle'}>
        Bridge 1 ETH to Superposition
      </button>
      {quote && <p>Expected output: {quote.toAmount.toString()}</p>}
      {error && <p className="error">{error.message}</p>}
    </div>
  );
}
```

## Supported Chains

- Arbitrum
- Ethereum
- Optimism
- Base

## Supported Tokens

- ETH
- USDC
- USDT
- WETH
- ARB

## Resources

- [Superposition Bridge](https://bridge.superposition.so)
- [Li.Fi Documentation](https://docs.li.fi)
