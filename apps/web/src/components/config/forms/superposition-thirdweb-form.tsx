'use client';

import { useBlueprintStore } from '@/store/blueprint';
import { Switch } from '@/components/ui/switch';

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
    <div className="space-y-4">
      {/* Features */}
      <div className="space-y-2">
        <p className="text-sm font-medium text-white mb-2">Features</p>
        {FEATURES.map((feature) => (
          <div
            key={feature.value}
            className="flex items-center justify-between p-3 rounded-lg bg-forge-bg border border-forge-border"
          >
            <div>
              <p className="text-sm font-medium text-white">{feature.label}</p>
              <p className="text-xs text-forge-muted">{feature.description}</p>
            </div>
            <Switch
              checked={features.includes(feature.value)}
              onCheckedChange={() => handleFeatureToggle(feature.value)}
            />
          </div>
        ))}
      </div>

      {/* Generate Thirdweb Provider */}
      <div className="flex items-center justify-between p-3 rounded-lg bg-forge-bg border border-forge-border">
        <div>
          <p className="text-sm font-medium text-white">Thirdweb Provider</p>
          <p className="text-xs text-forge-muted">Generate provider component</p>
        </div>
        <Switch
          checked={(config.generateThirdwebProvider as boolean) ?? true}
          onCheckedChange={(checked) => handleChange('generateThirdwebProvider', checked)}
        />
      </div>

      {/* Generate Deploy Helpers */}
      <div className="flex items-center justify-between p-3 rounded-lg bg-forge-bg border border-forge-border">
        <div>
          <p className="text-sm font-medium text-white">Deploy Helpers</p>
          <p className="text-xs text-forge-muted">Generate deployment hooks</p>
        </div>
        <Switch
          checked={(config.generateDeployHelpers as boolean) ?? true}
          onCheckedChange={(checked) => handleChange('generateDeployHelpers', checked)}
        />
      </div>

      {/* Generate Contract Hooks */}
      <div className="flex items-center justify-between p-3 rounded-lg bg-forge-bg border border-forge-border">
        <div>
          <p className="text-sm font-medium text-white">Contract Hooks</p>
          <p className="text-xs text-forge-muted">Generate contract interaction hooks</p>
        </div>
        <Switch
          checked={(config.generateContractHooks as boolean) ?? true}
          onCheckedChange={(checked) => handleChange('generateContractHooks', checked)}
        />
      </div>

      {/* Include Prebuilt Contracts */}
      <div className="flex items-center justify-between p-3 rounded-lg bg-forge-bg border border-forge-border">
        <div>
          <p className="text-sm font-medium text-white">Prebuilt Contracts</p>
          <p className="text-xs text-forge-muted">Include prebuilt contract configs</p>
        </div>
        <Switch
          checked={(config.includePrebuiltContracts as boolean) ?? true}
          onCheckedChange={(checked) => handleChange('includePrebuiltContracts', checked)}
        />
      </div>

      {/* Gasless Transactions */}
      <div className="flex items-center justify-between p-3 rounded-lg bg-forge-bg border border-forge-border">
        <div>
          <p className="text-sm font-medium text-white">Gasless Mode</p>
          <p className="text-xs text-forge-muted">Enable gasless transactions</p>
        </div>
        <Switch
          checked={(config.gasless as boolean) ?? false}
          onCheckedChange={(checked) => handleChange('gasless', checked)}
        />
      </div>

      {/* Info Box */}
      <div className="p-3 rounded-lg bg-accent-cyan/10 border border-accent-cyan/20">
        <p className="text-xs text-accent-cyan">
          Deploy and interact with smart contracts on Superposition using Thirdweb SDK v5.
          Requires a Thirdweb client ID from thirdweb.com/dashboard
        </p>
      </div>
    </div>
  );
}
