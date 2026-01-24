'use client';

import { useState, useCallback } from 'react';
import { useBlueprintStore } from '@/store/blueprint';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';

interface Props {
  nodeId: string;
  config: Record<string, unknown>;
}

// Testnet RPC and token addresses (verified)
const TESTNET_RPC_URL = 'https://testnet-rpc.superposition.so';
const TESTNET_TOKENS = {
  wSPN: '0x22b9fa698b68bBA071B513959794E9a47d19214c',
  fUSDC: '0xA8EA92c819463EFbEdDFB670FEfC881A480f0115',
  CATBUX: '0x36c116a8851869cf8a99b3Bda0Fad42453D32B99',
};

interface BalanceStatus {
  status: 'idle' | 'loading' | 'success' | 'error';
  balances?: {
    SPN: string;
    wSPN: string;
    fUSDC: string;
    CATBUX: string;
  };
  error?: string;
}

const TOKENS = [
  { value: 'SPN', label: 'SPN', description: 'Native testnet token (0.5)' },
  { value: 'wSPN', label: 'wSPN', description: 'Wrapped SPN (0.5)' },
  { value: 'CAT', label: 'CAT', description: 'CAT Token (100)' },
  { value: 'fUSDC', label: 'fUSDC', description: 'Faucet USDC (0.5)' },
  { value: 'all', label: 'All Tokens', description: 'Request all available tokens' },
];

