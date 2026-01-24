'use client';

import { useState, useCallback } from 'react';
import { useBlueprintStore } from '@/store/blueprint';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';

interface Props {
  nodeId: string;
  config: Record<string, unknown>;
}

const NETWORKS = [
  { value: 'mainnet', label: 'Mainnet (Chain ID: 55244)' },
  { value: 'testnet', label: 'Testnet (Chain ID: 98985)' },
];

// Superposition RPC endpoints
const RPC_URLS = {
  mainnet: 'https://rpc.superposition.so',
  testnet: 'https://testnet-rpc.superposition.so',
};

interface ConnectionStatus {
  status: 'idle' | 'testing' | 'connected' | 'error';
  chainId?: number;
  blockNumber?: number;
  error?: string;
}

export function SuperpositionNetworkForm({ nodeId, config }: Props) {
  const { updateNodeConfig } = useBlueprintStore();
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({ status: 'idle' });

  // Test RPC connection
  const testConnection = useCallback(async () => {
    const network = (config.network as string) || 'mainnet';
    const customRpc = config.customRpcUrl as string;
    const rpcUrl = customRpc || RPC_URLS[network as keyof typeof RPC_URLS];

    setConnectionStatus({ status: 'testing' });

    try {
      // Make eth_chainId and eth_blockNumber calls in parallel
      const [chainIdRes, blockNumberRes] = await Promise.all([
        fetch(rpcUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            method: 'eth_chainId',
            params: [],
            id: 1,
          }),
        }),
        fetch(rpcUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            method: 'eth_blockNumber',
            params: [],
            id: 2,
          }),
        }),
      ]);

      const chainIdData = await chainIdRes.json();
      const blockNumberData = await blockNumberRes.json();

      if (chainIdData.error || blockNumberData.error) {
        throw new Error(chainIdData.error?.message || blockNumberData.error?.message || 'RPC error');
      }

      const chainId = parseInt(chainIdData.result, 16);
      const blockNumber = parseInt(blockNumberData.result, 16);

      setConnectionStatus({
        status: 'connected',
        chainId,
        blockNumber,
      });
    } catch (err) {
      setConnectionStatus({
        status: 'error',
        error: err instanceof Error ? err.message : 'Connection failed',
      });
    }
  }, [config.network, config.customRpcUrl]);

  const handleChange = (key: string, value: unknown) => {
    updateNodeConfig(nodeId, { [key]: value });
  };

  return (
    <div className="space-y-4">
      {/* Network Selection */}
      <div>
        <Select
          value={(config.network as string) || 'mainnet'}
          onValueChange={(value) => handleChange('network', value)}
        >
          <SelectTrigger label="Primary Network">
            <SelectValue placeholder="Select network" />
          </SelectTrigger>
          <SelectContent>
            {NETWORKS.map((network) => (
              <SelectItem key={network.value} value={network.value}>
                {network.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Include Testnet */}
      <div className="flex items-center justify-between p-3 rounded-lg bg-forge-bg border border-forge-border">
        <div>
          <p className="text-sm font-medium text-white">Include Testnet</p>
          <p className="text-xs text-forge-muted">Generate testnet chain config</p>
        </div>
        <Switch
          checked={(config.includeTestnet as boolean) ?? true}
          onCheckedChange={(checked) => handleChange('includeTestnet', checked)}
        />
      </div>

      {/* Generate Chain Config */}
      <div className="flex items-center justify-between p-3 rounded-lg bg-forge-bg border border-forge-border">
        <div>
          <p className="text-sm font-medium text-white">Chain Configuration</p>
          <p className="text-xs text-forge-muted">Generate viem/wagmi chain definitions</p>
        </div>
        <Switch
          checked={(config.generateChainConfig as boolean) ?? true}
          onCheckedChange={(checked) => handleChange('generateChainConfig', checked)}
        />
      </div>

      {/* Generate Constants */}
      <div className="flex items-center justify-between p-3 rounded-lg bg-forge-bg border border-forge-border">
        <div>
          <p className="text-sm font-medium text-white">Contract Constants</p>
          <p className="text-xs text-forge-muted">Generate contract addresses file</p>
        </div>
        <Switch
          checked={(config.generateConstants as boolean) ?? true}
          onCheckedChange={(checked) => handleChange('generateConstants', checked)}
        />
      </div>

      {/* Enable WebSocket */}
      <div className="flex items-center justify-between p-3 rounded-lg bg-forge-bg border border-forge-border">
        <div>
          <p className="text-sm font-medium text-white">WebSocket Support</p>
          <p className="text-xs text-forge-muted">Include WebSocket RPC configuration</p>
        </div>
        <Switch
          checked={(config.enableWebSocket as boolean) ?? true}
          onCheckedChange={(checked) => handleChange('enableWebSocket', checked)}
        />
      </div>

      {/* Network Switcher Hook */}
      <div className="flex items-center justify-between p-3 rounded-lg bg-forge-bg border border-forge-border">
        <div>
          <p className="text-sm font-medium text-white">Network Switcher</p>
          <p className="text-xs text-forge-muted">Generate useSuperpositionNetwork hook</p>
        </div>
        <Switch
          checked={(config.generateNetworkSwitcher as boolean) ?? true}
          onCheckedChange={(checked) => handleChange('generateNetworkSwitcher', checked)}
        />
      </div>

      {/* Custom RPC URL */}
      <Input
        label="Custom RPC URL (optional)"
        value={(config.customRpcUrl as string) || ''}
        onChange={(e) => handleChange('customRpcUrl', e.target.value || undefined)}
        placeholder="https://rpc.superposition.so"
      />

      {/* Test Connection */}
      <div className="p-3 rounded-lg bg-forge-bg border border-forge-border space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-white">Test RPC Connection</p>
            <p className="text-xs text-forge-muted">Verify network connectivity</p>
          </div>
          <button
            onClick={testConnection}
            disabled={connectionStatus.status === 'testing'}
            className="px-3 py-1.5 text-xs font-medium rounded-lg bg-accent-cyan/20 text-accent-cyan hover:bg-accent-cyan/30 disabled:opacity-50 transition-colors"
          >
            {connectionStatus.status === 'testing' ? 'Testing...' : 'Test Connection'}
          </button>
        </div>

        {/* Connection Status Display */}
        {connectionStatus.status === 'connected' && (
          <div className="p-2 rounded-lg bg-green-500/10 border border-green-500/20">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-xs font-medium text-green-400">Connected</span>
            </div>
            <div className="text-xs text-green-300/80 space-y-0.5">
              <p>Chain ID: {connectionStatus.chainId}</p>
              <p>Latest Block: #{connectionStatus.blockNumber?.toLocaleString()}</p>
            </div>
          </div>
        )}

        {connectionStatus.status === 'error' && (
          <div className="p-2 rounded-lg bg-red-500/10 border border-red-500/20">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full bg-red-500" />
              <span className="text-xs font-medium text-red-400">Connection Failed</span>
            </div>
            <p className="text-xs text-red-300/80">{connectionStatus.error}</p>
          </div>
        )}
      </div>

      {/* Info Box */}
      <div className="p-3 rounded-lg bg-accent-cyan/10 border border-accent-cyan/20">
        <p className="text-xs text-accent-cyan">
          Superposition is an Arbitrum L3 for incentive-driven applications.
          This component generates the foundation for connecting to the network.
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          <a
            href="https://docs.superposition.so"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-accent-cyan/80 hover:text-accent-cyan underline"
          >
            Documentation
          </a>
          <a
            href="https://explorer.superposition.so"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-accent-cyan/80 hover:text-accent-cyan underline"
          >
            Explorer
          </a>
          <a
            href="https://bridge.superposition.so"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-accent-cyan/80 hover:text-accent-cyan underline"
          >
            Bridge
          </a>
        </div>
      </div>
    </div>
  );
}
