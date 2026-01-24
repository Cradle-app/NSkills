'use client';

import { useBlueprintStore } from '@/store/blueprint';
import { Switch } from '@/components/ui/switch';

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
    <div className="space-y-4">
      {/* Super Assets Selection */}
      <div>
        <label className="text-sm font-medium text-white mb-2 block">
          Super Assets
        </label>
        <div className="space-y-2">
          {SUPER_ASSETS.map((asset) => (
            <div
              key={asset.value}
              className="flex items-center justify-between p-3 rounded-lg bg-forge-bg border border-forge-border"
            >
              <div className="flex-1">
                <p className="text-sm font-medium text-white">{asset.label}</p>
                <p className="text-xs text-forge-muted">{asset.description}</p>
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

      {/* How Yield Works */}
      <div className="p-3 rounded-lg bg-forge-bg border border-forge-border">
        <p className="text-sm font-medium text-white mb-2">How Super Assets Yield Works</p>
        <div className="space-y-2 text-xs text-forge-muted">
          <div className="flex items-start gap-2">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-500 mt-1.5 flex-shrink-0" />
            <span>Yield accrues automatically just by holding Super Assets</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-500 mt-1.5 flex-shrink-0" />
            <span>Every transfer and swap also generates Utility Mining rewards</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-500 mt-1.5 flex-shrink-0" />
            <span>APY varies based on protocol revenue and activity</span>
          </div>
        </div>
      </div>

      {/* Generate Wrap/Unwrap */}
      <div className="flex items-center justify-between p-3 rounded-lg bg-forge-bg border border-forge-border">
        <div>
          <p className="text-sm font-medium text-white">Wrap/Unwrap Functions</p>
          <p className="text-xs text-forge-muted">Convert between tokens and Super Assets</p>
        </div>
        <Switch
          checked={(config.generateWrapUnwrap as boolean) ?? true}
          onCheckedChange={(checked) => handleChange('generateWrapUnwrap', checked)}
        />
      </div>

      {/* Generate Yield Tracking */}
      <div className="flex items-center justify-between p-3 rounded-lg bg-forge-bg border border-forge-border">
        <div>
          <p className="text-sm font-medium text-white">Yield Tracking</p>
          <p className="text-xs text-forge-muted">Track pending and earned yield</p>
        </div>
        <Switch
          checked={(config.generateYieldTracking as boolean) ?? true}
          onCheckedChange={(checked) => handleChange('generateYieldTracking', checked)}
        />
      </div>

      {/* Generate Balance Display */}
      <div className="flex items-center justify-between p-3 rounded-lg bg-forge-bg border border-forge-border">
        <div>
          <p className="text-sm font-medium text-white">Balance Display</p>
          <p className="text-xs text-forge-muted">UI component showing Super Asset balances</p>
        </div>
        <Switch
          checked={(config.generateBalanceDisplay as boolean) ?? true}
          onCheckedChange={(checked) => handleChange('generateBalanceDisplay', checked)}
        />
      </div>

      {/* Generate Hooks */}
      <div className="flex items-center justify-between p-3 rounded-lg bg-forge-bg border border-forge-border">
        <div>
          <p className="text-sm font-medium text-white">Generate Hooks</p>
          <p className="text-xs text-forge-muted">useSuperAsset, useSuperAssetYield, etc.</p>
        </div>
        <Switch
          checked={(config.generateHooks as boolean) ?? true}
          onCheckedChange={(checked) => handleChange('generateHooks', checked)}
        />
      </div>

      {/* Auto Compound (future feature) */}
      <div className="flex items-center justify-between p-3 rounded-lg bg-forge-bg border border-forge-border opacity-50">
        <div>
          <p className="text-sm font-medium text-white">Auto Compound</p>
          <p className="text-xs text-forge-muted">Coming soon - Auto-reinvest yield</p>
        </div>
        <Switch
          checked={false}
          disabled
        />
      </div>

      {/* Info Box */}
      <div className="p-3 rounded-lg bg-accent-cyan/10 border border-accent-cyan/20">
        <p className="text-xs text-accent-cyan">
          Super Assets pay yield for both holding AND using them. When you bridge to
          Superposition, your assets automatically become Super Assets.
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          <a
            href="https://docs.superposition.so/superposition-mainnet/super-layer/super-assets"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-accent-cyan/80 hover:text-accent-cyan underline"
          >
            Super Assets Docs
          </a>
          <a
            href="https://docs.superposition.so/superposition-mainnet/super-layer/utility-mining"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-accent-cyan/80 hover:text-accent-cyan underline"
          >
            Utility Mining
          </a>
        </div>
      </div>
    </div>
  );
}
