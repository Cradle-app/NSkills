'use client';

import { useBlueprintStore } from '@/store/blueprint';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Network, ArrowRightLeft, Coins, Settings2, Info, ExternalLink, Link2, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  formStyles,
  labelStyles,
  toggleRowStyles,
  cardStyles,
  codeStyles,
  FormHeader
} from './shared-styles';

interface Props {
  nodeId: string;
  config: Record<string, unknown>;
}

const BRIDGE_PROVIDERS = [
  { value: 'lifi', label: 'Li.Fi (Recommended)' },
  { value: 'stargate', label: 'Stargate' },
  { value: 'superbridge', label: 'Superbridge' },
];

const TOKENS = [
  { value: 'ETH', label: 'ETH' },
  { value: 'USDC', label: 'USDC' },
  { value: 'USDT', label: 'USDT' },
  { value: 'WETH', label: 'WETH' },
  { value: 'ARB', label: 'ARB' },
];

const SOURCE_CHAINS = [
  { value: 'arbitrum', label: 'Arbitrum' },
  { value: 'ethereum', label: 'Ethereum' },
  { value: 'optimism', label: 'Optimism' },
  { value: 'base', label: 'Base' },
];

const SLIPPAGE_OPTIONS = [
  { value: '0.1', label: '0.1%' },
  { value: '0.5', label: '0.5% (Recommended)' },
  { value: '1', label: '1%' },
  { value: '2', label: '2%' },
];