export function SuperpositionFaucetForm({ nodeId, config }: Props) {
  const { updateNodeConfig } = useBlueprintStore();
  const [walletAddress, setWalletAddress] = useState('');
  const [balanceStatus, setBalanceStatus] = useState<BalanceStatus>({ status: 'idle' });

  const handleChange = (key: string, value: unknown) => {
    updateNodeConfig(nodeId, { [key]: value });
  };

  // Check testnet balances
  const checkBalances = useCallback(async () => {
    if (!walletAddress.trim() || !/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
      setBalanceStatus({ status: 'error', error: 'Please enter a valid wallet address' });
      return;
    }

    setBalanceStatus({ status: 'loading' });

    try {
      // Get native SPN balance
      const spnResponse = await fetch(TESTNET_RPC_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'eth_getBalance',
          params: [walletAddress, 'latest'],
          id: 1,
        }),
      });
      const spnData = await spnResponse.json();
      const spnBalance = spnData.result ? (parseInt(spnData.result, 16) / 1e18).toFixed(4) : '0';

      // Get ERC20 balances using balanceOf(address)
      const balanceOfSelector = '0x70a08231'; // balanceOf(address)
      const paddedAddress = walletAddress.slice(2).toLowerCase().padStart(64, '0');
      const callData = balanceOfSelector + paddedAddress;

      const getTokenBalance = async (tokenAddress: string, decimals: number = 18) => {
        const response = await fetch(TESTNET_RPC_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            method: 'eth_call',
            params: [{ to: tokenAddress, data: callData }, 'latest'],
            id: 1,
          }),
        });
        const data = await response.json();
        if (data.result && data.result !== '0x') {
          return (parseInt(data.result, 16) / Math.pow(10, decimals)).toFixed(4);
        }
        return '0';
      };

      const [wSpnBalance, fUsdcBalance, catbuxBalance] = await Promise.all([
        getTokenBalance(TESTNET_TOKENS.wSPN),
        getTokenBalance(TESTNET_TOKENS.fUSDC, 6), // USDC has 6 decimals
        getTokenBalance(TESTNET_TOKENS.CATBUX),
      ]);

      setBalanceStatus({
        status: 'success',
        balances: {
          SPN: spnBalance,
          wSPN: wSpnBalance,
          fUSDC: fUsdcBalance,
          CATBUX: catbuxBalance,
        },
      });
    } catch (err) {
      setBalanceStatus({
        status: 'error',
        error: err instanceof Error ? err.message : 'Failed to fetch balances',
      });
    }
  }, [walletAddress]);

  const tokens = (config.tokens as string[]) || ['SPN', 'fUSDC'];

  const handleTokenToggle = (token: string) => {
    if (token === 'all') {
      // Toggle between 'all' and individual tokens
      if (tokens.includes('all')) {
        handleChange('tokens', ['SPN', 'fUSDC']);
      } else {
        handleChange('tokens', ['all']);
      }
      return;
    }

    // Remove 'all' if selecting individual tokens
    let currentTokens = tokens.filter((t) => t !== 'all');
    
    if (currentTokens.includes(token)) {
      currentTokens = currentTokens.filter((t) => t !== token);
    } else {
      currentTokens = [...currentTokens, token];
    }

    // If all individual tokens selected, switch to 'all'
    if (currentTokens.length === 4) {
      handleChange('tokens', ['all']);
    } else {
      handleChange('tokens', currentTokens);
    }
  };

  return (
    <div className="space-y-4">
      {/* Token Selection */}
      <div className="space-y-2">
        <p className="text-sm font-medium text-white mb-2">Supported Tokens</p>
        {TOKENS.map((token) => (
          <div
            key={token.value}
            className="flex items-center justify-between p-3 rounded-lg bg-forge-bg border border-forge-border"
          >
            <div>
              <p className="text-sm font-medium text-white">{token.label}</p>
              <p className="text-xs text-forge-muted">{token.description}</p>
            </div>
            <Switch
              checked={tokens.includes(token.value) || (token.value !== 'all' && tokens.includes('all'))}
              onCheckedChange={() => handleTokenToggle(token.value)}
            />
          </div>
        ))}
      </div>

      {/* Generate Faucet Hook */}
      <div className="flex items-center justify-between p-3 rounded-lg bg-forge-bg border border-forge-border">
        <div>
          <p className="text-sm font-medium text-white">Faucet Hook</p>
          <p className="text-xs text-forge-muted">Generate useSuperpositionFaucet hook</p>
        </div>
        <Switch
          checked={(config.generateFaucetHook as boolean) ?? true}
          onCheckedChange={(checked) => handleChange('generateFaucetHook', checked)}
        />
      </div>

      {/* Generate Faucet UI */}
      <div className="flex items-center justify-between p-3 rounded-lg bg-forge-bg border border-forge-border">
        <div>
          <p className="text-sm font-medium text-white">Faucet UI</p>
          <p className="text-xs text-forge-muted">Generate faucet request component</p>
        </div>
        <Switch
          checked={(config.generateFaucetUI as boolean) ?? true}
          onCheckedChange={(checked) => handleChange('generateFaucetUI', checked)}
        />
      </div>

      {/* Include Cooldown Timer */}
      <div className="flex items-center justify-between p-3 rounded-lg bg-forge-bg border border-forge-border">
        <div>
          <p className="text-sm font-medium text-white">Cooldown Timer</p>
          <p className="text-xs text-forge-muted">Show time until next request (5h)</p>
        </div>
        <Switch
          checked={(config.includeCooldownTimer as boolean) ?? true}
          onCheckedChange={(checked) => handleChange('includeCooldownTimer', checked)}
        />
      </div>

      {/* Include Balance Check */}
      <div className="flex items-center justify-between p-3 rounded-lg bg-forge-bg border border-forge-border">
        <div>
          <p className="text-sm font-medium text-white">Balance Check</p>
          <p className="text-xs text-forge-muted">Include testnet balance hooks</p>
        </div>
        <Switch
          checked={(config.includeBalanceCheck as boolean) ?? true}
          onCheckedChange={(checked) => handleChange('includeBalanceCheck', checked)}
        />
      </div>

      {/* Live Balance Check */}
      <div className="p-3 rounded-lg bg-forge-bg border border-forge-border space-y-3">
        <div>
          <p className="text-sm font-medium text-white">Check Testnet Balances</p>
          <p className="text-xs text-forge-muted mb-2">Enter a wallet address to check testnet token balances</p>
        </div>
        
        <div className="flex gap-2">
          <Input
            value={walletAddress}
            onChange={(e) => setWalletAddress(e.target.value)}
            placeholder="0x..."
            className="flex-1 font-mono text-xs"
          />
          <button
            onClick={checkBalances}
            disabled={!walletAddress.trim() || balanceStatus.status === 'loading'}
            className="px-3 py-1.5 text-xs font-medium rounded-lg bg-accent-cyan/20 text-accent-cyan hover:bg-accent-cyan/30 disabled:opacity-50 transition-colors whitespace-nowrap"
          >
            {balanceStatus.status === 'loading' ? 'Checking...' : 'Check'}
          </button>
        </div>

        {/* Balance Results */}
        {balanceStatus.status === 'success' && balanceStatus.balances && (
          <div className="p-2 rounded-lg bg-green-500/10 border border-green-500/20">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span className="text-xs font-medium text-green-400">Testnet Balances</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex justify-between">
                <span className="text-green-300/60">SPN:</span>
                <span className="text-green-300 font-mono">{balanceStatus.balances.SPN}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-green-300/60">wSPN:</span>
                <span className="text-green-300 font-mono">{balanceStatus.balances.wSPN}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-green-300/60">fUSDC:</span>
                <span className="text-green-300 font-mono">{balanceStatus.balances.fUSDC}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-green-300/60">CATBUX:</span>
                <span className="text-green-300 font-mono">{balanceStatus.balances.CATBUX}</span>
              </div>
            </div>
          </div>
        )}

        {balanceStatus.status === 'error' && (
          <div className="p-2 rounded-lg bg-red-500/10 border border-red-500/20">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full bg-red-500" />
              <span className="text-xs font-medium text-red-400">Error</span>
            </div>
            <p className="text-xs text-red-300/80">{balanceStatus.error}</p>
          </div>
        )}
      </div>

      {/* Official Faucet Link */}
      <div className="p-4 rounded-lg bg-gradient-to-r from-accent-cyan/20 to-accent-cyan/5 border border-accent-cyan/30">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-sm font-medium text-white">Superposition Testnet Faucet</p>
            <p className="text-xs text-forge-muted">Get testnet tokens directly</p>
          </div>
          <a
            href="https://faucet.superposition.so"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 text-sm font-medium rounded-lg bg-accent-cyan text-black hover:bg-accent-cyan/90 transition-colors"
          >
            Open Faucet
          </a>
        </div>
        <div className="text-xs text-accent-cyan/80 space-y-1">
          <p>Request tokens once every 24 hours per wallet</p>
        </div>
      </div>

      {/* Testnet Token Addresses */}
      <div className="p-3 rounded-lg bg-forge-bg border border-forge-border">
        <p className="text-sm font-medium text-white mb-2">Testnet Token Addresses</p>
        <div className="space-y-1.5 text-xs font-mono">
          <div className="flex justify-between items-center">
            <span className="text-forge-muted">wSPN:</span>
            <span className="text-forge-text">0x22b9...214c</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-forge-muted">fUSDC:</span>
            <span className="text-forge-text">0xA8EA...0115</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-forge-muted">CATBUX:</span>
            <span className="text-forge-text">0x36c1...B99</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-forge-muted">Faucet:</span>
            <span className="text-forge-text">0xD191...2B</span>
          </div>
        </div>
      </div>

      {/* Info Box */}
      <div className="p-3 rounded-lg bg-accent-cyan/10 border border-accent-cyan/20">
        <p className="text-xs text-accent-cyan">
          Testnet tokens are for development purposes only. The generated hook will handle
          faucet requests and cooldown tracking automatically.
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          <a
            href="https://testnet-explorer.superposition.so"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-accent-cyan/80 hover:text-accent-cyan underline"
          >
            Testnet Explorer
          </a>
          <a
            href="https://docs.superposition.so/native-dapps/faucet"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-accent-cyan/80 hover:text-accent-cyan underline"
          >
            Faucet Docs
          </a>
        </div>
      </div>
    </div>
  );
}
