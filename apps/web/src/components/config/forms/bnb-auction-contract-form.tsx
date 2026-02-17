'use client';

import { useState, useEffect } from 'react';
import { Gavel } from 'lucide-react';
import { useBlueprintStore } from '@/store/blueprint';
import { cn } from '@/lib/utils';
import { AuctionInteractionPanel } from '@/components/contract-interactions/AuctionInteractionPanel';

const formStyles = { container: 'space-y-6' };
const cardStyles = { base: 'p-4 rounded-xl border border-[hsl(var(--color-border-default))] bg-[hsl(var(--color-bg-muted))]' };
const labelStyles = {
    base: 'flex items-center gap-1.5 text-xs font-medium text-[hsl(var(--color-text-secondary))]',
    helper: 'text-[10px] text-[hsl(var(--color-text-muted))] mt-1.5 leading-relaxed',
};

const DEFAULT_AUCTION_ADDRESS = '0x00320016Ad572264a64C98142e51200E60f73bCE';

function FormHeader({
    icon: Icon,
    title,
    description,
}: {
    icon: typeof Gavel;
    title: string;
    description: string;
    variant?: string;
}) {
    return (
        <div className="flex items-start gap-3 mb-4">
            <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <Icon className="w-5 h-5 text-amber-400" />
            </div>
            <div>
                <h3 className="text-sm font-semibold text-[hsl(var(--color-text-primary))]">{title}</h3>
                <p className="text-[11px] text-[hsl(var(--color-text-muted))] mt-0.5">{description}</p>
            </div>
        </div>
    );
}

interface Props {
    nodeId: string;
    config: Record<string, unknown>;
}

export function BnbAuctionContractForm({ nodeId, config }: Props) {
    const { updateNodeConfig } = useBlueprintStore();

    const configuredAddress = (config.contractAddress as string | undefined) || DEFAULT_AUCTION_ADDRESS;
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
                icon={Gavel}
                title="BNB Auction Contract"
                description="Interact with a deployed SimpleAuction.sol contract on BNB Smart Chain Testnet."
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
                        placeholder={DEFAULT_AUCTION_ADDRESS}
                        className="w-full px-3 py-2 text-xs rounded-lg bg-[hsl(var(--color-bg-base))] border border-[hsl(var(--color-border-default))] text-[hsl(var(--color-text-primary))] placeholder-[hsl(var(--color-text-muted))] focus:outline-none focus:border-[hsl(var(--color-accent-primary))] focus:ring-2 focus:ring-[hsl(var(--color-accent-primary)/0.15)] font-mono"
                    />
                    <p className={labelStyles.helper}>
                        Defaults to the deployed SimpleAuction.sol contract on BNB Smart Chain Testnet. You can paste
                        a different address if you have your own deployment.
                    </p>
                </div>
            </div>

            {/* Live interaction panel */}
            <div className={cardStyles.base}>
                <AuctionInteractionPanel contractAddress={localAddress} />
            </div>
        </div>
    );
}
