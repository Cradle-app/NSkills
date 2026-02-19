'use client';

import { useState, useCallback } from 'react';
import { encodeFunctionData, parseUnits, formatUnits } from 'viem';
import { useBlueprintStore } from '@/store/blueprint';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { CandlestickChart, Info, RefreshCw, FileText, CheckCircle2, AlertTriangle, ExternalLink, Activity, ArrowRightLeft } from 'lucide-react';
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

// Longtail contract addresses (verified from docs.long.so)
const LONGTAIL_CONTRACTS = {
  AMM: '0xF3334049A3ce7e890bd4f8C6a0FBC70e38fd3746',
  NFT_MANAGER: '0xdD193817F66276d1EAd064dF8F3112b553A50d10',
  POSITION_HANDLER: '0x1aC593E976bD676Aa9609677AB41d52436e40260',
  PERMIT2_ROUTER: '0x244517Dc59943E8CdFbD424Bdb3262c5f04a1387',
  // Quoter contracts for getting swap quotes
  QUOTER_A: '0xcb937ecaf8cf29dd9bdb45418d17cfee74673535',
  QUOTER_B: '0x0314353a14099895d2510483b18b52e7bd1a2528',
};

const COMMON_TOKENS = {
  USDC: { address: '0x6c030c5CC283F791B26816f325b9C632d964F8A1', symbol: 'USDC', decimals: 6 },
  WETH: { address: '0x1fB719f10b56d7a85DCD32f27f897375fB21cfdd', symbol: 'WETH', decimals: 18 },
  ARB: { address: '0xA2555701754464d32D9624149E3fDb459F3c8DE4', symbol: 'ARB', decimals: 18 },
  FLY: { address: '0x80eFAD50D395671C13C4b1FA2969f7a7Aa9EF7b3', symbol: 'FLY', decimals: 18 },
};

const RPC_URL = 'https://rpc.superposition.so';

interface ContractStatus {
  status: 'idle' | 'checking' | 'success' | 'error';
  blockNumber?: string;
  error?: string;
}

interface QuoteStatus {
  status: 'idle' | 'fetching' | 'success' | 'error';
  amountOut?: string;
  error?: string;
}

interface Props {
  nodeId: string;
  config: Record<string, unknown>;
}

const FEATURES = [
  { value: 'swap', label: 'Swap', description: 'Token swap functionality' },
  { value: 'liquidity', label: 'Liquidity', description: 'Provide/remove liquidity' },
  { value: 'pool-queries', label: 'Pool Queries', description: 'Query pool information' },
  { value: 'price-feeds', label: 'Price Feeds', description: 'Token price data' },
];

const SLIPPAGE_OPTIONS = [
  { value: '0.1', label: '0.1%' },
  { value: '0.5', label: '0.5% (Default)' },
  { value: '1', label: '1%' },
  { value: '2', label: '2%' },
  { value: '5', label: '5%' },
];

