'use client';

import { useBlueprintStore } from '@/store/blueprint';
import { Switch } from '@/components/ui/switch';
import { Hammer, TrendingUp, Info } from 'lucide-react';
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
    <div className={formStyles.container}>
      <FormHeader
        icon={Hammer}
        title="Utility Mining"
        description="Earn SPN tokens for on-chain activity via Fluidity's TRF mechanism."
      />

      <div className={formStyles.section}>
        <div className={toggleRowStyles.row}>
          <div>
            <p className={toggleRowStyles.title}>Reward Tracking</p>
            <p className={toggleRowStyles.description}>Generate useUtilityMiningRewards hook</p>
          </div>
          <Switch
            checked={(config.generateRewardTracking as boolean) ?? true}
            onCheckedChange={(checked) => handleChange('generateRewardTracking', checked)}
          />
        </div>

        <div className={toggleRowStyles.row}>
          <div>
            <p className={toggleRowStyles.title}>Claim Function</p>
            <p className={toggleRowStyles.description}>Include reward claiming functionality</p>
          </div>
          <Switch
            checked={(config.generateClaimFunction as boolean) ?? true}
            onCheckedChange={(checked) => handleChange('generateClaimFunction', checked)}
          />
        </div>

        <div className={toggleRowStyles.row}>
          <div>
            <p className={toggleRowStyles.title}>Reward History</p>
            <p className={toggleRowStyles.description}>Fetch and display reward history</p>
          </div>
          <Switch
            checked={(config.generateRewardHistory as boolean) ?? true}
            onCheckedChange={(checked) => handleChange('generateRewardHistory', checked)}
          />
        </div>

        <div className={toggleRowStyles.row}>
          <div>
            <p className={toggleRowStyles.title}>Reward Display UI</p>
            <p className={toggleRowStyles.description}>Generate reward display component</p>
          </div>
          <Switch
            checked={(config.generateUI as boolean) ?? true}
            onCheckedChange={(checked) => handleChange('generateUI', checked)}
          />
        </div>

        <div className={toggleRowStyles.row}>
          <div>
            <p className={toggleRowStyles.title}>Leaderboard</p>
            <p className={toggleRowStyles.description}>Include leaderboard functionality</p>
          </div>
          <Switch
            checked={(config.includeLeaderboard as boolean) ?? false}
            onCheckedChange={(checked) => handleChange('includeLeaderboard', checked)}
          />
        </div>
      </div>

      <div className={formStyles.section}>
        <div className="flex items-center gap-2 mb-2">
          <TrendingUp className="w-4 h-4 text-[hsl(var(--color-text-muted))]" />
          <span className="text-xs font-semibold text-[hsl(var(--color-text-secondary))] tracking-wide uppercase">Track Transaction Types</span>
        </div>

        {TRANSACTION_TYPES.map((type) => (
          <div
            key={type.value}
            className={toggleRowStyles.row}
          >
            <div>
              <p className={toggleRowStyles.title}>{type.label}</p>
              <p className={toggleRowStyles.description}>{type.description}</p>
            </div>
            <Switch
              checked={trackTypes.includes(type.value) || (type.value !== 'all' && trackTypes.includes('all'))}
              onCheckedChange={() => handleTypeToggle(type.value)}
            />
          </div>
        ))}
      </div>

      {/* TRF Explanation */}
      <div className={cardStyles.base}>
        <div className={cardStyles.cardHeader}>
          <Info className={cn(cardStyles.cardIcon, "text-[hsl(var(--color-accent-primary))]")} />
          <span className={cardStyles.cardTitle}>Transfer Reward Function (TRF)</span>
        </div>
        <div className={cardStyles.cardList}>
          <div className={cardStyles.cardListItem}>
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-[hsl(var(--color-accent-secondary))] mt-1.5 flex-shrink-0" />
            <span>Rewards are distributed proportionally based on transaction value</span>
          </div>
          <div className={cardStyles.cardListItem}>
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-[hsl(var(--color-accent-secondary))] mt-1.5 flex-shrink-0" />
            <span>Reward amounts vary based on protocol activity and liquidity</span>
          </div>
          <div className={cardStyles.cardListItem}>
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-[hsl(var(--color-accent-secondary))] mt-1.5 flex-shrink-0" />
            <span>Rewards paid in native SPN tokens via Fluidity Money protocol</span>
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
          Utility Mining rewards users for on-chain activity. Earn SPN tokens via the TRF.
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          <a
            href="https://docs.superposition.so/superposition-mainnet/super-layer/utility-mining"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] text-[hsl(var(--color-accent-primary))] hover:underline"
          >
            Utility Mining Docs
          </a>
          <a
            href="https://docs.fluidity.money/docs/fundamentals/utility-mining"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] text-[hsl(var(--color-accent-primary))] hover:underline"
          >
            Fluidity TRF
          </a>
        </div>
      </div>
    </div>
  );
}
