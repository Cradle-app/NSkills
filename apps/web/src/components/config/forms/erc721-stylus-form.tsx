'use client';

import { ERC721InteractionPanel } from '@/components/contract-interactions/ERC721InteractionPanel';

interface Props {
  nodeId: string;
  config: Record<string, unknown>;
}

export function ERC721StylusForm({ nodeId, config }: Props) {
  // Get config values with defaults
  const contractAddress = (config.contractAddress as string) || '';
  const network = (config.network as 'arbitrum' | 'arbitrum-sepolia') || 'arbitrum-sepolia';
  const rpcUrl = (config.rpcUrl as string) || '';

  return (
    <div className="space-y-4 -mx-4 -mt-2">
      <ERC721InteractionPanel
        contractAddress={contractAddress}
        network={network}
        rpcUrl={rpcUrl}
      />
    </div>
  );
}