export function SuperpositionBridgeForm({ nodeId, config }: Props) {
  const { updateNodeConfig } = useBlueprintStore();

  const handleChange = (key: string, value: unknown) => {
    updateNodeConfig(nodeId, { [key]: value });
  };

  const toggleToken = (token: string) => {
    const currentTokens = (config.supportedTokens as string[]) || ['ETH', 'USDC'];
    const newTokens = currentTokens.includes(token)
      ? currentTokens.filter(t => t !== token)
      : [...currentTokens, token];
    handleChange('supportedTokens', newTokens);
  };

  const toggleChain = (chain: string) => {
    const currentChains = (config.sourceChains as string[]) || ['arbitrum'];
    const newChains = currentChains.includes(chain)
      ? currentChains.filter(c => c !== chain)
      : [...currentChains, chain];
    handleChange('sourceChains', newChains);
  };

  return (
    <div className={formStyles.container}>
      <FormHeader
        icon={ArrowRightLeft}
        title="Superposition Bridge"
        description="Configure cross-chain bridging via Li.Fi, Stargate, or Superbridge."
      />

      {/* Bridge Provider */}
      <div className={formStyles.section}>
        <label className={labelStyles.base}>Bridge Provider</label>
        <Select
          value={(config.bridgeProvider as string) || 'lifi'}
          onValueChange={(value) => handleChange('bridgeProvider', value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select provider" />
          </SelectTrigger>
          <SelectContent>
            {BRIDGE_PROVIDERS.map((provider) => (
              <SelectItem key={provider.value} value={provider.value}>
                {provider.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Supported Tokens */}
      <div className={formStyles.section}>
        <div className="flex items-center gap-2 mb-2">
          <Coins className="w-4 h-4 text-[hsl(var(--color-text-muted))]" />
          <span className="text-xs font-semibold text-[hsl(var(--color-text-secondary))] tracking-wide uppercase">Supported Tokens</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {TOKENS.map((token) => (
            <div
              key={token.value}
              className={cn(toggleRowStyles.row, "p-2")}
            >
              <span className={toggleRowStyles.title}>{token.label}</span>
              <Switch
                checked={((config.supportedTokens as string[]) || ['ETH', 'USDC']).includes(token.value)}
                onCheckedChange={() => toggleToken(token.value)}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Source Chains */}
      <div className={formStyles.section}>
        <div className="flex items-center gap-2 mb-2">
          <Network className="w-4 h-4 text-[hsl(var(--color-text-muted))]" />
          <span className="text-xs font-semibold text-[hsl(var(--color-text-secondary))] tracking-wide uppercase">Source Chains</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {SOURCE_CHAINS.map((chain) => (
            <div
              key={chain.value}
              className={cn(toggleRowStyles.row, "p-2")}
            >
              <span className={toggleRowStyles.title}>{chain.label}</span>
              <Switch
                checked={((config.sourceChains as string[]) || ['arbitrum']).includes(chain.value)}
                onCheckedChange={() => toggleChain(chain.value)}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Configuration */}
      <div className={formStyles.section}>
        <div className="flex items-center gap-2 mb-2">
          <Settings2 className="w-4 h-4 text-[hsl(var(--color-text-muted))]" />
          <span className="text-xs font-semibold text-[hsl(var(--color-text-secondary))] tracking-wide uppercase">Configuration</span>
        </div>

        <div className={formStyles.section}>
          <label className={labelStyles.base}>Slippage Tolerance</label>
          <Select
            value={String((config.slippageTolerance as number) || 0.5)}
            onValueChange={(value) => handleChange('slippageTolerance', parseFloat(value))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select slippage" />
            </SelectTrigger>
            <SelectContent>
              {SLIPPAGE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className={toggleRowStyles.row}>
          <div>
            <p className={toggleRowStyles.title}>Bridge UI Component</p>
            <p className={toggleRowStyles.description}>Generate ready-to-use bridge interface</p>
          </div>
          <Switch
            checked={(config.generateUI as boolean) ?? true}
            onCheckedChange={(checked) => handleChange('generateUI', checked)}
          />
        </div>

        <div className={toggleRowStyles.row}>
          <div>
            <p className={toggleRowStyles.title}>Bridge Hooks</p>
            <p className={toggleRowStyles.description}>Generate useSuperpositionBridge hook</p>
          </div>
          <Switch
            checked={(config.generateHooks as boolean) ?? true}
            onCheckedChange={(checked) => handleChange('generateHooks', checked)}
          />
        </div>

        <div className={toggleRowStyles.row}>
          <div>
            <p className={toggleRowStyles.title}>Enable Withdrawals</p>
            <p className={toggleRowStyles.description}>Allow bridging back from Superposition</p>
          </div>
          <Switch
            checked={(config.enableWithdraw as boolean) ?? true}
            onCheckedChange={(checked) => handleChange('enableWithdraw', checked)}
          />
        </div>
      </div>

      {/* Official Bridge Link */}
      <div className={cn(cardStyles.primary, "bg-gradient-to-r from-[hsl(var(--color-accent-primary)/0.15)] to-transparent")}>
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className={cardStyles.cardTitle}>Superposition Bridge</p>
            <p className={cardStyles.cardBody}>Bridge assets directly via the official bridge</p>
          </div>
          <a
            href="https://bridge.superposition.so"
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg",
              "text-xs font-medium",
              "bg-[hsl(var(--color-accent-primary))]",
              "text-black",
              "hover:bg-[hsl(var(--color-accent-primary)/0.9)]",
              "transition-colors"
            )}
          >
            Open Bridge <ExternalLink className="w-3 h-3" />
          </a>
        </div>
        <div className="text-[10px] text-[hsl(var(--color-accent-primary))] space-y-1">
          <div className="flex items-center gap-2">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-[hsl(var(--color-accent-primary))]" />
            <span>Bridging typically takes ~10 minutes</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-[hsl(var(--color-accent-primary))]" />
            <span>Powered by Stargate/Li.Fi cross-chain liquidity</span>
          </div>
        </div>
      </div>

      {/* Destination Chain Info */}
      <div className={cardStyles.base}>
        <div className={cardStyles.cardHeader}>
          <ArrowRight className={cn(cardStyles.cardIcon, 'text-[hsl(var(--color-text-muted))]')} />
          <span className={cardStyles.cardTitle}>Destination: Superposition L3</span>
        </div>
        <div className="space-y-1.5 text-xs">
          <div className="flex justify-between">
            <span className="text-[hsl(var(--color-text-muted))]">Chain ID:</span>
            <span className={codeStyles.inline}>55244</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[hsl(var(--color-text-muted))]">WETH:</span>
            <span className={codeStyles.inline}>0x1fB7...cfdd</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[hsl(var(--color-text-muted))]">USDC:</span>
            <span className={codeStyles.inline}>0x6c03...8A1</span>
          </div>
        </div>
      </div>

      {/* Info Box */}
      <div className={cardStyles.info}>
        <div className={cardStyles.cardHeader}>
          <Info className={cn(cardStyles.cardIcon, 'text-[hsl(var(--color-info))]')} />
          <span className={cardStyles.cardTitle}>Documentation</span>
        </div>
        <p className={cardStyles.cardBody}>
          The generated bridge integration uses Li.Fi SDK for optimal routing.
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          <a
            href="https://docs.li.fi"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] text-[hsl(var(--color-accent-primary))] hover:underline"
          >
            Li.Fi Docs
          </a>
          <a
            href="https://docs.superposition.so/superposition-mainnet/bridging-to-superposition-mainnet"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] text-[hsl(var(--color-accent-primary))] hover:underline"
          >
            Bridge Guide
          </a>
        </div>
      </div>
    </div>
  );
}
