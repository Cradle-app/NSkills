# @cradle/superposition-longtail

Longtail AMM integration for Superposition - swap and liquidity utilities.

## Overview

Longtail is Superposition's native DEX built with Arbitrum Stylus. It features:

- **4x cheaper than Uniswap V3** - Built with Stylus for maximum gas efficiency
- **Utility Mining rewards** - Every swap earns yield
- **Super Asset pairs** - All pools paired with yield-bearing tokens

## Installation

```bash
pnpm add @cradle/superposition-longtail
```

## Usage

```tsx
import { useLongtailSwap } from '@cradle/superposition-longtail';
import { parseUnits } from 'viem';

function SwapComponent() {
  const { getQuote, swap, quote, status, error } = useLongtailSwap();

  const handleSwap = async () => {
    const tokenIn = '0x...'; // USDC address
    const tokenOut = '0x...'; // sUSDC address
    const amount = parseUnits('100', 6); // 100 USDC

    // Get a quote
    const quote = await getQuote(tokenIn, tokenOut, amount);

    if (quote) {
      // Execute the swap
      const txHash = await swap(tokenIn, tokenOut, amount);
      console.log('Swap tx:', txHash);
    }
  };

  return (
    <div>
      <button onClick={handleSwap} disabled={status !== 'idle'}>
        Swap 100 USDC to sUSDC
      </button>
      {quote && <p>Expected output: {quote.amountOut.toString()}</p>}
      {error && <p className="error">{error.message}</p>}
    </div>
  );
}
```

## Resources

- [Longtail App](https://long.so)
- [Superposition Docs](https://docs.superposition.so)