export function SuperpositionLongtailForm({ nodeId, config }: Props) {
  const { updateNodeConfig } = useBlueprintStore();
  const [contractStatus, setContractStatus] = useState<ContractStatus>({ status: 'idle' });
  const [quoteAmount, setQuoteAmount] = useState('');
  const [tokenIn, setTokenIn] = useState<string>('USDC');
  const [tokenOut, setTokenOut] = useState<string>('WETH');
  const [quoteStatus, setQuoteStatus] = useState<QuoteStatus>({ status: 'idle' });

  const handleChange = (key: string, value: unknown) => {
    updateNodeConfig(nodeId, { [key]: value });
  };

  // Verify Longtail AMM contract is deployed
  const verifyContracts = useCallback(async () => {
    setContractStatus({ status: 'checking' });
    try {
      // Get the latest block and verify the contract exists
      const [blockResponse, codeResponse] = await Promise.all([
        fetch(RPC_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            method: 'eth_blockNumber',
            params: [],
            id: 1,
          }),
        }),
        fetch(RPC_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            method: 'eth_getCode',
            params: [LONGTAIL_CONTRACTS.AMM, 'latest'],
            id: 2,
          }),
        }),
      ]);

      const blockData = await blockResponse.json();
      const codeData = await codeResponse.json();

      if (codeData.result && codeData.result !== '0x' && codeData.result.length > 10) {
        const blockNumber = parseInt(blockData.result, 16).toLocaleString();
        setContractStatus({ status: 'success', blockNumber });
      } else {
        setContractStatus({ status: 'error', error: 'Contract not found at address' });
      }
    } catch (err) {
      setContractStatus({
        status: 'error',
        error: err instanceof Error ? err.message : 'Failed to verify contract',
      });
    }
  }, []);

  const toggleFeature = (feature: string) => {
    const currentFeatures = (config.features as string[]) || ['swap', 'pool-queries'];
    const newFeatures = currentFeatures.includes(feature)
      ? currentFeatures.filter(f => f !== feature)
      : [...currentFeatures, feature];
    handleChange('features', newFeatures);
  };

  // Get swap quote using Longtail Quoter contract
  const getSwapQuote = useCallback(async () => {
    if (!quoteAmount || parseFloat(quoteAmount) <= 0) {
      setQuoteStatus({ status: 'error', error: 'Please enter a valid amount' });
      return;
    }

    const inToken = COMMON_TOKENS[tokenIn as keyof typeof COMMON_TOKENS];
    const outToken = COMMON_TOKENS[tokenOut as keyof typeof COMMON_TOKENS];

    if (!inToken || !outToken) {
      setQuoteStatus({ status: 'error', error: 'Invalid token selection' });
      return;
    }

    if (tokenIn === tokenOut) {
      setQuoteStatus({ status: 'error', error: 'Please select different tokens' });
      return;
    }

    setQuoteStatus({ status: 'fetching' });

    try {
      const fee = 3000; // 0.3% default fee tier
      const amountIn = parseUnits(quoteAmount, inToken.decimals);
      const sqrtPriceLimitX96 = BigInt(0); // No price limit

      // Try Quoter A first, then fallback to Quoter B
      const quoters = [LONGTAIL_CONTRACTS.QUOTER_A, LONGTAIL_CONTRACTS.QUOTER_B];

      // Encode quoteExactInputSingle function call
      const quoteCallData = encodeFunctionData({
        abi: [
          {
            name: 'quoteExactInputSingle',
            type: 'function',
            stateMutability: 'nonpayable',
            inputs: [
              { name: 'tokenIn', type: 'address' },
              { name: 'tokenOut', type: 'address' },
              { name: 'fee', type: 'uint24' },
              { name: 'amountIn', type: 'uint256' },
              { name: 'sqrtPriceLimitX96', type: 'uint160' },
            ],
            outputs: [{ name: 'amountOut', type: 'uint256' }],
          },
        ],
        functionName: 'quoteExactInputSingle',
        args: [
          inToken.address as `0x${string}`,
          outToken.address as `0x${string}`,
          fee,
          amountIn,
          sqrtPriceLimitX96,
        ],
      });

      let lastError: Error | null = null;

      // Try both quoter contracts
      for (const quoterAddress of quoters) {
        try {
          const response = await fetch(RPC_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              jsonrpc: '2.0',
              method: 'eth_call',
              params: [
                {
                  to: quoterAddress,
                  data: quoteCallData,
                },
                'latest',
              ],
              id: 1,
            }),
          });

          const data = await response.json();

          if (data.error) {
            lastError = new Error(data.error.message || 'Quoter call failed');
            continue; // Try next quoter
          }

          // Parse the result - it's a uint256 (32 bytes)
          const result = data.result;

          if (!result || result === '0x') {
            lastError = new Error('No quote available - pool may not exist');
            continue;
          }

          const amountOut = BigInt(result);

          // Check if amountOut is 0 (pool might not exist or have liquidity)
          if (amountOut === BigInt(0)) {
            lastError = new Error('Pool has no liquidity or does not exist for this pair');
            continue;
          }

          const amountOutFormatted = formatUnits(amountOut, outToken.decimals);

          setQuoteStatus({
            status: 'success',
            amountOut: amountOutFormatted,
          });
          return; // Success, exit
        } catch (err) {
          lastError = err instanceof Error ? err : new Error('Failed to get quote');
          continue; // Try next quoter
        }
      }

      // If both quoters failed, throw the last error
      throw lastError || new Error('Both quoter contracts failed');

    } catch (err) {
      setQuoteStatus({
        status: 'error',
        error: err instanceof Error ? err.message : 'Failed to get quote',
      });
    }
  }, [quoteAmount, tokenIn, tokenOut]);

  return (
    <div className={formStyles.container}>
      <FormHeader
        icon={CandlestickChart}
        title="Longtail DEX"
        description="Integrate Longtail swaps, liquidity, and data using Arbitrum Stylus."
      />

      {/* Features */}
      <div className={formStyles.section}>
        <div className="flex items-center gap-2 mb-2">
          <Activity className="w-4 h-4 text-[hsl(var(--color-text-muted))]" />
          <span className="text-xs font-semibold text-[hsl(var(--color-text-secondary))] tracking-wide uppercase">Features</span>
        </div>
        <div className="space-y-2">
          {FEATURES.map((feature) => (
            <div
              key={feature.value}
              className={toggleRowStyles.row}
            >
              <div>
                <p className={toggleRowStyles.title}>{feature.label}</p>
                <p className={toggleRowStyles.description}>{feature.description}</p>
              </div>
              <Switch
                checked={((config.features as string[]) || ['swap', 'pool-queries']).includes(feature.value)}
                onCheckedChange={() => toggleFeature(feature.value)}
              />
            </div>
          ))}
        </div>
      </div>

      <div className={formStyles.section}>
        <label className={labelStyles.base}>Default Slippage</label>
        <Select
          value={String((config.defaultSlippage as number) || 0.5)}
          onValueChange={(value) => handleChange('defaultSlippage', parseFloat(value))}
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

      <div className={formStyles.section}>
        <div className={toggleRowStyles.row}>
          <div>
            <p className={toggleRowStyles.title}>Swap UI Component</p>
            <p className={toggleRowStyles.description}>Generate ready-to-use swap interface</p>
          </div>
          <Switch
            checked={(config.generateSwapUI as boolean) ?? true}
            onCheckedChange={(checked) => handleChange('generateSwapUI', checked)}
          />
        </div>

        <div className={toggleRowStyles.row}>
          <div>
            <p className={toggleRowStyles.title}>Liquidity UI Component</p>
            <p className={toggleRowStyles.description}>Generate LP management interface</p>
          </div>
          <Switch
            checked={(config.generateLiquidityUI as boolean) ?? false}
            onCheckedChange={(checked) => handleChange('generateLiquidityUI', checked)}
          />
        </div>

        <div className={toggleRowStyles.row}>
          <div>
            <p className={toggleRowStyles.title}>Generate Hooks</p>
            <p className={toggleRowStyles.description}>useLongtailSwap, useLongtailPool, etc.</p>
          </div>
          <Switch
            checked={(config.generateHooks as boolean) ?? true}
            onCheckedChange={(checked) => handleChange('generateHooks', checked)}
          />
        </div>

        <div className={toggleRowStyles.row}>
          <div>
            <p className={toggleRowStyles.title}>Pool Analytics</p>
            <p className={toggleRowStyles.description}>Include TVL, volume, APR queries</p>
          </div>
          <Switch
            checked={(config.includePoolAnalytics as boolean) ?? true}
            onCheckedChange={(checked) => handleChange('includePoolAnalytics', checked)}
          />
        </div>
      </div>

      {/* Swap Quote Preview */}
      <div className={cardStyles.base}>
        <div className={cardStyles.cardHeader}>
          <ArrowRightLeft className={cn(cardStyles.cardIcon, 'text-[hsl(var(--color-text-muted))]')} />
          <span className={cardStyles.cardTitle}>Swap Quote Preview</span>
        </div>

        <div className="space-y-4">
          {/* Token Pair Selection */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className={labelStyles.base}>From</label>
              <Select value={tokenIn} onValueChange={setTokenIn}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.keys(COMMON_TOKENS).map((key) => (
                    <SelectItem key={key} value={key}>
                      {COMMON_TOKENS[key as keyof typeof COMMON_TOKENS].symbol}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className={labelStyles.base}>To</label>
              <Select value={tokenOut} onValueChange={setTokenOut}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.keys(COMMON_TOKENS).map((key) => (
                    <SelectItem key={key} value={key}>
                      {COMMON_TOKENS[key as keyof typeof COMMON_TOKENS].symbol}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Amount and Action */}
          <div className="flex gap-2 items-end">
            <div className="flex-1 space-y-1.5">
              <label className={labelStyles.base}>Amount</label>
              <Input
                type="number"
                value={quoteAmount}
                onChange={(e) => setQuoteAmount(e.target.value)}
                placeholder="0.0"
              />
            </div>
            <button
              onClick={getSwapQuote}
              disabled={!quoteAmount || quoteStatus.status === 'fetching'}
              className={cn(actionStyles.primary, "mb-[1px]")}
              style={{ padding: '0.625rem 1rem' }}
            >
              {quoteStatus.status === 'fetching' ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : 'Get Quote'}
            </button>
          </div>

          {/* Quote Result */}
          {quoteStatus.status === 'success' && quoteStatus.amountOut && (
            <div className={cardStyles.success}>
              <div className={cardStyles.cardHeader}>
                <CheckCircle2 className={cn(cardStyles.cardIcon, "text-[hsl(var(--color-success))]")} />
                <span className={cardStyles.cardTitle}>Estimated Quote</span>
              </div>
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-[hsl(var(--color-text-muted))]">Estimated Output:</span>
                  <span className="text-[hsl(var(--color-success))] font-mono">
                    {parseFloat(quoteStatus.amountOut).toFixed(6)} {COMMON_TOKENS[tokenOut as keyof typeof COMMON_TOKENS].symbol}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[hsl(var(--color-text-muted))]">Exchange Rate:</span>
                  <span className="text-[hsl(var(--color-text-muted))] text-xs">
                    1 {COMMON_TOKENS[tokenIn as keyof typeof COMMON_TOKENS].symbol} ≈ {quoteAmount && parseFloat(quoteAmount) > 0 ? (parseFloat(quoteStatus.amountOut) / parseFloat(quoteAmount)).toFixed(6) : '0'} {COMMON_TOKENS[tokenOut as keyof typeof COMMON_TOKENS].symbol}
                  </span>
                </div>
                <p className="text-[10px] text-[hsl(var(--color-success)/0.8)] mt-2 pt-2 border-t border-[hsl(var(--color-success)/0.2)]">
                  ✓ Quote from Longtail Quoter contract.
                </p>
              </div>
            </div>
          )}

          {quoteStatus.status === 'error' && (
            <div className={cn(cardStyles.base, "bg-[hsl(var(--color-error)/0.08)] border-[hsl(var(--color-error)/0.2)]")}>
              <div className={cardStyles.cardHeader}>
                <AlertTriangle className={cn(cardStyles.cardIcon, "text-[hsl(var(--color-error))]")} />
                <span className={cn(cardStyles.cardTitle, "text-[hsl(var(--color-error))]")}>Quote Failed</span>
              </div>
              <p className={cn(cardStyles.cardBody, "text-[hsl(var(--color-error)/0.8)]")}>{quoteStatus.error}</p>
            </div>
          )}
        </div>
      </div>

      {/* Verify Contracts */}
      <div className={cardStyles.base}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <FileText className={cn(cardStyles.cardIcon, 'text-[hsl(var(--color-text-muted))]')} />
            <span className={cardStyles.cardTitle}>Verify Contracts</span>
          </div>
          <button
            onClick={verifyContracts}
            disabled={contractStatus.status === 'checking'}
            className={cn(
              "px-3 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5",
              "bg-[hsl(var(--color-accent-primary)/0.15)] text-[hsl(var(--color-accent-primary))]",
              "hover:bg-[hsl(var(--color-accent-primary)/0.25)]",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          >
            {contractStatus.status === 'checking' && <RefreshCw className="w-3 h-3 animate-spin" />}
            {contractStatus.status === 'checking' ? 'Verifying...' : 'Verify'}
          </button>
        </div>

        {contractStatus.status === 'success' && (
          <div className={statusStyles.connected}>
            <div className={statusStyles.statusHeader}>
              <CheckCircle2 className={cn(statusStyles.statusIcon, statusStyles.statusIconConnected)} />
              <span className={statusStyles.statusTitle}>Contracts Verified</span>
            </div>
            <div className="flex justify-between">
              <span className={statusStyles.statusDetail}>Latest Block</span>
              <code className={statusStyles.statusCode}>#{contractStatus.blockNumber}</code>
            </div>
          </div>
        )}

        {contractStatus.status === 'error' && (
          <div className={cn(cardStyles.base, "bg-[hsl(var(--color-error)/0.08)] border-[hsl(var(--color-error)/0.2)]")}>
            <div className={statusStyles.statusHeader}>
              <AlertTriangle className={cn(statusStyles.statusIcon, "text-[hsl(var(--color-error))]")} />
              <span className={cn(statusStyles.statusTitle, "text-[hsl(var(--color-error))]")}>Verification Failed</span>
            </div>
            <p className={statusStyles.statusDetail}>{contractStatus.error}</p>
          </div>
        )}
      </div>

      {/* Contract Addresses */}
      <div className={cardStyles.base}>
        <div className={cardStyles.cardHeader}>
          <FileText className={cn(cardStyles.cardIcon, 'text-[hsl(var(--color-text-muted))]')} />
          <span className={cardStyles.cardTitle}>Contract Addresses</span>
        </div>
        <div className="space-y-1.5 text-xs font-mono">
          <div className="flex justify-between items-center">
            <span className="text-[hsl(var(--color-text-muted))]">AMM:</span>
            <span className={codeStyles.inline}>{LONGTAIL_CONTRACTS.AMM.slice(0, 6)}...{LONGTAIL_CONTRACTS.AMM.slice(-4)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[hsl(var(--color-text-muted))]">NFT Manager:</span>
            <span className={codeStyles.inline}>{LONGTAIL_CONTRACTS.NFT_MANAGER.slice(0, 6)}...{LONGTAIL_CONTRACTS.NFT_MANAGER.slice(-4)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[hsl(var(--color-text-muted))]">Permit2:</span>
            <span className={codeStyles.inline}>{LONGTAIL_CONTRACTS.PERMIT2_ROUTER.slice(0, 6)}...{LONGTAIL_CONTRACTS.PERMIT2_ROUTER.slice(-4)}</span>
          </div>
        </div>
      </div>

      {/* Common Tokens */}
      <div className={cardStyles.base}>
        <div className={cardStyles.cardHeader}>
          <Info className={cn(cardStyles.cardIcon, 'text-[hsl(var(--color-text-muted))]')} />
          <span className={cardStyles.cardTitle}>Supported Tokens</span>
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          {Object.entries(COMMON_TOKENS).map(([key, token]) => (
            <div key={key} className="flex justify-between items-center">
              <span className="text-[hsl(var(--color-text-muted))]">{token.symbol}:</span>
              <span className={codeStyles.inline}>{token.address.slice(0, 6)}...{token.address.slice(-4)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Longtail App Link */}
      <div className={cn(cardStyles.primary, "bg-gradient-to-r from-[hsl(var(--color-accent-primary)/0.15)] to-transparent")}>
        <div className="flex items-center justify-between mb-2">
          <div>
            <p className={cardStyles.cardTitle}>Longtail DEX</p>
            <p className={cardStyles.cardBody}>Trade directly on Longtail</p>
          </div>
          <a
            href="https://long.so"
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg",
              "text-xs font-medium",
              "bg-[hsl(var(--color-accent-primary))]",
              "text-black", // Keep black text for contrast on primary color button
              "hover:bg-[hsl(var(--color-accent-primary)/0.9)]",
              "transition-colors"
            )}
          >
            Open App <ExternalLink className="w-3 h-3" />
          </a>
        </div>
        <p className="text-[10px] text-[hsl(var(--color-accent-primary))]">
          4x cheaper than Uniswap V3, earn Utility Mining rewards on every swap
        </p>
      </div>

      {/* Info Box */}
      <div className={cardStyles.info}>
        <div className={cardStyles.cardHeader}>
          <Info className={cn(cardStyles.cardIcon, 'text-[hsl(var(--color-info))]')} />
          <span className={cardStyles.cardTitle}>Documentation</span>
        </div>
        <p className={cardStyles.cardBody}>
          Longtail is Superposition's native DEX built with Arbitrum Stylus.
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          <a
            href="https://docs.long.so"
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
        </div>
      </div>
    </div>
  );
}
