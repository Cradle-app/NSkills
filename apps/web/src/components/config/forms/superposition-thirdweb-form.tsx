'use client';

import { useBlueprintStore } from '@/store/blueprint';
import { Switch } from '@/components/ui/switch';
import { Hexagon, Wrench, FileCode, CheckCircle2, Zap, Info } from 'lucide-react';
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

const FEATURES = [
  { value: 'deploy-contract', label: 'Deploy Contracts', description: 'Standard contract deployment' },
  { value: 'deploy-published', label: 'Deploy Published', description: 'Deploy from Thirdweb registry' },
  { value: 'contract-interaction', label: 'Contract Interaction', description: 'Read/write contract hooks' },
  { value: 'nft-drops', label: 'NFT Drops', description: 'NFT collection & drop contracts' },
  { value: 'token-drops', label: 'Token Drops', description: 'ERC20 token drop contracts' },
];

export function SuperpositionThirdwebForm({ nodeId, config }: Props) {
  const { updateNodeConfig } = useBlueprintStore();

  const handleChange = (key: string, value: unknown) => {
    updateNodeConfig(nodeId, { [key]: value });
  };

  const features = (config.features as string[]) || ['deploy-contract', 'contract-interaction'];

  const handleFeatureToggle = (feature: string) => {
    const currentFeatures = features;
    const newFeatures = currentFeatures.includes(feature)
      ? currentFeatures.filter((f) => f !== feature)
      : [...currentFeatures, feature];
    handleChange('features', newFeatures);
  };

  return (
    <div className={formStyles.container}>
      <FormHeader
        icon={Hexagon}
        title="Thirdweb SDK"
        description="Integrate Thirdweb for streamlined contract deployment and interaction."
      />

      {/* Features */}
      <div className={formStyles.section}>
        <div className="flex items-center gap-2 mb-2">
          <Wrench className="w-4 h-4 text-[hsl(var(--color-text-muted))]" />
          <span className="text-xs font-semibold text-[hsl(var(--color-text-secondary))] tracking-wide uppercase">Features</span>
        </div>
        <div className="space-y-2">
          {FEATURES.map((feature) => (
            <div
              key={feature.value}
              className={toggleRowStyles.row}
            >
              <div>
                <p className={toggleRowStyles.title}>{feature.label}</p>
                <p className={toggleRowStyles.description}>{feature.description}</p>
              </div>
              <Switch
                checked={features.includes(feature.value)}
                onCheckedChange={() => handleFeatureToggle(feature.value)}
              />
            </div>
          ))}
        </div>
      </div>

      <div className={formStyles.section}>
        <div className={toggleRowStyles.row}>
          <div>
            <p className={toggleRowStyles.title}>Thirdweb Provider</p>
            <p className={toggleRowStyles.description}>Generate provider component</p>
          </div>
          <Switch
            checked={(config.generateThirdwebProvider as boolean) ?? true}
            onCheckedChange={(checked) => handleChange('generateThirdwebProvider', checked)}
          />
        </div>

        <div className={toggleRowStyles.row}>
          <div>
            <p className={toggleRowStyles.title}>Deploy Helpers</p>
            <p className={toggleRowStyles.description}>Generate deployment hooks</p>
          </div>
          <Switch
            checked={(config.generateDeployHelpers as boolean) ?? true}
            onCheckedChange={(checked) => handleChange('generateDeployHelpers', checked)}
          />
        </div>

        <div className={toggleRowStyles.row}>
          <div>
            <p className={toggleRowStyles.title}>Contract Hooks</p>
            <p className={toggleRowStyles.description}>Generate contract interaction hooks</p>
          </div>
          <Switch
            checked={(config.generateContractHooks as boolean) ?? true}
            onCheckedChange={(checked) => handleChange('generateContractHooks', checked)}
          />
        </div>

        <div className={toggleRowStyles.row}>
          <div>
            <p className={toggleRowStyles.title}>Prebuilt Contracts</p>
            <p className={toggleRowStyles.description}>Include prebuilt contract configs</p>
          </div>
          <Switch
            checked={(config.includePrebuiltContracts as boolean) ?? true}
            onCheckedChange={(checked) => handleChange('includePrebuiltContracts', checked)}
          />
        </div>

        <div className={toggleRowStyles.row}>
          <div>
            <p className={toggleRowStyles.title}>Gasless Mode</p>
            <p className={toggleRowStyles.description}>Enable gasless transactions</p>
          </div>
          <Switch
            checked={(config.gasless as boolean) ?? false}
            onCheckedChange={(checked) => handleChange('gasless', checked)}
          />
        </div>
      </div>

      {/* Info Box */}
      <div className={cardStyles.info}>
        <div className={cardStyles.cardHeader}>
          <Info className={cn(cardStyles.cardIcon, 'text-[hsl(var(--color-info))]')} />
          <span className={cardStyles.cardTitle}>Requirement</span>
        </div>
        <p className={cardStyles.cardBody}>
          Deploy and interact with smart contracts on Superposition using Thirdweb SDK v5.
          Requires a Thirdweb client ID from thirdweb.com/dashboard
        </p>
      </div>
    </div>
  );
}
