'use client';

import { useState, useEffect } from 'react';
import { Ticket } from 'lucide-react';
import { useBlueprintStore } from '@/store/blueprint';
import { cn } from '@/lib/utils';
import { LotteryInteractionPanel } from '@/components/contract-interactions/LotteryInteractionPanel';

const DEFAULT_LOTTERY_ADDRESS = '0x9bb658a999a46d149262fe74d37894ac203ca493';

const formStyles = { container: 'space-y-6' };
const cardStyles = { base: 'p-4 rounded-xl border border-[hsl(var(--color-border-default))] bg-[hsl(var(--color-bg-muted))]' };
const labelStyles = {
  base: 'block text-xs font-medium text-[hsl(var(--color-text-dim))] uppercase tracking-wider mb-2',
  icon: 'w-3 h-3 inline-block mr-1.5 opacity-70',
};
const inputStyles = {
  base: 'w-full bg-[hsl(var(--color-bg-default))] border border-[hsl(var(--color-border-default))] rounded-lg px-3 py-2 text-sm text-[hsl(var(--color-text-default))] placeholder-[hsl(var(--color-text-dim))] focus:outline-none focus:ring-1 focus:ring-[hsl(var(--color-accent))] transition-all',
};

interface BnbLotteryContractFormProps {
  nodeId: string;
  config: {
    contractAddress?: string;
  };
}

export function BnbLotteryContractForm({ nodeId, config }: BnbLotteryContractFormProps) {
  const updateNodeConfig = useBlueprintStore((state) => state.updateNodeConfig);
  const [address, setAddress] = useState(config.contractAddress || DEFAULT_LOTTERY_ADDRESS);

  useEffect(() => {
    setAddress(config.contractAddress || DEFAULT_LOTTERY_ADDRESS);
  }, [config.contractAddress]);

  const handleAddressChange = (newAddress: string) => {
    setAddress(newAddress);
    updateNodeConfig(nodeId, { contractAddress: newAddress });
  };

  return (
    <div className={formStyles.container}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6 p-4 rounded-xl bg-accent-cyan/10 border border-accent-cyan/20">
        <div className="p-2 rounded-lg bg-accent-cyan/20 text-accent-cyan">
          <Ticket className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-sm font-medium text-white">BNB Lottery</h3>
          <p className="text-xs text-accent-cyan/60">
            Interact with Lottery.sol on BNB Testnet
          </p>
        </div>
      </div>

      {/* Contract Configuration */}
      <div className={cardStyles.base}>
        <label className={labelStyles.base}>
          <Ticket className={labelStyles.icon} />
          Contract Address
        </label>
        <div className="space-y-2">
          <input
            type="text"
            value={address}
            onChange={(e) => handleAddressChange(e.target.value)}
            placeholder={DEFAULT_LOTTERY_ADDRESS}
            className={cn(inputStyles.base, 'font-mono text-xs')}
          />
          <p className="text-[10px] text-[hsl(var(--color-text-dim))]">
            Defaults to the deployed Lottery.sol contract on BNB Smart Chain Testnet.
            Paste a different address if you have your own deployment.
          </p>
        </div>
      </div>

      {/* Live Interaction */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="h-px flex-1 bg-[hsl(var(--color-border-default))]" />
          <span className="text-[10px] uppercase tracking-widest text-[hsl(var(--color-text-dim))] font-medium">
            Live Preview
          </span>
          <div className="h-px flex-1 bg-[hsl(var(--color-border-default))]" />
        </div>

        <LotteryInteractionPanel contractAddress={address} />
      </div>
    </div>
  );
}
