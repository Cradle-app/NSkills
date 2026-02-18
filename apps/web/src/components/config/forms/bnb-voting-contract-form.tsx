'use client';

import { useState, useEffect } from 'react';
import { ShieldCheck } from 'lucide-react';
import { VotingInteractionPanel } from '@/components/contract-interactions/VotingInteractionPanel';
import { useBlueprintStore } from '@/store/blueprint';
import { cn } from '@/lib/utils';
import { formStyles, labelStyles, cardStyles, FormHeader } from './shared-styles';

interface Props {
  nodeId: string;
  config: Record<string, unknown>;
}

const DEFAULT_VOTING_ADDRESS = '0x8a64dFb64A71AfD00F926064E1f2a0B9a7cBe7dD';

export function BnbVotingContractForm({ nodeId, config }: Props) {
  const { updateNodeConfig } = useBlueprintStore();

  const configuredAddress = (config.contractAddress as string | undefined) || DEFAULT_VOTING_ADDRESS;
  const [localAddress, setLocalAddress] = useState(configuredAddress);

  useEffect(() => {
    setLocalAddress(configuredAddress);
  }, [configuredAddress]);

  const handleBlur = () => {
    if (!localAddress) return;
    updateNodeConfig(nodeId, {
      ...config,
      contractAddress: localAddress,
    });
  };

  return (
    <div className={formStyles.container}>
      <FormHeader
        icon={ShieldCheck}
        title="BNB Voting Contract"
        description="Interact with a deployed Voting.sol governance contract on BNB Smart Chain Testnet."
        variant="primary"
      />

      {/* Contract configuration */}
      <div className={cardStyles.base}>
        <div className="space-y-2">
          <label className={cn(labelStyles.base, 'mb-0')}>
            <span>Contract address (BNB Testnet)</span>
          </label>
          <input
            type="text"
            value={localAddress}
            onChange={(e) => setLocalAddress(e.target.value)}
            onBlur={handleBlur}
            placeholder={DEFAULT_VOTING_ADDRESS}
            className="w-full px-3 py-2 text-xs rounded-lg bg-[hsl(var(--color-bg-base))] border border-[hsl(var(--color-border-default))] text-[hsl(var(--color-text-primary))] placeholder-[hsl(var(--color-text-muted))] focus:outline-none focus:border-[hsl(var(--color-accent-primary))] focus:ring-2 focus:ring-[hsl(var(--color-accent-primary)/0.15)] font-mono"
          />
          <p className={labelStyles.helper}>
            Defaults to the deployed Voting.sol contract on BNB Smart Chain Testnet. You can paste
            a different address if you have your own deployment.
          </p>
        </div>
      </div>

      {/* Live interaction panel */}
      <div className={cardStyles.base}>
        <VotingInteractionPanel contractAddress={localAddress} />
      </div>
    </div>
  );
}

