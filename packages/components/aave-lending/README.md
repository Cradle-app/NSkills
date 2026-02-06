# @cradle/aave-lending

Aave V3 lending integration for Cradle-generated projects. Supply, borrow, withdraw, and repay on Aave V3 (Arbitrum, Arbitrum Sepolia, Ethereum Sepolia).


## Installation

```bash
pnpm add @cradle/aave-lending
```

## Usage

```tsx
import { useAaveAccountData, AAVE_CONFIG } from '@cradle/aave-lending';

function LendingDashboard() {
  const { data, loading, error, refetch } = useAaveAccountData({
    chain: 'arbitrum',
    walletAddress: '0x...',
  });
  if (loading) return <span>Loading...</span>;
  if (error) return <span>Error: {error.message}</span>;
  return (
    <div>
      <p>Health Factor: {data?.healthFactor}</p>
      <p>Total Collateral: {data?.totalCollateralBase}</p>
      <p>Total Debt: {data?.totalDebtBase}</p>
    </div>
  );
}
```

## Resources

- [Aave V3 Docs](https://docs.aave.com/developers/getting-started/readme)
- [Aave V3 Arbitrum](https://docs.aave.com/developers/deployed-contracts/v3-mainnet/arbitrum)
