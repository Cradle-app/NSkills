# @cradle/superposition-super-assets

Super Assets integration for Superposition - yield-bearing wrapped token utilities.

## Overview

Super Assets are yield-bearing wrapped tokens that pay rewards for both holding AND using them on Superposition.

- **Passive Yield**: Earn yield just by holding Super Assets
- **Active Yield**: Earn additional rewards when using them in transactions
- **Utility Mining**: Every transaction earns potential token rewards

## Installation

```bash
pnpm add @cradle/superposition-super-assets
```

## Usage

```tsx
import { useSuperAsset } from '@cradle/superposition-super-assets';
import { parseUnits } from 'viem';

function WrapComponent() {
  const { wrap, unwrap, status, error } = useSuperAsset('sUSDC');

  const handleWrap = async () => {
    // Wrap 100 USDC to sUSDC
    const txHash = await wrap(parseUnits('100', 6));
    console.log('Wrap tx:', txHash);
  };

  const handleUnwrap = async () => {
    // Unwrap 100 sUSDC to USDC
    const txHash = await unwrap(parseUnits('100', 6));
    console.log('Unwrap tx:', txHash);
  };

  return (
    <div>
      <button onClick={handleWrap} disabled={status !== 'idle'}>
        Wrap 100 USDC
      </button>
      <button onClick={handleUnwrap} disabled={status !== 'idle'}>
        Unwrap 100 sUSDC
      </button>
      {error && <p className="error">{error.message}</p>}
    </div>
  );
}
```

## Supported Super Assets

- **sUSDC** - Super USDC
- **sETH** - Super ETH
- **sWETH** - Super WETH

## Resources

- [Super Assets Documentation](https://docs.superposition.so/superposition-mainnet/super-layer/super-assets)
- [Superposition Bridge](https://bridge.superposition.so)
