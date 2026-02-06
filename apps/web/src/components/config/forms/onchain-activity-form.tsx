'use client';

import { useState } from 'react';
import { useBlueprintStore } from '@/store/blueprint';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { TrendingUp, CheckCircle2, Loader2, Search, Info, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';

// Import from the Onchain Activity component package
import {
    useOnchainActivity,
    CATEGORY_LABELS,
    LIMIT_OPTIONS,
    LIMIT_LABELS,
    ALL_CATEGORIES,
    type SupportedNetwork,
    type TransactionCategory,
    type TransactionLimit,
} from '@cradle/onchain-activity';
import {
    formStyles,
    labelStyles,
    cardStyles,
    actionStyles,
} from './shared-styles';

interface Props {
    nodeId: string;
    config: Record<string, unknown>;
}

export function OnchainActivityForm({ nodeId, config }: Props) {
    const { updateNodeConfig } = useBlueprintStore();
    const [walletAddress, setWalletAddress] = useState('');
    const [customLimitInput, setCustomLimitInput] = useState<string | null>(null);

    const updateConfig = (key: string, value: unknown) => {
        updateNodeConfig(nodeId, { ...config, [key]: value });
    };

    const network = (config.network as SupportedNetwork) ?? 'arbitrum';
    const transactionLimit = (config.transactionLimit as TransactionLimit) ?? '10';
    const customLimit = (config.customLimit as number) ?? 25;
    const categories = (config.categories as TransactionCategory[]) ?? ['erc20'];

    // Use the hook for fetching activity (demo/preview functionality)
    const { data, loading, error, fetchActivity } = useOnchainActivity({
        network,
        limit: transactionLimit,
        customLimit,
        categories,
        apiKey: process.env.NEXT_PUBLIC_ALCHEMY_KEY ?? '',
    });

    const toggleCategory = (category: TransactionCategory) => {
        const currentCategories = [...categories];
        const index = currentCategories.indexOf(category);
        if (index > -1) {
            if (currentCategories.length > 1) {
                currentCategories.splice(index, 1);
            }
        } else {
            currentCategories.push(category);
        }
        updateConfig('categories', currentCategories);
    };

    const explorerUrl = network === 'arbitrum' ? 'https://arbiscan.io' : 'https://sepolia.arbiscan.io';

    return (
        <div className={formStyles.container}>
            {/* Status Overview */}
            <div className={cardStyles.base}>
                <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-4 h-4 text-[hsl(var(--color-accent-primary))]" />
                    <span className="text-sm font-semibold text-[hsl(var(--color-text-primary))]">Onchain Activity</span>
                </div>
                <p className="text-xs text-[hsl(var(--color-text-muted))]">
                    Fetch wallet transactions and activities from Arbitrum by category.
                </p>
            </div>

            {/* Network Selection */}
            <div className={formStyles.section}>
                <label className={labelStyles.base}>Network</label>
                <Select
                    value={network}
                    onValueChange={(v) => updateConfig('network', v)}
                >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="arbitrum">Arbitrum One (Mainnet)</SelectItem>
                        <SelectItem value="arbitrum-sepolia">Arbitrum Sepolia (Testnet)</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Transaction Limit */}
            <div className={formStyles.section}>
                <label className={labelStyles.base}>Transaction Limit</label>
                <Select
                    value={transactionLimit}
                    onValueChange={(v) => updateConfig('transactionLimit', v)}
                >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                        {LIMIT_OPTIONS.map((limit) => (
                            <SelectItem key={limit} value={limit}>
                                {LIMIT_LABELS[limit]}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Custom Limit Input - shown when 'custom' is selected */}
            {transactionLimit === 'custom' && (
                <div className={formStyles.section}>
                    <label className={labelStyles.base}>Custom Amount</label>
                    <Input
                        type="number"
                        min="1"
                        max="100"
                        placeholder="Enter number (1-100)"
                        value={customLimitInput !== null ? customLimitInput : customLimit}
                        onFocus={() => setCustomLimitInput(String(customLimit))}
                        onChange={(e) => setCustomLimitInput(e.target.value)}
                        onBlur={() => {
                            const val = parseInt(customLimitInput || '', 10);
                            if (val && val >= 1 && val <= 100) {
                                updateConfig('customLimit', val);
                            }
                            setCustomLimitInput(null);
                        }}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                const val = parseInt(customLimitInput || '', 10);
                                if (val && val >= 1 && val <= 100) {
                                    updateConfig('customLimit', val);
                                }
                                setCustomLimitInput(null);
                                (e.target as HTMLInputElement).blur();
                            }
                        }}
                        className="text-xs h-8"
                    />
                    <p className="text-[10px] text-[hsl(var(--color-text-muted))] mt-1">
                        Enter a value between 1 and 100
                    </p>
                </div>
            )}

            {/* Categories Selection */}
            <div className={formStyles.section}>
                <label className={labelStyles.base}>Transaction Categories</label>
                <div className="space-y-2">
                    {ALL_CATEGORIES.map((category) => (
                        <button
                            key={category}
                            onClick={() => toggleCategory(category)}
                            className={cn(
                                'w-full px-3 py-2 rounded-lg border text-left text-xs transition-all',
                                categories.includes(category)
                                    ? 'border-[hsl(var(--color-accent-primary)/0.5)] bg-[hsl(var(--color-accent-primary)/0.1)] text-[hsl(var(--color-text-primary))]'
                                    : 'border-[hsl(var(--color-border-default))] bg-[hsl(var(--color-bg-muted))] text-[hsl(var(--color-text-muted))] hover:border-[hsl(var(--color-border-subtle))]'
                            )}
                        >
                            <div className="flex items-center justify-between">
                                <span>{CATEGORY_LABELS[category]}</span>
                                {categories.includes(category) && (
                                    <CheckCircle2 className="w-3.5 h-3.5 text-[hsl(var(--color-accent-primary))]" />
                                )}
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Test Fetch Section */}
            <div className={cardStyles.base}>
                <div className="flex items-center gap-2 mb-2">
                    <Search className="w-4 h-4 text-[hsl(var(--color-text-muted))]" />
                    <span className="text-sm font-semibold text-[hsl(var(--color-text-primary))]">Test Fetch</span>
                </div>
                <p className="text-xs text-[hsl(var(--color-text-muted))] mb-3">
                    Enter a wallet address to preview the activity fetch.
                </p>

                <div className="flex gap-2">
                    <Input
                        type="text"
                        placeholder="0x..."
                        value={walletAddress}
                        onChange={(e) => setWalletAddress(e.target.value)}
                        className="text-xs h-8 font-mono flex-1"
                    />
                    <button
                        onClick={() => fetchActivity(walletAddress)}
                        disabled={loading || !walletAddress}
                        className={actionStyles.primary}
                    >
                        {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Fetch'}
                    </button>
                </div>

                {error && (
                    <p className="text-[10px] text-[hsl(var(--color-error))] mt-2">
                        {error.message}
                    </p>
                )}

                {data && data.transfers.length > 0 && (
                    <div className="mt-3 space-y-1.5">
                        <p className="text-[10px] text-[hsl(var(--color-text-muted))]">
                            Found {data.totalCount} transactions:
                        </p>
                        <div className="max-h-64 overflow-y-auto space-y-1">
                            {data.transfers.map((tx) => (
                                <a
                                    key={tx.hash}
                                    href={`${explorerUrl}/tx/${tx.hash}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center justify-between p-1.5 rounded bg-[hsl(var(--color-bg-elevated))] hover:bg-[hsl(var(--color-bg-hover))] text-[10px] group"
                                >
                                    <span className="text-[hsl(var(--color-text-muted))]">
                                        {tx.category.toUpperCase()}: {tx.value ?? '—'} {tx.asset ?? ''}
                                    </span>
                                    <ExternalLink className="w-2.5 h-2.5 text-[hsl(var(--color-text-muted))] opacity-0 group-hover:opacity-100" />
                                </a>
                            ))}
                        </div>
                    </div>
                )}

                {data && data.transfers.length === 0 && (
                    <p className="text-[10px] text-[hsl(var(--color-text-muted))] mt-2">
                        No transactions found for the selected categories.
                    </p>
                )}
            </div>

            {/* Info Box */}
            <div className={cardStyles.info}>
                <div className="flex items-start gap-1.5">
                    <Info className="w-3 h-3 text-[hsl(var(--color-info))] shrink-0 mt-0.5" />
                    <p className="text-[10px] text-[hsl(var(--color-text-muted))] leading-relaxed">
                        This feature relies on an external blockchain indexing service
                        to retrieve transaction history. Ensure your environment variables
                        are properly configured.
                    </p>
                </div>
            </div>
        </div>
    );
}
