'use client';

import { useBlueprintStore } from '@/store/blueprint';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import {
  formStyles,
  labelStyles,
} from './shared-styles';

interface Props {
  nodeId: string;
  config: Record<string, unknown>;
}

export function ZKPrimitivesForm({ nodeId, config }: Props) {
  const { updateNodeConfig } = useBlueprintStore();

  const updateConfig = (key: string, value: unknown) => {
    updateNodeConfig(nodeId, { ...config, [key]: value });
  };

  return (
    <div className={formStyles.container}>
      <div className={formStyles.section}>
        <label className={labelStyles.base}>Proof Types</label>
        <div className="space-y-2">
          {['membership', 'range', 'semaphore'].map((proofType) => (
            <div key={proofType} className="flex items-center justify-between py-1">
              <div>
                <span className="text-sm text-[hsl(var(--color-text-primary))] capitalize">{proofType}</span>
                <p className="text-xs text-[hsl(var(--color-text-muted))]">
                  {proofType === 'membership' && 'Prove membership in a set'}
                  {proofType === 'range' && 'Prove value is in a range'}
                  {proofType === 'semaphore' && 'Anonymous signaling'}
                </p>
              </div>
              <Switch
                checked={((config.proofTypes as string[]) ?? ['membership']).includes(proofType)}
                onCheckedChange={(checked) => {
                  const current = (config.proofTypes as string[]) ?? ['membership'];
                  updateConfig('proofTypes', checked ? [...current, proofType] : current.filter((p) => p !== proofType));
                }}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between py-2">
        <span className="text-sm text-[hsl(var(--color-text-primary))]">Client-side Proving</span>
        <Switch
          checked={(config.clientSideProving as boolean) ?? true}
          onCheckedChange={(v) => updateConfig('clientSideProving', v)}
        />
      </div>

      <div className="flex items-center justify-between py-2">
        <span className="text-sm text-[hsl(var(--color-text-primary))]">Generate Verifier Contracts</span>
        <Switch
          checked={(config.generateVerifiers as boolean) ?? true}
          onCheckedChange={(v) => updateConfig('generateVerifiers', v)}
        />
      </div>
    </div>
  );
}
