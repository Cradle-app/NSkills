'use client';

import { useState } from 'react';
import { useBlueprintStore } from '@/store/blueprint';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Zap, Loader2, AlertCircle, Info, ExternalLink } from 'lucide-react';
import { getCompoundAccountData, COMPOUND_CONFIG } from '@cradle/compound-lending';
import type { CompoundAccountData } from '@cradle/compound-lending';

interface Props {
  nodeId: string;
  config: Record<string, unknown>;
}

export function CompoundLendingForm({ nodeId, config }: Props) {
  const { updateNodeConfig } = useBlueprintStore();
  const [walletAddress, setWalletAddress] = useState('');
  const [accountData, setAccountData] = useState<CompoundAccountData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [fetched, setFetched] = useState(false);

  const updateConfig = (key: string, value: unknown) => {
    updateNodeConfig(nodeId, { ...config, [key]: value });
  };

  const chain = (config.chain as string) ?? 'arbitrum';
  const cometAddress = config.cometAddress as string | undefined;

  const handleFetchAccountData = async () => {
    if (!walletAddress || walletAddress.length !== 42) return;
    setLoading(true);
    setError(null);
    setAccountData(null);
    setFetched(true);
    try {
      const result = await getCompoundAccountData({
        chain: 'arbitrum',
        walletAddress,
        cometAddress,
      });
      setAccountData(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch account data'));
    } finally {
      setLoading(false);
    }
  };

  const cometConfig = COMPOUND_CONFIG.arbitrum;

  return (
    <div className="space-y-4">
      <div className="p-3 rounded-lg border border-forge-border/50 bg-forge-bg/50">
        <div className="flex items-center gap-2 mb-2">
          <Zap className="w-4 h-4 text-accent-cyan" />
          <span className="text-sm font-medium text-white">Compound V3 Lending</span>
        </div>
        <p className="text-xs text-forge-muted">
          Supply, borrow, withdraw, and repay on Compound V3 (Comet). Supports Arbitrum cUSDCv3.
        </p>
      </div>

      {/* 1. Network (Arbitrum only) */}
      <div>
        <label className="text-xs text-forge-muted mb-1.5 block">1. Network</label>
        <div className="p-2 rounded-lg border border-forge-border/50 bg-forge-bg/50 text-sm text-white">
          Arbitrum (cUSDCv3)
        </div>
      </div>

      {/* 2. Comet address */}
      <div>
        <label className="text-xs text-forge-muted mb-1.5 block">2. Compound V3 Comet (this chain)</label>
        <div className="p-2 rounded-lg border border-forge-border/50 bg-forge-bg/50 font-mono text-[10px] text-forge-muted break-all">
          {cometAddress ?? cometConfig.cometAddress}
        </div>
        <p className="text-[10px] text-forge-muted mt-1">
          Optional: override in generated project via env <code className="bg-forge-elevated px-1 rounded">COMPOUND_COMET_ADDRESS</code>.
        </p>
      </div>

      {/* 3. Test – Fetch account data */}
      <div>
        <label className="text-xs text-forge-muted mb-1.5 block">3. Test – Fetch Account Data</label>
        <p className="text-[10px] text-forge-muted mb-2">
          Enter a wallet address to preview Compound supply/borrow balances and APYs.
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
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Fetch'}
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
                    <span className="text-forge-muted">Supply Balance</span>
                    <span className="font-mono text-white">{accountData.supplyBalance}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-forge-muted">Borrow Balance</span>
                    <span className="font-mono text-white">{accountData.borrowBalance}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-forge-muted">Supply APY</span>
                    <span className="font-mono text-white">{accountData.supplyAPY}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-forge-muted">Borrow APY</span>
                    <span className="font-mono text-white">{accountData.borrowAPY}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-forge-muted">Utilization</span>
                    <span className="font-mono text-white">{accountData.utilization}%</span>
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
            Compound V3 (Comet) on Arbitrum uses the cUSDCv3 market. Supply and borrow base asset (USDC); collateral is managed automatically.
          </p>
          <a
            href="https://github.com/try-flowforge/backend/blob/main/src/services/lending/providers/CompoundProvider.ts"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] text-accent-cyan hover:underline mt-1 inline-flex items-center gap-1"
          >
            FlowForge CompoundProvider reference
            <ExternalLink className="w-2.5 h-2.5" />
          </a>
        </div>
      </div>
    </div>
  );
}
