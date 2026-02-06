'use client';

import { useState, useCallback } from 'react';
import { useBlueprintStore } from '@/store/blueprint';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Droplets, Coins, Clock, RefreshCw, Info, ExternalLink, CheckCircle2, AlertTriangle, Wallet } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  formStyles,
  labelStyles,
  toggleRowStyles,
  cardStyles,
  codeStyles,
  statusStyles,
  actionStyles,
  FormHeader
} from './shared-styles';

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
    <div className={formStyles.container}>
      <FormHeader
        icon={Droplets}
        title="Testnet Faucet"
        description="Configure automatic testnet token requests for development."
      />

      {/* Token Selection */}
      <div className={formStyles.section}>
        <div className="flex items-center gap-2 mb-2">
          <Coins className="w-4 h-4 text-[hsl(var(--color-text-muted))]" />
          <span className="text-xs font-semibold text-[hsl(var(--color-text-secondary))] tracking-wide uppercase">Supported Tokens</span>
        </div>
        <div className="space-y-2">
          {TOKENS.map((token) => (
            <div
              key={token.value}
              className={toggleRowStyles.row}
            >
              <div>
                <p className={toggleRowStyles.title}>{token.label}</p>
                <p className={toggleRowStyles.description}>{token.description}</p>
              </div>
              <Switch
                checked={tokens.includes(token.value) || (token.value !== 'all' && tokens.includes('all'))}
                onCheckedChange={() => handleTokenToggle(token.value)}
              />
            </div>
          ))}
        </div>
      </div>

      <div className={formStyles.section}>
        <div className={toggleRowStyles.row}>
          <div>
            <p className={toggleRowStyles.title}>Faucet Hook</p>
            <p className={toggleRowStyles.description}>Generate useSuperpositionFaucet hook</p>
          </div>
          <Switch
            checked={(config.generateFaucetHook as boolean) ?? true}
            onCheckedChange={(checked) => handleChange('generateFaucetHook', checked)}
          />
        </div>

        <div className={toggleRowStyles.row}>
          <div>
            <p className={toggleRowStyles.title}>Faucet UI</p>
            <p className={toggleRowStyles.description}>Generate faucet request component</p>
          </div>
          <Switch
            checked={(config.generateFaucetUI as boolean) ?? true}
            onCheckedChange={(checked) => handleChange('generateFaucetUI', checked)}
          />
        </div>

        <div className={toggleRowStyles.row}>
          <div>
            <p className={toggleRowStyles.title}>Cooldown Timer</p>
            <p className={toggleRowStyles.description}>Show time until next request (5h)</p>
          </div>
          <Switch
            checked={(config.includeCooldownTimer as boolean) ?? true}
            onCheckedChange={(checked) => handleChange('includeCooldownTimer', checked)}
          />
        </div>

        <div className={toggleRowStyles.row}>
          <div>
            <p className={toggleRowStyles.title}>Balance Check</p>
            <p className={toggleRowStyles.description}>Include testnet balance hooks</p>
          </div>
          <Switch
            checked={(config.includeBalanceCheck as boolean) ?? true}
            onCheckedChange={(checked) => handleChange('includeBalanceCheck', checked)}
          />
        </div>
      </div>

      {/* Live Balance Check */}
      <div className={cardStyles.base}>
        <div className={cardStyles.cardHeader}>
          <Wallet className={cn(cardStyles.cardIcon, 'text-[hsl(var(--color-text-muted))]')} />
          <span className={cardStyles.cardTitle}>Check Testnet Balances</span>
        </div>

        <div className="space-y-4">
          <p className={cardStyles.cardBody}>Enter a wallet address to check testnet token balances</p>

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
              className={cn(actionStyles.primary, "mb-[1px]")}
              style={{ padding: '0.625rem 1rem' }}
            >
              {balanceStatus.status === 'loading' ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : 'Check'}
            </button>
          </div>

          {/* Balance Results */}
          {balanceStatus.status === 'success' && balanceStatus.balances && (
            <div className={statusStyles.connected}>
              <div className={statusStyles.statusHeader}>
                <CheckCircle2 className={cn(statusStyles.statusIcon, statusStyles.statusIconConnected)} />
                <span className={statusStyles.statusTitle}>Testnet Balances</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-[hsl(var(--color-text-muted))]">SPN:</span>
                  <span className="text-[hsl(var(--color-success))] font-mono">{balanceStatus.balances.SPN}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[hsl(var(--color-text-muted))]">wSPN:</span>
                  <span className="text-[hsl(var(--color-success))] font-mono">{balanceStatus.balances.wSPN}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[hsl(var(--color-text-muted))]">fUSDC:</span>
                  <span className="text-[hsl(var(--color-success))] font-mono">{balanceStatus.balances.fUSDC}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[hsl(var(--color-text-muted))]">CATBUX:</span>
                  <span className="text-[hsl(var(--color-success))] font-mono">{balanceStatus.balances.CATBUX}</span>
                </div>
              </div>
            </div>
          )}

          {balanceStatus.status === 'error' && (
            <div className={cn(cardStyles.base, "bg-[hsl(var(--color-error)/0.08)] border-[hsl(var(--color-error)/0.2)]")}>
              <div className={statusStyles.statusHeader}>
                <AlertTriangle className={cn(statusStyles.statusIcon, "text-[hsl(var(--color-error))]")} />
                <span className={cn(statusStyles.statusTitle, "text-[hsl(var(--color-error))]")}>Error</span>
              </div>
              <p className={statusStyles.statusDetail}>{balanceStatus.error}</p>
            </div>
          )}
        </div>
      </div>

      {/* Official Faucet Link */}
      <div className={cn(cardStyles.primary, "bg-gradient-to-r from-[hsl(var(--color-accent-primary)/0.15)] to-transparent")}>
        <div className="flex items-center justify-between mb-2">
          <div>
            <p className={cardStyles.cardTitle}>Superposition Testnet Faucet</p>
            <p className={cardStyles.cardBody}>Get testnet tokens directly</p>
          </div>
          <a
            href="https://faucet.superposition.so"
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
            Open Faucet <ExternalLink className="w-3 h-3" />
          </a>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="w-3 h-3 text-[hsl(var(--color-accent-primary))]" />
          <p className="text-[10px] text-[hsl(var(--color-accent-primary))]">
            Request tokens once every 24 hours per wallet
          </p>
        </div>
      </div>

      {/* Testnet Token Addresses */}
      <div className={cardStyles.base}>
        <div className={cardStyles.cardHeader}>
          <Coins className={cn(cardStyles.cardIcon, 'text-[hsl(var(--color-text-muted))]')} />
          <span className={cardStyles.cardTitle}>Testnet Token Addresses</span>
        </div>
        <div className="space-y-1.5 text-xs font-mono">
          <div className="flex justify-between items-center">
            <span className="text-[hsl(var(--color-text-muted))]">wSPN:</span>
            <span className={codeStyles.inline}>0x22b9...214c</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[hsl(var(--color-text-muted))]">fUSDC:</span>
            <span className={codeStyles.inline}>0xA8EA...0115</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[hsl(var(--color-text-muted))]">CATBUX:</span>
            <span className={codeStyles.inline}>0x36c1...B99</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[hsl(var(--color-text-muted))]">Faucet:</span>
            <span className={codeStyles.inline}>0xD191...2B</span>
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
          Testnet tokens are for development purposes only.
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          <a
            href="https://testnet-explorer.superposition.so"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] text-[hsl(var(--color-accent-primary))] hover:underline"
          >
            Testnet Explorer
          </a>
          <a
            href="https://docs.superposition.so/native-dapps/faucet"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] text-[hsl(var(--color-accent-primary))] hover:underline"
          >
            Faucet Docs
          </a>
        </div>
      </div>
    </div>
  );
}
