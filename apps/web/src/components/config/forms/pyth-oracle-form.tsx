'use client';

import { useState, useEffect } from 'react';
import { useBlueprintStore } from '@/store/blueprint';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { TrendingUp, Loader2, Copy, CheckCircle2, AlertCircle, Info, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getPythPrice } from '@cradle/pyth-oracle';
import type { SupportedPythChain, PythPriceResult } from '@cradle/pyth-oracle';

interface Props {
    nodeId: string;
    config: Record<string, unknown>;
}

// Pre-defined price feed pairs with their IDs
// These are common pairs available on Pyth Network
const PRICE_FEED_PRESETS = [
    { label: 'ETH/USD - Ethereum / US Dollar', id: '0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace' },
    { label: 'BTC/USD - Bitcoin / US Dollar', id: '0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43' },
    { label: 'SOL/USD - Solana / US Dollar', id: '0xef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d' },
    { label: 'USDC/USD - USD Coin / US Dollar', id: '0xeaa020c61cc479712813461ce153894a96a6c00b21ed0cfc2798d1f9a9e9c94a' },
    { label: 'ARB/USD - Arbitrum / US Dollar', id: '0x3fa4252848f9f0a1480be62745a4629d9eb1322aebab8a791e344b3b9c1adcf5' },
    { label: 'AVAX/USD - Avalanche / US Dollar', id: '0x93da3352f9f1d105fdfe4971cfa80e9dd777bfc5d0f683ebb6e1294b92137bb7' },
    { label: 'LINK/USD - Chainlink / US Dollar', id: '0x8ac0c70fff57e9aefdf5edf44b51d62c2d433653cbb2cf5cc06bb115af04d221' },
    { label: 'TRX/USD - Tron / US Dollar', id: '0x67aed5a24fdad045475e7195c98a98aea119c763f272d4523f5bac93a4f33c2b' },
    { label: 'XRP/USD - Ripple / US Dollar', id: '0xec5d399846a9209f3fe5881d70aae9268c94339ff9817e8d18ff19fa05eea1c8' },
    { label: 'OP/USD - Optimism / US Dollar', id: '0x385f64d993f7b77d8182ed5003d97c60aa3361f3cecfe711544d2d59165e9bdf' },

] as const;

