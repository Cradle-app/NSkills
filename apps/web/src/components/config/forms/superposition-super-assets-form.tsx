'use client';

import { useBlueprintStore } from '@/store/blueprint';
import { Switch } from '@/components/ui/switch';
import { Gem, TrendingUp, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  formStyles,
  toggleRowStyles,
  cardStyles,
  FormHeader
} from './shared-styles';

interface Props {
  nodeId: string;
  config: Record<string, unknown>;
}

const SUPER_ASSETS = [
  { value: 'sUSDC', label: 'sUSDC', description: 'Super USDC - Yield-bearing USDC', underlying: 'USDC' },
  { value: 'sETH', label: 'sETH', description: 'Super ETH - Yield-bearing ETH', underlying: 'ETH' },
  { value: 'sWETH', label: 'sWETH', description: 'Super WETH - Yield-bearing WETH', underlying: 'WETH' },
  { value: 'all', label: 'All Assets', description: 'Include all Super Assets', underlying: 'All' },
];

export function SuperpositionSuperAssetsForm({ nodeId, config }: Props) {
  const { updateNodeConfig } = useBlueprintStore();

  const handleChange = (key: string, value: unknown) => {
    updateNodeConfig(nodeId, { [key]: value });
  };

  const toggleAsset = (asset: string) => {
    const currentAssets = (config.assets as string[]) || ['sUSDC', 'sETH'];

    if (asset === 'all') {
      // Toggle all
      if (currentAssets.includes('all')) {
        handleChange('assets', ['sUSDC', 'sETH']);
      } else {
        handleChange('assets', ['all']);
      }
      return;
    }

    // Remove 'all' if selecting individual assets
    let newAssets = currentAssets.filter(a => a !== 'all');

    if (newAssets.includes(asset)) {
      newAssets = newAssets.filter(a => a !== asset);
    } else {
      newAssets = [...newAssets, asset];
    }

    handleChange('assets', newAssets.length > 0 ? newAssets : ['sUSDC']);
  };

  const currentAssets = (config.assets as string[]) || ['sUSDC', 'sETH'];

  return (
    <div className={formStyles.container}>
      <FormHeader
        icon={Gem}
        title="Super Assets"
        description="Configure yield-bearing assets (sUSDC, sETH) that automatically earn rewards."
      />

      {/* Super Assets Selection */}
      <div className={formStyles.section}>
        <div className="flex items-center gap-2 mb-2">
          <Gem className="w-4 h-4 text-[hsl(var(--color-text-muted))]" />
          <span className="text-xs font-semibold text-[hsl(var(--color-text-secondary))] tracking-wide uppercase">Select Assets</span>
        </div>

        <div className="space-y-2">
          {SUPER_ASSETS.map((asset) => (
            <div
              key={asset.value}
              className={toggleRowStyles.row}
            >
              <div className="flex-1">
                <p className={toggleRowStyles.title}>{asset.label}</p>
                <p className={toggleRowStyles.description}>{asset.description}</p>
              </div>
              <Switch
                checked={
                  asset.value === 'all'
                    ? currentAssets.includes('all')
                    : currentAssets.includes(asset.value) || currentAssets.includes('all')
                }
                onCheckedChange={() => toggleAsset(asset.value)}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Configuration Toggles */}
      <div className={formStyles.section}>
        <div className={toggleRowStyles.row}>
          <div>
            <p className={toggleRowStyles.title}>Wrap/Unwrap Functions</p>
            <p className={toggleRowStyles.description}>Convert between tokens and Super Assets</p>
          </div>
          <Switch
            checked={(config.generateWrapUnwrap as boolean) ?? true}
            onCheckedChange={(checked) => handleChange('generateWrapUnwrap', checked)}
          />
        </div>

        <div className={toggleRowStyles.row}>
          <div>
            <p className={toggleRowStyles.title}>Yield Tracking</p>
            <p className={toggleRowStyles.description}>Track pending and earned yield</p>
          </div>
          <Switch
            checked={(config.generateYieldTracking as boolean) ?? true}
            onCheckedChange={(checked) => handleChange('generateYieldTracking', checked)}
          />
        </div>

        <div className={toggleRowStyles.row}>
          <div>
            <p className={toggleRowStyles.title}>Balance Display</p>
            <p className={toggleRowStyles.description}>UI component showing Super Asset balances</p>
          </div>
          <Switch
            checked={(config.generateBalanceDisplay as boolean) ?? true}
            onCheckedChange={(checked) => handleChange('generateBalanceDisplay', checked)}
          />
        </div>

        <div className={toggleRowStyles.row}>
          <div>
            <p className={toggleRowStyles.title}>Generate Hooks</p>
            <p className={toggleRowStyles.description}>useSuperAsset, useSuperAssetYield, etc.</p>
          </div>
          <Switch
            checked={(config.generateHooks as boolean) ?? true}
            onCheckedChange={(checked) => handleChange('generateHooks', checked)}
          />
        </div>

        {/* Auto Compound (future feature) */}
        <div className={cn(toggleRowStyles.row, "opacity-50 cursor-not-allowed")}>
          <div>
            <p className={toggleRowStyles.title}>Auto Compound</p>
            <p className={toggleRowStyles.description}>Coming soon - Auto-reinvest yield</p>
          </div>
          <Switch
            checked={false}
            disabled
          />
        </div>
      </div>

      {/* How Yield Works */}
      <div className={cardStyles.base}>
        <div className={cardStyles.cardHeader}>
          <TrendingUp className={cn(cardStyles.cardIcon, 'text-[hsl(var(--color-success))]')} />
          <span className={cardStyles.cardTitle}>How Super Assets Yield Works</span>
        </div>
        <div className={cardStyles.cardList}>
          <div className={cardStyles.cardListItem}>
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-[hsl(var(--color-success))] mt-1.5 flex-shrink-0" />
            <span>Yield accrues automatically just by holding Super Assets</span>
          </div>
          <div className={cardStyles.cardListItem}>
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-[hsl(var(--color-success))] mt-1.5 flex-shrink-0" />
            <span>Every transfer and swap also generates Utility Mining rewards</span>
          </div>
          <div className={cardStyles.cardListItem}>
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-[hsl(var(--color-success))] mt-1.5 flex-shrink-0" />
            <span>APY varies based on protocol revenue and activity</span>
          </div>
        </div>
      </div>

      {/* Info Box */}
      <div className={cardStyles.info}>
        <div className={cardStyles.cardHeader}>
          <Info className={cn(cardStyles.cardIcon, 'text-[hsl(var(--color-info))]')} />
          <span className={cardStyles.cardTitle}>Documentation</span>
        </div>
        <p className={cardStyles.cardBody}>
          Super Assets pay yield for both holding AND using them.
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          <a
            href="https://docs.superposition.so/superposition-mainnet/super-layer/super-assets"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] text-[hsl(var(--color-accent-primary))] hover:underline"
          >
            Super Assets Docs
          </a>
          <a
            href="https://docs.superposition.so/superposition-mainnet/super-layer/utility-mining"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] text-[hsl(var(--color-accent-primary))] hover:underline"
          >
            Utility Mining
          </a>
        </div>
      </div>
    </div>
  );
}
