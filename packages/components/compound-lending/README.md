# @cradle/compound-lending

Compound V3 (Comet) lending integration for Cradle-generated projects. Supply, borrow, withdraw, and repay on Compound V3 (Arbitrum cUSDCv3).

## Installation

```bash
pnpm add @cradle/compound-lending
```

## Usage

```tsx
import { useCompoundAccountData, COMPOUND_CONFIG } from '@cradle/compound-lending';

function LendingDashboard() {
  const { data, loading, error, refetch } = useCompoundAccountData({
    chain: 'arbitrum',
    walletAddress: '0x...',
  });
  if (loading) return <span>Loading...</span>;
  if (error) return <span>Error: {error.message}</span>;
  return (
    <div>
      <p>Supply Balance: {data?.supplyBalance}</p>
      <p>Borrow Balance: {data?.borrowBalance}</p>
      <p>Supply APY: {data?.supplyAPY}%</p>
      <p>Borrow APY: {data?.borrowAPY}%</p>
    </div>
  );
}
```

## Resources

- [Compound V3 Docs](https://docs.compound.finance/)
- [Compound V3 Arbitrum](https://docs.compound.finance/docs#networks)