export function PythOracleForm({ nodeId, config }: Props) {
    const { updateNodeConfig } = useBlueprintStore();
    const [selectedPreset, setSelectedPreset] = useState<string>('');
    const [customFeedId, setCustomFeedId] = useState<string>('');
    const [copied, setCopied] = useState(false);
    const [shouldFetch, setShouldFetch] = useState(false);

    const updateConfig = (key: string, value: unknown) => {
        updateNodeConfig(nodeId, { ...config, [key]: value });
    };

    const chain = (config.chain as SupportedPythChain) ?? 'arbitrum';
    const priceFeedId = (config.priceFeedId as string) ?? '';
    const staleAfterSeconds = config.staleAfterSeconds as number | undefined;

    const [priceData, setPriceData] = useState<PythPriceResult | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    // Determine if we should use preset or custom feed ID
    const currentFeedId = selectedPreset 
        ? PRICE_FEED_PRESETS.find(p => p.id === selectedPreset)?.id || ''
        : customFeedId || priceFeedId;

    const handlePresetChange = (presetId: string) => {
        if (presetId === 'custom') {
            setSelectedPreset('');
            setCustomFeedId(priceFeedId);
        } else {
            setSelectedPreset(presetId);
            const preset = PRICE_FEED_PRESETS.find(p => p.id === presetId);
            if (preset) {
                setCustomFeedId('');
                updateConfig('priceFeedId', preset.id);
            }
        }
    };

    const handleCustomFeedIdChange = (value: string) => {
        setCustomFeedId(value);
        if (value && value.startsWith('0x') && value.length === 66) {
            updateConfig('priceFeedId', value);
        }
    };

    const handleCopyFeedId = async () => {
        if (currentFeedId) {
            await navigator.clipboard.writeText(currentFeedId);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleFetchPrice = async () => {
        if (currentFeedId && currentFeedId.startsWith('0x') && currentFeedId.length === 66) {
            setLoading(true);
            setError(null);
            setPriceData(null);
            setShouldFetch(true);
            
            try {
                const result = await getPythPrice({
                    chain,
                    priceFeedId: currentFeedId,
                    staleAfterSeconds,
                });
                setPriceData(result);
            } catch (err) {
                setError(err instanceof Error ? err : new Error('Failed to fetch price'));
            } finally {
                setLoading(false);
            }
        }
    };

    // Initialize selected preset if config has a matching feed ID
    useEffect(() => {
        if (!selectedPreset && priceFeedId) {
            const matchingPreset = PRICE_FEED_PRESETS.find(p => p.id === priceFeedId);
            if (matchingPreset) {
                setSelectedPreset(matchingPreset.id);
            } else if (priceFeedId) {
                setCustomFeedId(priceFeedId);
            }
        }
    }, [priceFeedId, selectedPreset]);

    return (
        <div className="space-y-4">
            {/* Header Section */}
            <div className="p-3 rounded-lg border border-forge-border/50 bg-forge-bg/50">
                <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-4 h-4 text-accent-cyan" />
                    <span className="text-sm font-medium text-white">Pyth Price Oracle</span>
                </div>
                <p className="text-xs text-forge-muted">
                    Fetch real-time price data from Pyth Network for various asset pairs.
                </p>
            </div>

            {/* 1. Select Network */}
            <div>
                <label className="text-xs text-forge-muted mb-1.5 block">1. Select Network</label>
                <div className="flex gap-2">
                    <button
                        type="button"
                        onClick={() => updateConfig('chain', 'arbitrum')}
                        className={cn(
                            'flex-1 px-4 py-2.5 rounded-lg border text-sm font-medium transition-all',
                            chain === 'arbitrum'
                                ? 'border-white bg-forge-elevated text-white'
                                : 'border-forge-border/50 bg-forge-bg/50 text-forge-muted hover:border-forge-border'
                        )}
                    >
                        Arbitrum
                    </button>
                    <button
                        type="button"
                        onClick={() => updateConfig('chain', 'arbitrum-sepolia')}
                        className={cn(
                            'flex-1 px-4 py-2.5 rounded-lg border text-sm font-medium transition-all',
                            chain === 'arbitrum-sepolia'
                                ? 'border-white bg-forge-elevated text-white'
                                : 'border-forge-border/50 bg-forge-bg/50 text-forge-muted hover:border-forge-border'
                        )}
                    >
                        Arbitrum Sepolia (Testnet)
                    </button>
                </div>
            </div>

            {/* 2. Select Price Feed */}
            <div>
                <label className="text-xs text-forge-muted mb-1.5 block">2. Select Price Feed</label>
                
                {/* Preset Dropdown */}
                <div className="mb-2">
                    <Select
                        value={selectedPreset || (customFeedId ? 'custom' : '')}
                        onValueChange={handlePresetChange}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Choose from presets" />
                        </SelectTrigger>
                        <SelectContent>
                            {PRICE_FEED_PRESETS.map((preset) => (
                                <SelectItem key={preset.id} value={preset.id}>
                                    {preset.label}
                                </SelectItem>
                            ))}
                            <SelectItem value="custom">Custom Feed ID</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Price Feed ID Display/Input */}
                <div className="relative">
                    <label className="text-xs text-forge-muted mb-1.5 block">Pyth Price Feed ID</label>
                    <div className="flex gap-2">
                        <Input
                            type="text"
                            placeholder="0x..."
                            value={selectedPreset ? PRICE_FEED_PRESETS.find(p => p.id === selectedPreset)?.id || '' : customFeedId}
                            onChange={(e) => {
                                if (!selectedPreset) {
                                    handleCustomFeedIdChange(e.target.value);
                                }
                            }}
                            disabled={!!selectedPreset}
                            className="text-xs h-8 font-mono flex-1"
                        />
                        <button
                            type="button"
                            onClick={handleCopyFeedId}
                            disabled={!currentFeedId}
                            className={cn(
                                'px-3 py-1 rounded-lg border transition-colors',
                                'border-forge-border/50 bg-forge-bg/50 hover:bg-forge-elevated',
                                'disabled:opacity-50 disabled:cursor-not-allowed',
                                copied && 'border-accent-cyan bg-accent-cyan/10'
                            )}
                            title="Copy Feed ID"
                        >
                            {copied ? (
                                <CheckCircle2 className="w-3.5 h-3.5 text-accent-cyan" />
                            ) : (
                                <Copy className="w-3.5 h-3.5 text-forge-muted" />
                            )}
                        </button>
                    </div>
                    <a
                        href="https://pyth.network/developers/price-feed-ids"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] text-accent-cyan hover:underline mt-1 inline-flex items-center gap-1"
                    >
                        Find more feed IDs at pyth.network
                        <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                </div>

                {/* Fetch Price Button */}
                <div className="mt-3">
                    <Button
                        type="button"
                        onClick={handleFetchPrice}
                        disabled={loading || !currentFeedId || currentFeedId.length !== 66 || !currentFeedId.startsWith('0x')}
                        size="sm"
                        className="w-full"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />
                                Fetching Price...
                            </>
                        ) : (
                            'Fetch Price'
                        )}
                    </Button>
                </div>

                {/* Price Result Display */}
                {shouldFetch && (
                    <div className="mt-3 space-y-2">
                        {error && (
                            <div className="flex items-start gap-2 p-2 rounded-lg bg-red-500/10 border border-red-500/20">
                                <AlertCircle className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />
                                <div className="flex-1">
                                    <p className="text-xs font-medium text-red-400">Error</p>
                                    <p className="text-[10px] text-red-300 mt-0.5">{error.message}</p>
                                    {error.message.includes('404') && chain === 'arbitrum-sepolia' && (
                                        <p className="text-[10px] text-yellow-300 mt-1.5">
                                            💡 Tip: This feed ID might not be available on Arbitrum Sepolia. Try switching to Arbitrum Mainnet or use a different feed ID.
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}

                        {priceData && !error && (
                            <div className="p-3 rounded-lg bg-forge-elevated/50 border border-forge-border/50">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs font-medium text-white">Current Price</span>
                                    {priceData.isStale && (
                                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
                                            Stale
                                        </span>
                                    )}
                                </div>
                                <p className="text-lg font-bold text-accent-cyan">{priceData.formattedPrice}</p>
                                <div className="mt-2 space-y-1">
                                    <div className="flex justify-between text-[10px] text-forge-muted">
                                        <span>Raw Price:</span>
                                        <span className="font-mono">{priceData.raw.price}</span>
                                    </div>
                                    <div className="flex justify-between text-[10px] text-forge-muted">
                                        <span>Confidence:</span>
                                        <span className="font-mono">{priceData.raw.conf}</span>
                                    </div>
                                    <div className="flex justify-between text-[10px] text-forge-muted">
                                        <span>Exponent:</span>
                                        <span className="font-mono">{priceData.raw.expo}</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* 3. Optional Settings */}
            <div>
                <label className="text-xs text-forge-muted mb-1.5 block">3. Optional Settings</label>
                
                <div className="mb-3">
                    <Input
                        type="number"
                        placeholder="3600"
                        value={staleAfterSeconds ?? ''}
                        onChange={(e) => {
                            const val = e.target.value ? parseInt(e.target.value, 10) : undefined;
                            updateConfig('staleAfterSeconds', val);
                        }}
                        className="text-xs h-8"
                    />
                    <p className="text-[10px] text-forge-muted mt-1">
                        Max Data Age (seconds) - Reject price data older than this (optional, leave empty for no check)
                    </p>
                </div>

                <div className="flex items-center gap-2 p-2 rounded-lg border border-forge-border/50 bg-forge-bg/50">
                    <input
                        type="checkbox"
                        id="simulate-before-fetch"
                        checked={true}
                        readOnly
                        className="w-3.5 h-3.5 rounded border-forge-border bg-forge-bg text-accent-cyan focus:ring-accent-cyan"
                    />
                    <label htmlFor="simulate-before-fetch" className="text-xs text-forge-muted cursor-pointer">
                        Simulate before fetching (recommended)
                    </label>
                </div>
            </div>

            {/* Info Box */}
            <div className="flex items-start gap-1.5 p-2 rounded bg-forge-elevated/50 border border-forge-border/30">
                <Info className="w-3 h-3 text-forge-muted shrink-0 mt-0.5" />
                <div className="flex-1">
                    <p className="text-[10px] text-forge-muted leading-relaxed">
                        Pyth Network provides real-time price feeds updated every 400ms. Use the "Fetch Price" button to test
                        your configuration before deploying. Price feed IDs are 32-byte hex strings (66 characters including 0x prefix).
                    </p>
                    {chain === 'arbitrum-sepolia' && (
                        <p className="text-[10px] text-yellow-400/80 leading-relaxed mt-1.5">
                            ⚠️ Note: Some price feeds may not be available on Arbitrum Sepolia testnet. If you encounter errors, try switching to Arbitrum Mainnet.
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}
