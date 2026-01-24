'use client';

import { useBlueprintStore } from '@/store/blueprint';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';

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
    <div className="space-y-4">
      {/* Bridge Provider */}
      <div>
        <Select
          value={(config.bridgeProvider as string) || 'lifi'}
          onValueChange={(value) => handleChange('bridgeProvider', value)}
        >
          <SelectTrigger label="Bridge Provider">
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
      <div>
        <label className="text-sm font-medium text-white mb-2 block">
          Supported Tokens
        </label>
        <div className="grid grid-cols-3 gap-2">
          {TOKENS.map((token) => (
            <div
              key={token.value}
              className="flex items-center justify-between p-2 rounded-lg bg-forge-bg border border-forge-border"
            >
              <span className="text-sm text-white">{token.label}</span>
              <Switch
                checked={((config.supportedTokens as string[]) || ['ETH', 'USDC']).includes(token.value)}
                onCheckedChange={() => toggleToken(token.value)}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Source Chains */}
      <div>
        <label className="text-sm font-medium text-white mb-2 block">
          Source Chains
        </label>
        <div className="space-y-2">
          {SOURCE_CHAINS.map((chain) => (
            <div
              key={chain.value}
              className="flex items-center justify-between p-2 rounded-lg bg-forge-bg border border-forge-border"
            >
              <span className="text-sm text-white">{chain.label}</span>
              <Switch
                checked={((config.sourceChains as string[]) || ['arbitrum']).includes(chain.value)}
                onCheckedChange={() => toggleChain(chain.value)}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Slippage Tolerance */}
      <div>
        <Select
          value={String((config.slippageTolerance as number) || 0.5)}
          onValueChange={(value) => handleChange('slippageTolerance', parseFloat(value))}
        >
          <SelectTrigger label="Slippage Tolerance">
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

      {/* Generate UI */}
      <div className="flex items-center justify-between p-3 rounded-lg bg-forge-bg border border-forge-border">
        <div>
          <p className="text-sm font-medium text-white">Bridge UI Component</p>
          <p className="text-xs text-forge-muted">Generate ready-to-use bridge interface</p>
        </div>
        <Switch
          checked={(config.generateUI as boolean) ?? true}
          onCheckedChange={(checked) => handleChange('generateUI', checked)}
        />
      </div>

      {/* Generate Hooks */}
      <div className="flex items-center justify-between p-3 rounded-lg bg-forge-bg border border-forge-border">
        <div>
          <p className="text-sm font-medium text-white">Bridge Hooks</p>
          <p className="text-xs text-forge-muted">Generate useSuperpositionBridge hook</p>
        </div>
        <Switch
          checked={(config.generateHooks as boolean) ?? true}
          onCheckedChange={(checked) => handleChange('generateHooks', checked)}
        />
      </div>

      {/* Enable Withdraw */}
      <div className="flex items-center justify-between p-3 rounded-lg bg-forge-bg border border-forge-border">
        <div>
          <p className="text-sm font-medium text-white">Enable Withdrawals</p>
          <p className="text-xs text-forge-muted">Allow bridging back from Superposition</p>
        </div>
        <Switch
          checked={(config.enableWithdraw as boolean) ?? true}
          onCheckedChange={(checked) => handleChange('enableWithdraw', checked)}
        />
      </div>

      {/* Official Bridge Link */}
      <div className="p-4 rounded-lg bg-gradient-to-r from-accent-cyan/20 to-accent-cyan/5 border border-accent-cyan/30">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-sm font-medium text-white">Superposition Bridge</p>
            <p className="text-xs text-forge-muted">Bridge assets directly via the official bridge</p>
          </div>
          <a
            href="https://bridge.superposition.so"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 text-sm font-medium rounded-lg bg-accent-cyan text-black hover:bg-accent-cyan/90 transition-colors"
          >
            Open Bridge
          </a>
        </div>
        <div className="text-xs text-accent-cyan/80 space-y-1">
          <div className="flex items-center gap-2">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-accent-cyan/60" />
            <span>Bridging typically takes ~10 minutes</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-accent-cyan/60" />
            <span>Powered by Stargate/Li.Fi cross-chain liquidity</span>
          </div>
        </div>
      </div>

      {/* Destination Chain Info */}
      <div className="p-3 rounded-lg bg-forge-bg border border-forge-border">
        <p className="text-sm font-medium text-white mb-2">Destination: Superposition L3</p>
        <div className="space-y-1.5 text-xs">
          <div className="flex justify-between">
            <span className="text-forge-muted">Chain ID:</span>
            <span className="text-forge-text font-mono">55244</span>
          </div>
          <div className="flex justify-between">
            <span className="text-forge-muted">WETH:</span>
            <span className="text-forge-text font-mono">0x1fB7...cfdd</span>
          </div>
          <div className="flex justify-between">
            <span className="text-forge-muted">USDC:</span>
            <span className="text-forge-text font-mono">0x6c03...8A1</span>
          </div>
        </div>
      </div>

      {/* Info Box */}
      <div className="p-3 rounded-lg bg-accent-cyan/10 border border-accent-cyan/20">
        <p className="text-xs text-accent-cyan">
          The generated bridge integration uses Li.Fi SDK for optimal routing across multiple
          liquidity sources. Users can bridge ETH, USDC, and other tokens from Arbitrum, Ethereum,
          and other supported chains.
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          <a
            href="https://docs.li.fi"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-accent-cyan/80 hover:text-accent-cyan underline"
          >
            Li.Fi Docs
          </a>
          <a
            href="https://docs.superposition.so/superposition-mainnet/bridging-to-superposition-mainnet"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-accent-cyan/80 hover:text-accent-cyan underline"
          >
            Bridge Guide
          </a>
        </div>
      </div>
    </div>
  );
}
