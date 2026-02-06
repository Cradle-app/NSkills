'use client';

import { useBlueprintStore } from '@/store/blueprint';
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

export function ChainAbstractionForm({ nodeId, config }: Props) {
  const { updateNodeConfig } = useBlueprintStore();

  const updateConfig = (key: string, value: unknown) => {
    updateNodeConfig(nodeId, { ...config, [key]: value });
  };

  return (
    <div className={formStyles.container}>
      <div className={formStyles.section}>
        <label className={labelStyles.base}>Supported Chains</label>
        <div className="space-y-2">
          {['arbitrum', 'ethereum', 'optimism', 'base', 'polygon'].map((chain) => (
            <div key={chain} className="flex items-center justify-between py-1">
              <span className="text-sm text-[hsl(var(--color-text-primary))] capitalize">{chain}</span>
              <Switch
                checked={((config.supportedChains as string[]) ?? ['arbitrum', 'ethereum']).includes(chain)}
                onCheckedChange={(checked) => {
                  const current = (config.supportedChains as string[]) ?? ['arbitrum', 'ethereum'];
                  updateConfig('supportedChains', checked ? [...current, chain] : current.filter((c) => c !== chain));
                }}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between py-2">
        <span className="text-sm text-[hsl(var(--color-text-primary))]">Unified Balance View</span>
        <Switch
          checked={(config.unifiedBalanceEnabled as boolean) ?? true}
          onCheckedChange={(v) => updateConfig('unifiedBalanceEnabled', v)}
        />
      </div>

      <div className="flex items-center justify-between py-2">
        <span className="text-sm text-[hsl(var(--color-text-primary))]">Auto Chain Switch</span>
        <Switch
          checked={(config.autoChainSwitch as boolean) ?? true}
          onCheckedChange={(v) => updateConfig('autoChainSwitch', v)}
        />
      </div>

      <div className={formStyles.section}>
        <label className={labelStyles.base}>Gas Payment Token</label>
        <Select
          value={(config.gasPaymentToken as string) ?? 'native'}
          onValueChange={(v) => updateConfig('gasPaymentToken', v)}
        >
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="native">Native (ETH)</SelectItem>
            <SelectItem value="usdc">USDC</SelectItem>
            <SelectItem value="usdt">USDT</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
