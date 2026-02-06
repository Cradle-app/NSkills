'use client';

import { useState } from 'react';
import { useBlueprintStore } from '@/store/blueprint';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Coins, Loader2, AlertCircle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import {
  getUniswapExactInputQuote,
  buildUniswapExactInputTx,
  buildUniswapErc20ApproveTx,
  UNISWAP_CONFIG,
  type SupportedUniswapChain,
  type UniswapTransactionRequest,
} from '@cradle/uniswap-swap';

interface Props {
  nodeId: string;
  config: Record<string, unknown>;
}

export function UniswapSwapForm({ nodeId, config }: Props) {
  const { updateNodeConfig } = useBlueprintStore();

  const [tokenIn, setTokenIn] = useState('');
  const [tokenOut, setTokenOut] = useState('');
  const [amountInWei, setAmountInWei] = useState('');
  const [recipient, setRecipient] = useState('');
  const [slippageBps, setSlippageBps] = useState(
    typeof config.defaultSlippageBps === 'number'
      ? Number(config.defaultSlippageBps)
      : 50
  );

  const [quoteAmountOut, setQuoteAmountOut] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [txPreview, setTxPreview] = useState<UniswapTransactionRequest | null>(
    null
  );
  const [txError, setTxError] = useState<Error | null>(null);
  const [sending, setSending] = useState(false);
  const [sendHash, setSendHash] = useState<string | null>(null);
  const [sendError, setSendError] = useState<Error | null>(null);
  const [approveAmountWei, setApproveAmountWei] = useState('');

  const updateConfig = (key: string, value: unknown) => {
    updateNodeConfig(nodeId, { ...config, [key]: value });
  };

  const chainRaw = (config.chain as string) ?? 'arbitrum';
  const chain: SupportedUniswapChain =
    chainRaw === 'arbitrum' ||
    chainRaw === 'arbitrum-sepolia' ||
    chainRaw === 'ethereum-sepolia'
      ? (chainRaw as SupportedUniswapChain)
      : 'arbitrum';

  const chainConfig = UNISWAP_CONFIG[chain];

  const TOKENS_BY_CHAIN: Record<
    SupportedUniswapChain,
    { symbol: string; name: string; address: string }[]
  > = {
    arbitrum: [
      {
        symbol: 'WETH',
        name: 'Wrapped Ether',
        address: chainConfig.contracts.weth,
      },
      {
        symbol: 'USDC',
        name: 'USD Coin',
        address: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
      },
      {
        symbol: 'LINK',
        name: 'Chainlink',
        address: '0xf97f4df75117a78c1A5a0DBb814Af92458539FB4',
      },
    ],
    'arbitrum-sepolia': [
      {
        symbol: 'WETH',
        name: 'Wrapped Ether',
        address: UNISWAP_CONFIG['arbitrum-sepolia'].contracts.weth,
      },
    ],
    'ethereum-sepolia': [
      {
        symbol: 'WETH',
        name: 'Wrapped Ether',
        address: UNISWAP_CONFIG['ethereum-sepolia'].contracts.weth,
      },
    ],
  };

  const availableTokens = TOKENS_BY_CHAIN[chain];

  const handleQuoteAndBuild = async () => {
    setError(null);
    setTxError(null);
    setTxPreview(null);
    setQuoteAmountOut(null);

    try {
      if (!tokenIn || tokenIn.length !== 42) {
        throw new Error('Enter a valid tokenIn address (0x...).');
      }
      if (!tokenOut || tokenOut.length !== 42) {
        throw new Error('Enter a valid tokenOut address (0x...).');
      }
      if (!amountInWei || BigInt(amountInWei) <= 0n) {
        throw new Error('Enter amount in wei (> 0).');
      }
      if (!recipient || recipient.length !== 42) {
        throw new Error('Enter a valid recipient address (0x...).');
      }
      if (slippageBps <= 0 || slippageBps > 5000) {
        throw new Error('Slippage must be between 1 and 5000 bps (0.01%–50%).');
      }

      setLoading(true);

      const quote = await getUniswapExactInputQuote({
        chain,
        tokenIn,
        tokenOut,
        amountIn: amountInWei,
      });

      setQuoteAmountOut(quote.amountOut);

      const minAmountOut =
        (BigInt(quote.amountOut) *
          BigInt(10_000 - Math.floor(slippageBps))) /
        BigInt(10_000);

      const tx = buildUniswapExactInputTx({
        chain,
        tokenIn,
        tokenOut,
        amountIn: amountInWei,
        minAmountOut: minAmountOut.toString(),
        recipient,
      });

      setTxPreview(tx);
    } catch (e) {
      const err = e instanceof Error ? e : new Error('Failed to build swap');
      setTxError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleBuildApprove = () => {
    setError(null);
    setTxError(null);
    setTxPreview(null);
    setQuoteAmountOut(null);

    try {
      if (!tokenIn || tokenIn.length !== 42) {
        throw new Error('Select a valid token to approve.');
      }

      const amount =
        approveAmountWei && BigInt(approveAmountWei) > 0n
          ? approveAmountWei
          : amountInWei;

      if (!amount || BigInt(amount) <= 0n) {
        throw new Error('Enter approve amount in wei (> 0).');
      }

      const tx = buildUniswapErc20ApproveTx({
        tokenAddress: tokenIn,
        spender: chainConfig.contracts.uniswapRouter,
        amount,
      });

      setTxPreview(tx);
    } catch (e) {
      const err = e instanceof Error ? e : new Error('Failed to build approval');
      setTxError(err);
    }
  };

  const handleSendWithMetamask = async () => {
    if (!txPreview) return;
    setSendError(null);
    setSendHash(null);
    setSending(true);

    try {
      if (typeof window === 'undefined' || !(window as any).ethereum) {
        throw new Error(
          'No EIP-1193 wallet found. Please install or open MetaMask.'
        );
      }

      const ethereum = (window as any).ethereum;

      const accounts: string[] = await ethereum.request({
        method: 'eth_requestAccounts',
      });
      const from = accounts?.[0];
      if (!from) {
        throw new Error('No account connected in MetaMask.');
      }

      const valueDec = txPreview.value ?? '0';
      const valueHex =
        valueDec.startsWith('0x') || valueDec.startsWith('0X')
          ? valueDec
          : `0x${BigInt(valueDec).toString(16)}`;

      const txParams = {
        from,
        to: txPreview.to,
        data: txPreview.data,
        value: valueHex,
      };

      const txHash: string = await ethereum.request({
        method: 'eth_sendTransaction',
        params: [txParams],
      });

      setSendHash(txHash);
    } catch (e) {
      setSendError(
        e instanceof Error ? e : new Error('Failed to send transaction')
      );
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="p-3 rounded-lg border border-forge-border/50 bg-forge-bg/50">
        <div className="flex items-center gap-2 mb-2">
          <Coins className="w-4 h-4 text-accent-cyan" />
          <span className="text-sm font-medium text-white">Uniswap V3 Swap</span>
        </div>
        <p className="text-xs text-forge-muted">
          Build calldata for exact-input swaps on Uniswap V3. Supports Arbitrum
          mainnet and Arbitrum/Ethereum Sepolia.
        </p>
      </div>

      {/* 1. Select Network */}
      <div>
        <label className="text-xs text-forge-muted mb-1.5 block">
          1. Select Network
        </label>
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => updateConfig('chain', 'arbitrum')}
            className={cn(
              'px-3 py-2.5 rounded-lg border text-xs font-medium transition-all',
              chainRaw === 'arbitrum'
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
              'px-3 py-2.5 rounded-lg border text-xs font-medium transition-all',
              chainRaw === 'arbitrum-sepolia'
                ? 'border-white bg-forge-elevated text-white'
                : 'border-forge-border/50 bg-forge-bg/50 text-forge-muted hover:border-forge-border'
            )}
          >
            Arbitrum Sepolia
          </button>
          <button
            type="button"
            onClick={() => updateConfig('chain', 'ethereum-sepolia')}
            className={cn(
              'px-3 py-2.5 rounded-lg border text-xs font-medium transition-all',
              chainRaw === 'ethereum-sepolia'
                ? 'border-white bg-forge-elevated text-white'
                : 'border-forge-border/50 bg-forge-bg/50 text-forge-muted hover:border-forge-border'
            )}
          >
            Ethereum Sepolia
          </button>
        </div>
      </div>

      {/* 2. Router info (read-only) */}
      <div>
        <label className="text-xs text-forge-muted mb-1.5 block">
          2. Uniswap V3 Router (this chain)
        </label>
        <div className="p-2 rounded-lg border border-forge-border/50 bg-forge-bg/50 font-mono text-[10px] text-forge-muted break-all">
          Router: {chainConfig.contracts.uniswapRouter}
        </div>
      </div>

      {/* 3. Build transaction calldata */}
      <div>
        <label className="text-xs text-forge-muted mb-1.5 block">
          3. Select Tokens & Build Transaction
        </label>
        <p className="text-[10px] text-forge-muted mb-2">
          Choose tokens on this chain, enter an amount in{' '}
          <span className="font-mono">wei</span>, then preview and send an
          Uniswap V3 <span className="font-mono">exactInputSingle</span> swap.
        </p>

        <div className="grid grid-cols-1 gap-2">
          <div className="rounded-lg border border-forge-border/50 bg-forge-bg/50 p-3 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-white">
                1. Select Tokens
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full border border-amber-500/40 bg-amber-500/10 text-amber-300 font-medium">
                {chain === 'arbitrum' ? 'Mainnet' : 'Testnet'}
              </span>
            </div>

            <div className="space-y-2">
              <div>
                <p className="text-[10px] text-forge-muted mb-1">From</p>
                <Select
                  value={tokenIn || ''}
                  onValueChange={(value) => setTokenIn(value)}
                >
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue placeholder="Select token..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availableTokens.map((token) => (
                      <SelectItem key={token.address} value={token.address}>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium">
                            {token.symbol}
                          </span>
                          <span className="text-[10px] text-forge-muted">
                            {token.name}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-center">
                <div className="w-7 h-7 rounded-full border border-forge-border/60 bg-forge-bg flex items-center justify-center text-forge-muted text-xs">
                  ↓
                </div>
              </div>

              <div>
                <p className="text-[10px] text-forge-muted mb-1">To</p>
                <Select
                  value={tokenOut || ''}
                  onValueChange={(value) => setTokenOut(value)}
                >
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue placeholder="Select token..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availableTokens.map((token) => (
                      <SelectItem key={token.address} value={token.address}>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium">
                            {token.symbol}
                          </span>
                          <span className="text-[10px] text-forge-muted">
                            {token.name}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-forge-border/50 bg-forge-bg/50 p-3 space-y-2">
            <span className="text-xs font-medium text-white">
              2. Enter Amount & Recipient
            </span>

            <Input
              type="text"
              placeholder="Amount In (wei)"
              value={amountInWei}
              onChange={(e) => setAmountInWei(e.target.value)}
              className="text-xs h-8 font-mono"
            />
            <Input
              type="text"
              placeholder="Recipient address (0x...)"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              className="text-xs h-8 font-mono"
            />
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min={1}
                max={5000}
                placeholder="Slippage (bps, e.g. 50 = 0.5%)"
                value={slippageBps}
                onChange={(e) => {
                  const next = Number(e.target.value || '0');
                  setSlippageBps(next);
                  updateConfig('defaultSlippageBps', next);
                }}
                className="text-xs h-8"
              />
              <span className="text-[10px] text-forge-muted">
                100 bps = 1%
              </span>
            </div>
          </div>

          <div className="rounded-lg border border-forge-border/50 bg-forge-bg/50 p-3 space-y-2">
            <span className="text-xs font-medium text-white">
              3. Optional: Approve token for router
            </span>
            <p className="text-[10px] text-forge-muted">
              Approve the <span className="font-mono">From</span> token for the
              Uniswap router ({chainConfig.contracts.uniswapRouter}) before
              swapping, if needed.
            </p>
            <Input
              type="text"
              placeholder="Approve amount (wei, defaults to Amount In)"
              value={approveAmountWei}
              onChange={(e) => setApproveAmountWei(e.target.value)}
              className="text-xs h-8 font-mono"
            />
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={handleBuildApprove}
              disabled={loading}
            >
              Build approval calldata
            </Button>
          </div>

          <span className="text-[10px] text-forge-muted mt-1">
            4. Preview and send the approval or swap from your wallet.
          </span>

          <Button
            type="button"
            onClick={handleQuoteAndBuild}
            size="sm"
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              'Get quote + build calldata'
            )}
          </Button>

          {error && (
            <div className="flex items-start gap-2 p-2 rounded-lg bg-red-500/10 border border-red-500/20">
              <AlertCircle className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-xs font-medium text-red-400">Error</p>
                <p className="text-[10px] text-red-300 mt-0.5">
                  {error.message}
                </p>
              </div>
            </div>
          )}

          {txError && (
            <div className="flex items-start gap-2 p-2 rounded-lg bg-red-500/10 border border-red-500/20">
              <AlertCircle className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-xs font-medium text-red-400">Tx build error</p>
                <p className="text-[10px] text-red-300 mt-0.5">
                  {txError.message}
                </p>
              </div>
            </div>
          )}

          {txPreview && !txError && (
            <div className="p-3 rounded-lg bg-forge-elevated/50 border border-forge-border/50 space-y-2">
              <p className="text-xs font-medium text-white">
                Transaction Preview
              </p>
              <div className="grid grid-cols-1 gap-1 text-[10px]">
                {quoteAmountOut && (
                  <div className="flex justify-between gap-4">
                    <span className="text-forge-muted shrink-0">
                      quoted amountOut
                    </span>
                    <span className="font-mono text-white break-all text-right">
                      {quoteAmountOut}
                    </span>
                  </div>
                )}
                <div className="flex justify-between gap-4">
                  <span className="text-forge-muted shrink-0">to</span>
                  <span className="font-mono text-white break-all text-right">
                    {txPreview.to}
                  </span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-forge-muted shrink-0">value</span>
                  <span className="font-mono text-white break-all text-right">
                    {txPreview.value ?? '0'}
                  </span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-forge-muted shrink-0">data</span>
                  <span className="font-mono text-white break-all text-right">
                    {txPreview.data}
                  </span>
                </div>
              </div>
              <div className="pt-2 flex flex-col gap-2">
                <Button
                  type="button"
                  size="sm"
                  onClick={handleSendWithMetamask}
                  disabled={sending}
                  className="self-start"
                >
                  {sending ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    'Send via MetaMask'
                  )}
                </Button>
                {sendError && (
                  <div className="flex items-start gap-2 p-2 rounded-lg bg-red-500/10 border border-red-500/20">
                    <AlertCircle className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-xs font-medium text-red-400">
                        Wallet error
                      </p>
                      <p className="text-[10px] text-red-300 mt-0.5">
                        {sendError.message}
                      </p>
                    </div>
                  </div>
                )}
                {sendHash && (
                  <div className="text-[10px] text-forge-muted break-all">
                    <span className="font-medium text-white">Tx hash:</span>{' '}
                    <span className="font-mono">{sendHash}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-start gap-1.5 p-2 rounded bg-forge-elevated/50 border border-forge-border/30">
        <Info className="w-3 h-3 text-forge-muted shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-[10px] text-forge-muted leading-relaxed">
            This panel helps you generate Uniswap V3 swap calldata and test it
            directly with your wallet. Ensure the selected network in MetaMask
            matches the chain configured here.
          </p>
        </div>
      </div>
    </div>
  );
}

