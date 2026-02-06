'use client';

import { useBlueprintStore } from '@/store/blueprint';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import {
  formStyles,
  labelStyles,
} from './shared-styles';

interface Props {
  nodeId: string;
  config: Record<string, unknown>;
}

export function ChainDataForm({ nodeId, config }: Props) {
  const { updateNodeConfig } = useBlueprintStore();

  const updateConfig = (key: string, value: unknown) => {
    updateNodeConfig(nodeId, { ...config, [key]: value });
  };

  return (
    <div className={formStyles.container}>
      <div className={formStyles.section}>
        <label className={labelStyles.base}>Data Provider</label>
        <Select
          value={(config.provider as string) ?? 'alchemy'}
          onValueChange={(v) => updateConfig('provider', v)}
        >
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="alchemy">Alchemy</SelectItem>
            <SelectItem value="moralis">Moralis</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className={formStyles.section}>
        <label className={labelStyles.base}>Features</label>
        <div className="space-y-2">
          {['token-balances', 'nft-data', 'transaction-history', 'price-feeds'].map((feature) => (
            <div key={feature} className="flex items-center justify-between py-1">
              <span className="text-sm text-[hsl(var(--color-text-primary))] capitalize">{feature.replace('-', ' ')}</span>
              <Switch
                checked={((config.features as string[]) ?? ['token-balances', 'nft-data']).includes(feature)}
                onCheckedChange={(checked) => {
                  const current = (config.features as string[]) ?? ['token-balances', 'nft-data'];
                  updateConfig('features', checked ? [...current, feature] : current.filter((f) => f !== feature));
                }}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between py-2">
        <span className="text-sm text-[hsl(var(--color-text-primary))]">Enable Cache</span>
        <Switch
          checked={(config.cacheEnabled as boolean) ?? true}
          onCheckedChange={(v) => updateConfig('cacheEnabled', v)}
        />
      </div>

      <div className={formStyles.section}>
        <label className={labelStyles.base}>Cache Duration (ms)</label>
        <Input
          type="number"
          value={(config.cacheDuration as number) ?? 60000}
          onChange={(e) => updateConfig('cacheDuration', parseInt(e.target.value))}
        />
      </div>
    </div>
  );
}
