'use client';

import { useState, useEffect } from 'react';
import { useBlueprintStore } from '@/store/blueprint';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Link, Loader2, Copy, CheckCircle2, AlertCircle, Info, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getChainlinkPrice } from '@cradle/chainlink-price-feed';
import type { SupportedChainlinkChain, ChainlinkPriceResult } from '@cradle/chainlink-price-feed';

interface Props {
  nodeId: string;
  config: Record<string, unknown>;
}

// Pre-defined Chainlink Data Feed contract addresses (AggregatorV3Interface)
// Arbitrum One: https://docs.chain.link/data-feeds/price-feeds/addresses?network=arbitrum
// Arbitrum Sepolia: testnet addresses
const FEED_PRESETS_ARBITRUM = [
  { label: 'ETH/USD - Ethereum / US Dollar', address: '0x639Fe6ab55C921f74e7fac1ee960C0B6293ba612' },
  { label: 'BTC/USD - Bitcoin / US Dollar', address: '0x6ce185860a4963106506C203335A2910413708e9' },
  { label: 'LINK/USD - Chainlink / US Dollar', address: '0x86E53CF1B870786351Da77A57575e79CB55812CB' },
  { label: 'ARB/USD - Arbitrum / US Dollar', address: '0xb2A824043730FE05F3DA2efaFa1CBbe83fa548D6' },
  { label: 'XRP/USD - Ripple / US Dollar', address: '0xB4AD57B52aB9141de9926a3e0C8dc6264c2ef205' },
  { label: 'ADA/USD - Cardano / US Dollar', address: '0xD9f615A9b820225edbA2d821c4A696a0924051c6' },
  { label: 'AVAX/USD - Avalanche / US Dollar', address: '0x8bf61728eeDCE2F32c456454d87B5d6eD6150208' },
  { label: 'BNB/USD - Binance Coin / US Dollar', address: '0x6970460aabF80C5BE983C6b74e5D06dEDCA95D4A' },
] as const;

// Arbitrum Sepolia testnet: use custom address from Chainlink docs (fewer preset feeds)
const FEED_PRESETS_ARBITRUM_SEPOLIA = [
  { label: 'ETH/USD (Testnet) – use custom if not listed', address: '0xd30e2101a97dcbAeBCBC04F14C3f624E67A35165' },
  { label: 'BTC/USD (Testnet) – use custom if not listed', address: '0x56a43EB56Da12C0dc1D972ACb089c06a5dEF8e69' },
  { label: 'ARB/USD - Arbitrum / US Dollar', address: '0xD1092a65338d049DB68D7Be6bD89d17a0929945e' },
  { label: 'AVAX/USD - Avalanche / US Dollar', address: '0xe27498c9Cc8541033F265E63c8C29A97CfF9aC6D' },
  { label: 'LINK/USD - Chainlink / US Dollar', address: '0x0FB99723Aee6f420beAD13e6bBB79b7E6F034298' },
  { label: 'MATIC/USD - Polygon / US Dollar', address: '0x44a502d94c47f47aC6D65ebdFDf4c39500e72491' },
  { label: 'SOL/USD - Solana / US Dollar', address: '0x32377717BC9F9bA8Db45A244bCE77e7c0Cc5A775' },
] as const;

