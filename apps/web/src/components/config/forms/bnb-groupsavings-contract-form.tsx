'use client';

import { useState, useEffect } from 'react';
import { PiggyBank } from 'lucide-react';
import { useBlueprintStore } from '@/store/blueprint';
import { cn } from '@/lib/utils';
import { GroupSavingsInteractionPanel } from '@/components/contract-interactions/GroupSavingsInteractionPanel';

const formStyles = { container: 'space-y-6' };
const cardStyles = { base: 'p-4 rounded-xl border border-[hsl(var(--color-border-default))] bg-[hsl(var(--color-bg-muted))]' };
const labelStyles = {
    base: 'flex items-center gap-1.5 text-xs font-medium text-[hsl(var(--color-text-secondary))]',
    helper: 'text-[10px] text-[hsl(var(--color-text-muted))] mt-1.5 leading-relaxed',
};

const DEFAULT_GROUPSAVINGS_ADDRESS = '0x1234567890123456789012345678901234567890';
const DEFAULT_NETWORK_LABEL = 'BNB Testnet';

interface BnbGroupSavingsContractFormProps {
    nodeId: string;
    config: {
        contractAddress?: string;
    };
}

export function BnbGroupSavingsContractForm({ nodeId, config }: BnbGroupSavingsContractFormProps) {
    const updateNodeConfig = useBlueprintStore((state) => state.updateNodeConfig);

    const configuredAddress = config.contractAddress || DEFAULT_GROUPSAVINGS_ADDRESS;
    const [localAddress, setLocalAddress] = useState(configuredAddress);
    const [networkLabel, setNetworkLabel] = useState(DEFAULT_NETWORK_LABEL);

    useEffect(() => {
        setLocalAddress(configuredAddress);
    }, [configuredAddress]);

    const handleBlur = () => {
        if (!localAddress) return;
        updateNodeConfig(nodeId, { contractAddress: localAddress });
    };

    const handleNetworkChange = (contractAddress: string, label: string) => {
        if (contractAddress) setLocalAddress(contractAddress);
        setNetworkLabel(label);
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
                        Interact with GroupSavings.sol on BNB Smart Chain
                    </p>
                </div>
            </div>

            {/* Contract Configuration */}
            <div className={cardStyles.base}>
                <div className="space-y-2">
                    <label className={cn(labelStyles.base, 'mb-0')}>
                        <span>Contract address ({networkLabel})</span>
                    </label>
                    <input
                        type="text"
                        value={localAddress}
                        onChange={(e) => setLocalAddress(e.target.value)}
                        onBlur={handleBlur}
                        placeholder={DEFAULT_GROUPSAVINGS_ADDRESS}
                        className="w-full px-3 py-2 text-xs rounded-lg bg-[hsl(var(--color-bg-base))] border border-[hsl(var(--color-border-default))] text-[hsl(var(--color-text-primary))] placeholder-[hsl(var(--color-text-muted))] focus:outline-none focus:border-[hsl(var(--color-accent-primary))] focus:ring-2 focus:ring-[hsl(var(--color-accent-primary)/0.15)] font-mono"
                    />
                    <p className={labelStyles.helper}>
                        Deployed GroupSavings.sol contract on {networkLabel}. You can paste a different address if
                        you have your own deployment.
                    </p>
                </div>
            </div>

            {/* Live Interaction */}
            <div className={cardStyles.base}>
                <GroupSavingsInteractionPanel
                    contractAddress={localAddress}
                    onNetworkChange={handleNetworkChange}
                />
            </div>
        </div>
    );
}
