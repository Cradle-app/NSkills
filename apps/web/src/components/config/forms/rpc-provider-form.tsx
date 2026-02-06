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

export function RPCProviderForm({ nodeId, config }: Props) {
  const { updateNodeConfig } = useBlueprintStore();

  const updateConfig = (key: string, value: unknown) => {
    updateNodeConfig(nodeId, { ...config, [key]: value });
  };

  const providers = ['alchemy', 'quicknode', 'infura', 'ankr', '1rpc', 'public'];

  return (
    <div className={formStyles.container}>
      <div className={formStyles.section}>
        <label className={labelStyles.base}>Primary Provider</label>
        <Select
          value={(config.primaryProvider as string) ?? 'alchemy'}
          onValueChange={(v) => updateConfig('primaryProvider', v)}
        >
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {providers.map((p) => (
              <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className={formStyles.section}>
        <label className={labelStyles.base}>Fallback Providers</label>
        <div className="space-y-2">
          {providers.filter(p => p !== config.primaryProvider).map((provider) => (
            <div key={provider} className="flex items-center justify-between py-1">
              <span className="text-sm text-[hsl(var(--color-text-primary))] capitalize">{provider}</span>
              <Switch
                checked={((config.fallbackProviders as string[]) ?? ['public']).includes(provider)}
                onCheckedChange={(checked) => {
                  const current = (config.fallbackProviders as string[]) ?? ['public'];
                  updateConfig('fallbackProviders', checked ? [...current, provider] : current.filter((p) => p !== provider));
                }}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between py-2">
        <span className="text-sm text-[hsl(var(--color-text-primary))]">WebSocket Support</span>
        <Switch
          checked={(config.enableWebSocket as boolean) ?? true}
          onCheckedChange={(v) => updateConfig('enableWebSocket', v)}
        />
      </div>

      <div className={formStyles.section}>
        <label className={labelStyles.base}>Health Check Interval (ms)</label>
        <Input
          type="number"
          value={(config.healthCheckInterval as number) ?? 30000}
          onChange={(e) => updateConfig('healthCheckInterval', parseInt(e.target.value))}
        />
      </div>

      <div className="flex items-center justify-between py-2">
        <span className="text-sm text-[hsl(var(--color-text-primary))]">Privacy Mode (1RPC)</span>
        <Switch
          checked={(config.privacyMode as boolean) ?? false}
          onCheckedChange={(v) => updateConfig('privacyMode', v)}
        />
      </div>
    </div>
  );
}