export function ChainlinkPriceFeedForm({ nodeId, config }: Props) {
  const { updateNodeConfig } = useBlueprintStore();
  const [selectedPreset, setSelectedPreset] = useState<string>('');
  const [customAddress, setCustomAddress] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [shouldFetch, setShouldFetch] = useState(false);

  const updateConfig = (key: string, value: unknown) => {
    updateNodeConfig(nodeId, { ...config, [key]: value });
  };

  const chain = (config.chain as SupportedChainlinkChain) ?? 'arbitrum';
  const feedAddress = (config.feedAddress as string) ?? '';
  const staleAfterSeconds = config.staleAfterSeconds as number | undefined;

  const [priceData, setPriceData] = useState<ChainlinkPriceResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const presets = chain === 'arbitrum-sepolia' ? FEED_PRESETS_ARBITRUM_SEPOLIA : FEED_PRESETS_ARBITRUM;
  const currentAddress = selectedPreset
    ? presets.find((p) => p.address === selectedPreset)?.address ?? ''
    : customAddress || feedAddress;

  const handlePresetChange = (presetAddress: string) => {
    if (presetAddress === 'custom') {
      setSelectedPreset('');
      setCustomAddress(feedAddress);
    } else {
      setSelectedPreset(presetAddress);
      const preset = presets.find((p) => p.address === presetAddress);
      if (preset) {
        setCustomAddress('');
        updateConfig('feedAddress', preset.address);
      }
    }
  };

  const handleCustomAddressChange = (value: string) => {
    setCustomAddress(value);
    if (value && value.startsWith('0x') && value.length === 42) {
      updateConfig('feedAddress', value);
    }
  };

  const handleCopyAddress = async () => {
    if (currentAddress) {
      await navigator.clipboard.writeText(currentAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleFetchPrice = async () => {
    if (currentAddress && currentAddress.startsWith('0x') && currentAddress.length === 42) {
      setLoading(true);
      setError(null);
      setPriceData(null);
      setShouldFetch(true);
      try {
        const result = await getChainlinkPrice({
          chain,
          feedAddress: currentAddress,
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

  useEffect(() => {
    if (!feedAddress) return;
    const matching = presets.find((p) => p.address === feedAddress);
    if (matching) {
      setSelectedPreset(matching.address);
      setCustomAddress('');
    } else {
      setSelectedPreset('');
      setCustomAddress(feedAddress);
    }
  }, [feedAddress, chain]);

  return (
    <div className="space-y-4">
      <div className="p-3 rounded-lg border border-forge-border/50 bg-forge-bg/50">
        <div className="flex items-center gap-2 mb-2">
          <Link className="w-4 h-4 text-accent-cyan" />
          <span className="text-sm font-medium text-white">Chainlink Price Feed</span>
        </div>
        <p className="text-xs text-forge-muted">
          Fetch on-chain price data from Chainlink Data Feeds (AggregatorV3Interface) on Arbitrum.
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
        <div className="mb-2">
          <Select
            value={selectedPreset || (customAddress ? 'custom' : '')}
            onValueChange={handlePresetChange}
          >
            <SelectTrigger>
              <SelectValue placeholder="Choose from presets" />
            </SelectTrigger>
            <SelectContent>
              {presets.map((preset) => (
                <SelectItem key={preset.address} value={preset.address}>
                  {preset.label}
                </SelectItem>
              ))}
              <SelectItem value="custom">Custom Feed Address</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="relative">
          <label className="text-xs text-forge-muted mb-1.5 block">Chainlink Feed Address</label>
          <div className="flex gap-2">
            <Input
              type="text"
              placeholder="0x..."
              value={
                selectedPreset
                  ? presets.find((p) => p.address === selectedPreset)?.address ?? ''
                  : customAddress
              }
              onChange={(e) => {
                if (!selectedPreset) handleCustomAddressChange(e.target.value);
              }}
              disabled={!!selectedPreset}
              className="text-xs h-8 font-mono flex-1"
            />
            <button
              type="button"
              onClick={handleCopyAddress}
              disabled={!currentAddress}
              className={cn(
                'px-3 py-1 rounded-lg border transition-colors',
                'border-forge-border/50 bg-forge-bg/50 hover:bg-forge-elevated',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                copied && 'border-accent-cyan bg-accent-cyan/10'
              )}
              title="Copy Address"
            >
              {copied ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-accent-cyan" />
              ) : (
                <Copy className="w-3.5 h-3.5 text-forge-muted" />
              )}
            </button>
          </div>
          <a
            href="https://docs.chain.link/data-feeds/price-feeds/addresses?network=arbitrum"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] text-accent-cyan hover:underline mt-1 inline-flex items-center gap-1"
          >
            Find feed addresses at docs.chain.link
            <ExternalLink className="w-2.5 h-2.5" />
          </a>
        </div>

        <div className="mt-3">
          <Button
            type="button"
            onClick={handleFetchPrice}
            disabled={
              loading || !currentAddress || currentAddress.length !== 42 || !currentAddress.startsWith('0x')
            }
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

        {shouldFetch && (
          <div className="mt-3 space-y-2">
            {error && (
              <div className="flex items-start gap-2 p-2 rounded-lg bg-red-500/10 border border-red-500/20">
                <AlertCircle className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-xs font-medium text-red-400">Error</p>
                  <p className="text-[10px] text-red-300 mt-0.5">{error.message}</p>
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
                    <span>Decimals:</span>
                    <span className="font-mono">{priceData.raw.decimals}</span>
                  </div>
                  <div className="flex justify-between text-[10px] text-forge-muted">
                    <span>Updated At:</span>
                    <span className="font-mono">{new Date(priceData.raw.updatedAt * 1000).toISOString()}</span>
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
            Max Data Age (seconds) – Reject price older than this (optional).
          </p>
        </div>
      </div>

      <div className="flex items-start gap-1.5 p-2 rounded bg-forge-elevated/50 border border-forge-border/30">
        <Info className="w-3 h-3 text-forge-muted shrink-0 mt-0.5" />
        <p className="text-[10px] text-forge-muted leading-relaxed">
          Chainlink Data Feeds use AggregatorV3Interface. The feed address is a 20-byte contract address (0x + 40 hex
          chars). Use &quot;Fetch Price&quot; to test your configuration.
        </p>
      </div>
    </div>
  );
}
