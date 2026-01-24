'use client';

import { useBlueprintStore } from '@/store/blueprint';
import { Switch } from '@/components/ui/switch';

interface Props {
  nodeId: string;
  config: Record<string, unknown>;
}

const TRANSACTION_TYPES = [
  { value: 'all', label: 'All Transactions', description: 'Track all transaction types' },
  { value: 'swap', label: 'Swaps', description: 'Token swap transactions' },
  { value: 'transfer', label: 'Transfers', description: 'Token transfer transactions' },
  { value: 'nft-purchase', label: 'NFT Purchases', description: 'NFT buy transactions' },
  { value: 'liquidity', label: 'Liquidity', description: 'LP provision transactions' },
];

export function SuperpositionUtilityMiningForm({ nodeId, config }: Props) {
  const { updateNodeConfig } = useBlueprintStore();

  const handleChange = (key: string, value: unknown) => {
    updateNodeConfig(nodeId, { [key]: value });
  };

  const trackTypes = (config.trackTransactionTypes as string[]) || ['all'];

  const handleTypeToggle = (type: string) => {
    if (type === 'all') {
      // Toggle between 'all' and individual types
      if (trackTypes.includes('all')) {
        handleChange('trackTransactionTypes', ['swap', 'transfer']);
      } else {
        handleChange('trackTransactionTypes', ['all']);
      }
      return;
    }

    // Remove 'all' if selecting individual types
    let currentTypes = trackTypes.filter((t) => t !== 'all');
    
    if (currentTypes.includes(type)) {
      currentTypes = currentTypes.filter((t) => t !== type);
    } else {
      currentTypes = [...currentTypes, type];
    }

    // If all individual types selected, switch back to 'all'
    if (currentTypes.length === TRANSACTION_TYPES.length - 1) {
      handleChange('trackTransactionTypes', ['all']);
    } else {
      handleChange('trackTransactionTypes', currentTypes);
    }
  };

  return (
    <div className="space-y-4">
      {/* Generate Reward Tracking */}
      <div className="flex items-center justify-between p-3 rounded-lg bg-forge-bg border border-forge-border">
        <div>
          <p className="text-sm font-medium text-white">Reward Tracking</p>
          <p className="text-xs text-forge-muted">Generate useUtilityMiningRewards hook</p>
        </div>
        <Switch
          checked={(config.generateRewardTracking as boolean) ?? true}
          onCheckedChange={(checked) => handleChange('generateRewardTracking', checked)}
        />
      </div>

      {/* Generate Claim Function */}
      <div className="flex items-center justify-between p-3 rounded-lg bg-forge-bg border border-forge-border">
        <div>
          <p className="text-sm font-medium text-white">Claim Function</p>
          <p className="text-xs text-forge-muted">Include reward claiming functionality</p>
        </div>
        <Switch
          checked={(config.generateClaimFunction as boolean) ?? true}
          onCheckedChange={(checked) => handleChange('generateClaimFunction', checked)}
        />
      </div>

      {/* Generate Reward History */}
      <div className="flex items-center justify-between p-3 rounded-lg bg-forge-bg border border-forge-border">
        <div>
          <p className="text-sm font-medium text-white">Reward History</p>
          <p className="text-xs text-forge-muted">Fetch and display reward history</p>
        </div>
        <Switch
          checked={(config.generateRewardHistory as boolean) ?? true}
          onCheckedChange={(checked) => handleChange('generateRewardHistory', checked)}
        />
      </div>

      {/* Generate UI */}
      <div className="flex items-center justify-between p-3 rounded-lg bg-forge-bg border border-forge-border">
        <div>
          <p className="text-sm font-medium text-white">Reward Display UI</p>
          <p className="text-xs text-forge-muted">Generate reward display component</p>
        </div>
        <Switch
          checked={(config.generateUI as boolean) ?? true}
          onCheckedChange={(checked) => handleChange('generateUI', checked)}
        />
      </div>

      {/* Transaction Types */}
      <div className="space-y-2">
        <p className="text-sm font-medium text-white mb-2">Track Transaction Types</p>
        {TRANSACTION_TYPES.map((type) => (
          <div
            key={type.value}
            className="flex items-center justify-between p-3 rounded-lg bg-forge-bg border border-forge-border"
          >
            <div>
              <p className="text-sm font-medium text-white">{type.label}</p>
              <p className="text-xs text-forge-muted">{type.description}</p>
            </div>
            <Switch
              checked={trackTypes.includes(type.value) || (type.value !== 'all' && trackTypes.includes('all'))}
              onCheckedChange={() => handleTypeToggle(type.value)}
            />
          </div>
        ))}
      </div>

      {/* TRF Explanation */}
      <div className="p-3 rounded-lg bg-forge-bg border border-forge-border">
        <p className="text-sm font-medium text-white mb-2">Transfer Reward Function (TRF)</p>
        <div className="space-y-2 text-xs text-forge-muted">
          <div className="flex items-start gap-2">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-purple-500 mt-1.5 flex-shrink-0" />
            <span>Rewards are distributed proportionally based on transaction value</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-purple-500 mt-1.5 flex-shrink-0" />
            <span>Reward amounts vary based on protocol activity and liquidity</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-purple-500 mt-1.5 flex-shrink-0" />
            <span>Rewards paid in native SPN tokens via Fluidity Money protocol</span>
          </div>
        </div>
      </div>

      {/* Include Leaderboard */}
      <div className="flex items-center justify-between p-3 rounded-lg bg-forge-bg border border-forge-border">
        <div>
          <p className="text-sm font-medium text-white">Leaderboard</p>
          <p className="text-xs text-forge-muted">Include leaderboard functionality</p>
        </div>
        <Switch
          checked={(config.includeLeaderboard as boolean) ?? false}
          onCheckedChange={(checked) => handleChange('includeLeaderboard', checked)}
        />
      </div>

      {/* Info Box */}
      <div className="p-3 rounded-lg bg-accent-cyan/10 border border-accent-cyan/20">
        <p className="text-xs text-accent-cyan">
          Utility Mining rewards users for on-chain activity. Earn SPN tokens for swaps,
          transfers, and other transactions on Superposition via the TRF (Transfer Reward Function).
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          <a
            href="https://docs.superposition.so/superposition-mainnet/super-layer/utility-mining"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-accent-cyan/80 hover:text-accent-cyan underline"
          >
            Utility Mining Docs
          </a>
          <a
            href="https://docs.fluidity.money/docs/fundamentals/utility-mining"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-accent-cyan/80 hover:text-accent-cyan underline"
          >
            Fluidity TRF
          </a>
        </div>
      </div>
    </div>
  );
}
