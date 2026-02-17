'use client';

import { useCallback } from 'react';
import { useBlueprintStore } from '@/store/blueprint';
import { Switch } from '@/components/ui/switch';
import { Info, ListChecks, Database } from 'lucide-react';
import {
  formStyles,
  toggleRowStyles,
  cardStyles,
  codeStyles,
  FormHeader,
} from './shared-styles';

interface Props {
  nodeId: string;
  config: Record<string, unknown>;
}

export function RobinhoodContractsForm({ nodeId, config }: Props) {
  const { updateNodeConfig } = useBlueprintStore();

  const handleChange = useCallback(
    (key: string, value: unknown) => {
      updateNodeConfig(nodeId, { [key]: value });
    },
    [nodeId, updateNodeConfig],
  );

  const includeTokenContracts = (config.includeTokenContracts as boolean) ?? true;
  const includeCoreContracts = (config.includeCoreContracts as boolean) ?? true;
  const includeBridgeContracts = (config.includeBridgeContracts as boolean) ?? true;
  const includePrecompiles = (config.includePrecompiles as boolean) ?? true;
  const includeMiscContracts = (config.includeMiscContracts as boolean) ?? true;
  const generateTypes = (config.generateTypes as boolean) ?? true;
  const generateDocs = (config.generateDocs as boolean) ?? true;

  return (
    <div className={formStyles.container}>
      <FormHeader
        icon={Database}
        title="Robinhood Contract Addresses"
        description="Select which contract groups to expose as typed constants for Robinhood Chain."
      />

      {/* Selection toggles */}
      <div className={formStyles.section}>
        <div className={cardStyles.base}>
          <div className="space-y-3">
            <div className={toggleRowStyles.row}>
              <div>
                <p className={toggleRowStyles.title}>Token Contracts</p>
                <p className={toggleRowStyles.description}>Include WETH and stock token addresses (TSLA, AMZN, etc.).</p>
              </div>
              <Switch
                checked={includeTokenContracts}
                onCheckedChange={(checked) => handleChange('includeTokenContracts', checked)}
              />
            </div>

            <div className={toggleRowStyles.row}>
              <div>
                <p className={toggleRowStyles.title}>Core Protocol Contracts</p>
                <p className={toggleRowStyles.description}>Rollup, sequencer inbox, and admin contracts on Ethereum L1.</p>
              </div>
              <Switch
                checked={includeCoreContracts}
                onCheckedChange={(checked) => handleChange('includeCoreContracts', checked)}
              />
            </div>

            <div className={toggleRowStyles.row}>
              <div>
                <p className={toggleRowStyles.title}>Bridge Contracts</p>
                <p className={toggleRowStyles.description}>Token bridge gateways and routers on L1 and L2.</p>
              </div>
              <Switch
                checked={includeBridgeContracts}
                onCheckedChange={(checked) => handleChange('includeBridgeContracts', checked)}
              />
            </div>

            <div className={toggleRowStyles.row}>
              <div>
                <p className={toggleRowStyles.title}>Precompiles</p>
                <p className={toggleRowStyles.description}>Arbitrum system precompiles shared across Orbit chains.</p>
              </div>
              <Switch
                checked={includePrecompiles}
                onCheckedChange={(checked) => handleChange('includePrecompiles', checked)}
              />
            </div>

            <div className={toggleRowStyles.row}>
              <div>
                <p className={toggleRowStyles.title}>Misc Contracts</p>
                <p className={toggleRowStyles.description}>Additional helper contracts such as Multicall.</p>
              </div>
              <Switch
                checked={includeMiscContracts}
                onCheckedChange={(checked) => handleChange('includeMiscContracts', checked)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Output options */}
      <div className={formStyles.section}>
        <div className={cardStyles.base}>
          <div className={toggleRowStyles.row}>
            <div>
              <p className={toggleRowStyles.title}>Generate Types</p>
              <p className={toggleRowStyles.description}>Emit TypeScript types for contract maps and addresses.</p>
            </div>
            <Switch
              checked={generateTypes}
              onCheckedChange={(checked) => handleChange('generateTypes', checked)}
            />
          </div>

          <div className={toggleRowStyles.row}>
            <div>
              <p className={toggleRowStyles.title}>Generate Docs</p>
              <p className={toggleRowStyles.description}>Create a markdown overview of all included contracts.</p>
            </div>
            <Switch
              checked={generateDocs}
              onCheckedChange={(checked) => handleChange('generateDocs', checked)}
            />
          </div>
        </div>
      </div>

      {/* Address preview cards */}
      <div className={formStyles.section}>
        <div className={cardStyles.base}>
          <div className={cardStyles.cardHeader}>
            <ListChecks className={cardStyles.cardIcon} />
            <span className={cardStyles.cardTitle}>Token Contracts (L2)</span>
          </div>
          <p className={cardStyles.cardBody}>Subset of token contracts deployed on Robinhood Chain Testnet.</p>
          <div className="space-y-1.5 text-xs font-mono mt-2">
            <div className="flex justify-between">
              <span className="text-[hsl(var(--color-text-muted))]">WETH:</span>
              <span className={codeStyles.inline}>0x7943e237c7F95DA44E0301572D358911207852Fa</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[hsl(var(--color-text-muted))]">TSLA:</span>
              <span className={codeStyles.inline}>0xC9f9c86933092BbbfFF3CCb4b105A4A94bf3Bd4E</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[hsl(var(--color-text-muted))]">AMZN:</span>
              <span className={codeStyles.inline}>0x5884aD2f920c162CFBbACc88C9C51AA75eC09E02</span>
            </div>
          </div>
        </div>
      </div>

      <div className={formStyles.section}>
        <div className={cardStyles.info}>
          <div className={cardStyles.cardHeader}>
            <Info className={cardStyles.cardIcon} />
            <span className={cardStyles.cardTitle}>Data Source</span>
          </div>
          <p className={cardStyles.cardBody}>
            Contract addresses are sourced from the official Robinhood Chain documentation and are fixed per network.
            The generator will group them into strongly typed maps for easy consumption in your frontend and scripts.
          </p>
        </div>
      </div>
    </div>
  );
}

