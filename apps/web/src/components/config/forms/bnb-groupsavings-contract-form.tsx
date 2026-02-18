'use client';

import { useState, useEffect } from 'react';
import { PiggyBank } from 'lucide-react';
import { useBlueprintStore } from '@/store/blueprint';
import { cn } from '@/lib/utils';
import { GroupSavingsInteractionPanel } from '@/components/contract-interactions/GroupSavingsInteractionPanel';

const formStyles = { container: 'space-y-6' };
const cardStyles = { base: 'p-4 rounded-xl border border-[hsl(var(--color-border-default))] bg-[hsl(var(--color-bg-muted))]' };
const labelStyles = {
    base: 'block text-xs font-medium text-[hsl(var(--color-text-dim))] uppercase tracking-wider mb-2',
    icon: 'w-3 h-3 inline-block mr-1.5 opacity-70',
};
const inputStyles = {
    base: 'w-full bg-[hsl(var(--color-bg-default))] border border-[hsl(var(--color-border-default))] rounded-lg px-3 py-2 text-sm text-[hsl(var(--color-text-default))] placeholder-[hsl(var(--color-text-dim))] focus:outline-none focus:ring-1 focus:ring-[hsl(var(--color-accent))] transition-all',
};

interface BnbGroupSavingsContractFormProps {
    nodeId: string;
    config: {
        contractAddress?: string;
    };
}

export function BnbGroupSavingsContractForm({ nodeId, config }: BnbGroupSavingsContractFormProps) {
    const updateNodeConfig = useBlueprintStore((state) => state.updateNodeConfig);
    const [address, setAddress] = useState(config.contractAddress || '');

    useEffect(() => {
        setAddress(config.contractAddress || '');
    }, [config.contractAddress]);

    const handleAddressChange = (newAddress: string) => {
        setAddress(newAddress);
        updateNodeConfig(nodeId, { contractAddress: newAddress });
    };

    return (
        <div className={formStyles.container}>
            {/* Header */}
            <div className="flex items-center gap-3 mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400">
                    <PiggyBank className="w-5 h-5" />
                </div>
                <div>
                    <h3 className="text-sm font-medium text-emerald-100">BNB Group Savings</h3>
                    <p className="text-xs text-emerald-200/60">
                        Interact with GroupSavings.sol on BNB Testnet
                    </p>
                </div>
            </div>

            {/* Contract Configuration */}
            <div className={cardStyles.base}>
                <label className={labelStyles.base}>
                    <PiggyBank className={labelStyles.icon} />
                    Contract Address
                </label>
                <div className="space-y-2">
                    <input
                        type="text"
                        value={address}
                        onChange={(e) => handleAddressChange(e.target.value)}
                        placeholder="0x..."
                        className={cn(inputStyles.base, 'font-mono text-xs')}
                    />
                    <p className="text-[10px] text-[hsl(var(--color-text-dim))]">
                        Address of the deployed GroupSavings contract
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

                <GroupSavingsInteractionPanel contractAddress={address} />
            </div>
        </div>
    );
}
