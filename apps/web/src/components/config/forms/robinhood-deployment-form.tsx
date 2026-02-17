'use client';

import { useCallback } from 'react';
import { useBlueprintStore } from '@/store/blueprint';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Code, Info, ExternalLink, FileCode } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  formStyles,
  labelStyles,
  cardStyles,
  linkStyles,
  FormHeader,
} from './shared-styles';

interface Props {
  nodeId: string;
  config: Record<string, unknown>;
}

const FRAMEWORKS = [
  { value: 'hardhat', label: 'Hardhat (recommended)' },
  { value: 'foundry', label: 'Foundry' },
  { value: 'other', label: 'Other EVM framework' },
];

export function RobinhoodDeploymentForm({ nodeId, config }: Props) {
  const { updateNodeConfig } = useBlueprintStore();

  const handleChange = useCallback(
    (key: string, value: unknown) => {
      updateNodeConfig(nodeId, { [key]: value });
    },
    [nodeId, updateNodeConfig],
  );

  return (
    <div className={formStyles.container}>
      <FormHeader
        icon={Code}
        title="Robinhood Deployment Guide"
        description="Generate deployment helpers and documentation for smart contracts on Robinhood Chain."
      />

      {/* Framework selection */}
      <div className={formStyles.section}>
        <label className={labelStyles.base}>Preferred Framework</label>
        <Select
          value={(config.framework as string) || 'hardhat'}
          onValueChange={(value) => handleChange('framework', value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select framework" />
          </SelectTrigger>
          <SelectContent>
            {FRAMEWORKS.map((fw) => (
              <SelectItem key={fw.value} value={fw.value}>
                {fw.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Toggles */}
      <div className={formStyles.section}>
        <div className={cardStyles.base}>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-[hsl(var(--color-text-primary))]">Example Contract</p>
                <p className="text-[11px] text-[hsl(var(--color-text-muted))]">
                  Include the <code className="font-mono text-[10px]">HelloRobinhood</code> example contract.
                </p>
              </div>
              <Switch
                checked={(config.includeExampleContract as boolean) ?? true}
                onCheckedChange={(checked) => handleChange('includeExampleContract', checked)}
              />
            </div>

            <div className="h-px bg-[hsl(var(--color-border-subtle))]" />

            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-[hsl(var(--color-text-primary))]">Verification Steps</p>
                <p className="text-[11px] text-[hsl(var(--color-text-muted))]">
                  Add notes for verifying contracts on the Robinhood block explorer.
                </p>
              </div>
              <Switch
                checked={(config.includeVerificationSteps as boolean) ?? true}
                onCheckedChange={(checked) => handleChange('includeVerificationSteps', checked)}
              />
            </div>

            <div className="h-px bg-[hsl(var(--color-border-subtle))]" />

            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-[hsl(var(--color-text-primary))]">Deployment Scripts</p>
                <p className="text-[11px] text-[hsl(var(--color-text-muted))]">
                  Generate example deployment scripts for the selected framework.
                </p>
              </div>
              <Switch
                checked={(config.includeScripts as boolean) ?? true}
                onCheckedChange={(checked) => handleChange('includeScripts', checked)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Output path */}
      <div className={formStyles.section}>
        <label className={labelStyles.base}>Output Folder</label>
        <Input
          value={(config.outputPath as string) || 'robinhood'}
          onChange={(e) => handleChange('outputPath', e.target.value || 'robinhood')}
          placeholder="robinhood"
        />
        <p className={labelStyles.helper}>
          Relative folder where deployment guides and example scripts will be written inside your generated repo.
        </p>
      </div>

      {/* Guide summary */}
      <div className={cardStyles.info}>
        <div className={cardStyles.cardHeader}>
          <FileCode className={cn(cardStyles.cardIcon, 'text-[hsl(var(--color-info))]')} />
          <span className={cardStyles.cardTitle}>Deployment Flow (Hardhat)</span>
        </div>
        <p className={cardStyles.cardBody}>
          The generated guide will follow the official Robinhood Chain documentation: add the testnet network, compile
          your contracts, and deploy using the configured network.
        </p>
        <ul className={cardStyles.cardList}>
          <li className={cardStyles.cardListItem}>
            <span className={cardStyles.cardBody}>1. Configure the Robinhood testnet in your Hardhat or Foundry config.</span>
          </li>
          <li className={cardStyles.cardListItem}>
            <span className={cardStyles.cardBody}>2. Deploy contracts using the <code className="font-mono text-[10px]">robinhood</code> network.</span>
          </li>
          <li className={cardStyles.cardListItem}>
            <span className={cardStyles.cardBody}>3. Verify contracts on the Robinhood testnet explorer.</span>
          </li>
        </ul>

        <div className="mt-3 flex flex-wrap gap-2">
          <a
            href="https://explorer.testnet.chain.robinhood.com"
            target="_blank"
            rel="noopener noreferrer"
            className={linkStyles.external}
          >
            <ExternalLink className={linkStyles.linkIcon} />
            Block Explorer
          </a>
          <a
            href="https://rpc.testnet.chain.robinhood.com"
            target="_blank"
            rel="noopener noreferrer"
            className={linkStyles.external}
          >
            <ExternalLink className={linkStyles.linkIcon} />
            RPC Endpoint
          </a>
        </div>

        <div className="mt-2 flex flex-wrap gap-2">
          <a
            href="https://rpc.testnet.chain.robinhood.com"
            target="_blank"
            rel="noopener noreferrer"
            className={linkStyles.inline}
          >
            <Info className="w-3 h-3" />
            <span>Deployment guide will embed Hardhat config and example script snippets.</span>
          </a>
        </div>
      </div>
    </div>
  );
}

