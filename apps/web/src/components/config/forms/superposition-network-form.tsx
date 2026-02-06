'use client';

import { useState, useCallback } from 'react';
import { useBlueprintStore } from '@/store/blueprint';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Network, Activity, Info, Wifi, WifiOff, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  formStyles,
  labelStyles,
  inputStyles,
  toggleRowStyles,
  cardStyles,
  statusStyles,
  FormHeader
} from './shared-styles';

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
    <div className={formStyles.container}>
      <FormHeader
        icon={Network}
        title="Network Configuration"
        description="Configure connection to Superposition Layer 3 chains."
      />

      {/* Network Selection */}
      <div className={formStyles.section}>
        <label className={labelStyles.base}>Primary Network</label>
        <Select
          value={(config.network as string) || 'mainnet'}
          onValueChange={(value) => handleChange('network', value)}
        >
          <SelectTrigger>
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

      <div className={formStyles.section}>
        <div className={toggleRowStyles.row}>
          <div>
            <p className={toggleRowStyles.title}>Include Testnet</p>
            <p className={toggleRowStyles.description}>Generate testnet chain config</p>
          </div>
          <Switch
            checked={(config.includeTestnet as boolean) ?? true}
            onCheckedChange={(checked) => handleChange('includeTestnet', checked)}
          />
        </div>

        <div className={toggleRowStyles.row}>
          <div>
            <p className={toggleRowStyles.title}>Chain Configuration</p>
            <p className={toggleRowStyles.description}>Generate viem/wagmi chain definitions</p>
          </div>
          <Switch
            checked={(config.generateChainConfig as boolean) ?? true}
            onCheckedChange={(checked) => handleChange('generateChainConfig', checked)}
          />
        </div>

        <div className={toggleRowStyles.row}>
          <div>
            <p className={toggleRowStyles.title}>Contract Constants</p>
            <p className={toggleRowStyles.description}>Generate contract addresses file</p>
          </div>
          <Switch
            checked={(config.generateConstants as boolean) ?? true}
            onCheckedChange={(checked) => handleChange('generateConstants', checked)}
          />
        </div>

        <div className={toggleRowStyles.row}>
          <div>
            <p className={toggleRowStyles.title}>WebSocket Support</p>
            <p className={toggleRowStyles.description}>Include WebSocket RPC configuration</p>
          </div>
          <Switch
            checked={(config.enableWebSocket as boolean) ?? true}
            onCheckedChange={(checked) => handleChange('enableWebSocket', checked)}
          />
        </div>

        <div className={toggleRowStyles.row}>
          <div>
            <p className={toggleRowStyles.title}>Network Switcher</p>
            <p className={toggleRowStyles.description}>Generate useSuperpositionNetwork hook</p>
          </div>
          <Switch
            checked={(config.generateNetworkSwitcher as boolean) ?? true}
            onCheckedChange={(checked) => handleChange('generateNetworkSwitcher', checked)}
          />
        </div>
      </div>

      <div className={formStyles.section}>
        <label className={labelStyles.base}>Custom RPC URL (optional)</label>
        <Input
          value={(config.customRpcUrl as string) || ''}
          onChange={(e) => handleChange('customRpcUrl', e.target.value || undefined)}
          placeholder="https://rpc.superposition.so"
        />
      </div>

      {/* Test Connection */}
      <div className={cardStyles.base}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Activity className={cn(cardStyles.cardIcon, 'text-[hsl(var(--color-text-muted))]')} />
            <span className={cardStyles.cardTitle}>Test RPC Connection</span>
          </div>
          <button
            onClick={testConnection}
            disabled={connectionStatus.status === 'testing'}
            className={cn(
              "px-3 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5",
              "bg-[hsl(var(--color-accent-primary)/0.15)] text-[hsl(var(--color-accent-primary))]",
              "hover:bg-[hsl(var(--color-accent-primary)/0.25)]",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          >
            {connectionStatus.status === 'testing' && <Loader2 className="w-3 h-3 animate-spin" />}
            {connectionStatus.status === 'testing' ? 'Testing...' : 'Test Connection'}
          </button>
        </div>

        {/* Connection Status Display */}
        {connectionStatus.status === 'connected' && (
          <div className={statusStyles.connected}>
            <div className={statusStyles.statusHeader}>
              <Wifi className={cn(statusStyles.statusIcon, statusStyles.statusIconConnected)} />
              <span className={statusStyles.statusTitle}>Connected</span>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className={statusStyles.statusDetail}>Chain ID</span>
                <code className={statusStyles.statusCode}>{connectionStatus.chainId}</code>
              </div>
              <div className="flex justify-between">
                <span className={statusStyles.statusDetail}>Latest Block</span>
                <code className={statusStyles.statusCode}>#{connectionStatus.blockNumber?.toLocaleString()}</code>
              </div>
            </div>
          </div>
        )}

        {connectionStatus.status === 'error' && (
          <div className={cn(cardStyles.base, "bg-[hsl(var(--color-error)/0.08)] border-[hsl(var(--color-error)/0.2)]")}>
            <div className={statusStyles.statusHeader}>
              <WifiOff className={cn(statusStyles.statusIcon, "text-[hsl(var(--color-error))]")} />
              <span className={cn(statusStyles.statusTitle, "text-[hsl(var(--color-error))]")}>Connection Failed</span>
            </div>
            <p className={statusStyles.statusDetail}>{connectionStatus.error}</p>
          </div>
        )}
      </div>

      {/* Info Box */}
      <div className={cardStyles.info}>
        <div className={cardStyles.cardHeader}>
          <Info className={cn(cardStyles.cardIcon, 'text-[hsl(var(--color-info))]')} />
          <span className={cardStyles.cardTitle}>Documentation</span>
        </div>
        <p className={cardStyles.cardBody}>
          Superposition is an Arbitrum L3 for incentive-driven applications.
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          <a
            href="https://docs.superposition.so"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] text-[hsl(var(--color-accent-primary))] hover:underline"
          >
            Documentation
          </a>
          <a
            href="https://explorer.superposition.so"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] text-[hsl(var(--color-accent-primary))] hover:underline"
          >
            Explorer
          </a>
          <a
            href="https://bridge.superposition.so"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] text-[hsl(var(--color-accent-primary))] hover:underline"
          >
            Bridge
          </a>
        </div>
      </div>
    </div>
  );
}
