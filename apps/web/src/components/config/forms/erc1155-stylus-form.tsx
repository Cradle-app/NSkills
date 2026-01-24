'use client';

import { ERC1155InteractionPanel } from '@/components/contract-interactions/ERC1155InteractionPanel';

interface Props {
  nodeId: string;
  config: Record<string, unknown>;
}

export function ERC1155StylusForm({ nodeId, config }: Props) {
  // Get config values with defaults
  const contractAddress = (config.contractAddress as string) || '';
  const network = (config.network as 'arbitrum' | 'arbitrum-sepolia') || 'arbitrum-sepolia';
  const rpcUrl = (config.rpcUrl as string) || '';

  return (
    <div className="space-y-4 -mx-4 -mt-2">
      <ERC1155InteractionPanel
        contractAddress={contractAddress}
        network={network}
        rpcUrl={rpcUrl}
      />
    </div>
  );
}
