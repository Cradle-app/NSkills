'use client';

import { useState } from 'react';
import { useBlueprintStore } from '@/store/blueprint';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Coins, Loader2, AlertCircle, Info, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getAaveAccountData, AAVE_CONFIG } from '@cradle/aave-lending';
import type { SupportedAaveChain, AaveAccountData } from '@cradle/aave-lending';

interface Props {
  nodeId: string;
  config: Record<string, unknown>;
}

export function AaveLendingForm({ nodeId, config }: Props) {
  const { updateNodeConfig } = useBlueprintStore();
  const [walletAddress, setWalletAddress] = useState('');
  const [accountData, setAccountData] = useState<AaveAccountData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [fetched, setFetched] = useState(false);

  const updateConfig = (key: string, value: unknown) => {
    updateNodeConfig(nodeId, { ...config, [key]: value });
  };

  const chainRaw = (config.chain as string) ?? 'arbitrum';
  const chain = (chainRaw === 'arbitrum' || chainRaw === 'arbitrum-sepolia' || chainRaw === 'ethereum-sepolia'
    ? chainRaw
    : 'arbitrum') as SupportedAaveChain;
  const poolAddress = config.poolAddress as string | undefined;
  const poolDataProviderAddress = config.poolDataProviderAddress as string | undefined;

  const handleFetchAccountData = async () => {
    if (!walletAddress || walletAddress.length !== 42) return;
    setLoading(true);
    setError(null);
    setAccountData(null);
    setFetched(true);
    try {
      const result = await getAaveAccountData({
        chain,
        walletAddress,
        poolAddress,
        poolDataProviderAddress,
      });
      setAccountData(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch account data'));
    } finally {
      setLoading(false);
    }
  };

  const poolConfig = AAVE_CONFIG[chain];

  return (
    <div className="space-y-4">
      <div className="p-3 rounded-lg border border-forge-border/50 bg-forge-bg/50">
        <div className="flex items-center gap-2 mb-2">
          <Coins className="w-4 h-4 text-accent-cyan" />
          <span className="text-sm font-medium text-white">Aave V3 Lending</span>
        </div>
        <p className="text-xs text-forge-muted">
          Supply, borrow, withdraw, and repay on Aave V3. Supports Arbitrum, Arbitrum Sepolia, and Ethereum Sepolia.
        </p>
      </div>

      {/* 1. Select Network */}
      <div>
        <label className="text-xs text-forge-muted mb-1.5 block">1. Select Network</label>
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => updateConfig('chain', 'arbitrum')}
            className={cn(
              'px-3 py-2.5 rounded-lg border text-xs font-medium transition-all',
              chainRaw === 'arbitrum'
                ? 'border-white bg-forge-elevated text-white'
                : 'border-forge-border/50 bg-forge-bg/50 text-forge-muted hover:border-forge-border'
            )}
          >
            Arbitrum
          </button>
          <button
            type="button"
            onClick={() => updateConfig('chain', 'arbitrum-sepolia')}
            className={cn(
              'px-3 py-2.5 rounded-lg border text-xs font-medium transition-all',
              chainRaw === 'arbitrum-sepolia'
                ? 'border-white bg-forge-elevated text-white'
                : 'border-forge-border/50 bg-forge-bg/50 text-forge-muted hover:border-forge-border'
            )}
          >
            Arbitrum Sepolia
          </button>
          <button
            type="button"
            onClick={() => updateConfig('chain', 'ethereum-sepolia')}
            className={cn(
              'px-3 py-2.5 rounded-lg border text-xs font-medium transition-all',
              chainRaw === 'ethereum-sepolia'
                ? 'border-white bg-forge-elevated text-white'
                : 'border-forge-border/50 bg-forge-bg/50 text-forge-muted hover:border-forge-border'
            )}
          >
            Ethereum Sepolia
          </button>
        </div>
      </div>

      {/* 2. Pool info (read-only) */}
      <div>
        <label className="text-xs text-forge-muted mb-1.5 block">2. Aave V3 Pool (this chain)</label>
        <div className="p-2 rounded-lg border border-forge-border/50 bg-forge-bg/50 font-mono text-[10px] text-forge-muted break-all">
          Pool: {poolConfig.poolAddress}
        </div>
        <p className="text-[10px] text-forge-muted mt-1">
          Optional: override in generated project via env <code className="bg-forge-elevated px-1 rounded">AAVE_POOL_ADDRESS</code>.
        </p>
      </div>

      {/* 3. Test: Fetch account data */}
      <div>
        <label className="text-xs text-forge-muted mb-1.5 block">3. Test – Fetch Account Data</label>
        <p className="text-[10px] text-forge-muted mb-2">
          Enter a wallet address to preview Aave account data (collateral, debt, health factor).
        </p>
        <div className="flex gap-2">
          <Input
            type="text"
            placeholder="0x..."
            value={walletAddress}
            onChange={(e) => setWalletAddress(e.target.value)}
            className="text-xs h-8 font-mono flex-1"
          />
          <Button
            type="button"
            onClick={handleFetchAccountData}
            disabled={loading || !walletAddress || walletAddress.length !== 42}
            size="sm"
          >
            {loading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              'Fetch'
            )}
          </Button>
        </div>

        {fetched && (
          <div className="mt-3 space-y-2">
            {error && (
              <div className="flex items-start gap-2 p-2 rounded-lg bg-red-500/10 border border-red-500/20">
                <AlertCircle className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-xs font-medium text-red-400">Error</p>
                  <p className="text-[10px] text-red-300 mt-0.5">{error.message}</p>
                </div>
              </div>
            )}
            {accountData && !error && (
              <div className="p-3 rounded-lg bg-forge-elevated/50 border border-forge-border/50 space-y-2">
                <p className="text-xs font-medium text-white">Account Data</p>
                <div className="grid grid-cols-1 gap-1 text-[10px]">
                  <div className="flex justify-between">
                    <span className="text-forge-muted">Health Factor</span>
                    <span className="font-mono text-white">{accountData.healthFactor}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-forge-muted">Total Collateral (base)</span>
                    <span className="font-mono text-white">{accountData.totalCollateralBase}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-forge-muted">Total Debt (base)</span>
                    <span className="font-mono text-white">{accountData.totalDebtBase}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-forge-muted">Available to Borrow (base)</span>
                    <span className="font-mono text-white">{accountData.availableBorrowsBase}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-forge-muted">LTV</span>
                    <span className="font-mono text-white">{accountData.ltv}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-forge-muted">Liquidation Threshold</span>
                    <span className="font-mono text-white">{accountData.currentLiquidationThreshold}%</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex items-start gap-1.5 p-2 rounded bg-forge-elevated/50 border border-forge-border/30">
        <Info className="w-3 h-3 text-forge-muted shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-[10px] text-forge-muted leading-relaxed">
            Aave V3 is deployed on Arbitrum, Arbitrum Sepolia, and Ethereum Sepolia. Use the generated app to supply, borrow, withdraw, and repay.
          </p>
          <a
            href="https://github.com/try-flowforge/backend/blob/main/src/services/lending/providers/AaveProvider.ts"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] text-accent-cyan hover:underline mt-1 inline-flex items-center gap-1"
          >
            FlowForge AaveProvider reference
            <ExternalLink className="w-2.5 h-2.5" />
          </a>
        </div>
      </div>
    </div>
  );
}
