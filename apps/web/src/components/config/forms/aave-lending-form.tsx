'use client';

import { useState } from 'react';
import { useBlueprintStore } from '@/store/blueprint';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Coins, Loader2, AlertCircle, Info, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  getAaveAccountData,
  buildAaveSupplyTx,
  buildAaveWithdrawTx,
  buildAaveBorrowTx,
  buildAaveRepayTx,
  buildAaveSetCollateralTx,
  buildErc20ApproveTx,
  AAVE_CONFIG,
} from '@cradle/aave-lending';
import type {
  SupportedAaveChain,
  AaveAccountData,
  AaveOperation,
  AaveInterestRateMode,
  AaveTransactionRequest,
} from '@cradle/aave-lending';

interface Props {
  nodeId: string;
  config: Record<string, unknown>;
}

export function AaveLendingForm({ nodeId, config }: Props) {
  const { updateNodeConfig } = useBlueprintStore();
  const [walletAddress, setWalletAddress] = useState('');
  const [accountData, setAccountData] = useState<AaveAccountData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [fetched, setFetched] = useState(false);
  const [op, setOp] = useState<AaveOperation>('supply');
  const [assetAddress, setAssetAddress] = useState('');
  const [amountWei, setAmountWei] = useState('');
  const [toAddress, setToAddress] = useState('');
  const [onBehalfOf, setOnBehalfOf] = useState('');
  const [interestRateMode, setInterestRateMode] =
    useState<AaveInterestRateMode>('variable');
  const [useAsCollateral, setUseAsCollateral] = useState(true);
  const [approveToken, setApproveToken] = useState('');
  const [approveSpender, setApproveSpender] = useState('');
  const [approveAmountWei, setApproveAmountWei] = useState('');
  const [txPreview, setTxPreview] = useState<AaveTransactionRequest | null>(null);
  const [txError, setTxError] = useState<Error | null>(null);
  const [sending, setSending] = useState(false);
  const [sendHash, setSendHash] = useState<string | null>(null);
  const [sendError, setSendError] = useState<Error | null>(null);

  const updateConfig = (key: string, value: unknown) => {
    updateNodeConfig(nodeId, { ...config, [key]: value });
  };

  const chainRaw = (config.chain as string) ?? 'arbitrum';
  const chain = (chainRaw === 'arbitrum' || chainRaw === 'arbitrum-sepolia' || chainRaw === 'ethereum-sepolia'
    ? chainRaw
    : 'arbitrum') as SupportedAaveChain;
  const poolAddress = config.poolAddress as string | undefined;
  const poolDataProviderAddress = config.poolDataProviderAddress as string | undefined;

  const handleFetchAccountData = async () => {
    if (!walletAddress || walletAddress.length !== 42) return;
    setLoading(true);
    setError(null);
    setAccountData(null);
    setFetched(true);
    try {
      const result = await getAaveAccountData({
        chain,
        walletAddress,
        poolAddress,
        poolDataProviderAddress,
      });
      setAccountData(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch account data'));
    } finally {
      setLoading(false);
    }
  };

  const poolConfig = AAVE_CONFIG[chain];

  const handleBuildTx = () => {
    setTxError(null);
    setTxPreview(null);

    try {
      if (op === 'erc20-approve') {
        if (!approveToken || approveToken.length !== 42) {
          throw new Error('Enter a valid token address for approve.');
        }
        if (!approveSpender || approveSpender.length !== 42) {
          throw new Error('Enter a valid spender address for approve.');
        }
        if (!approveAmountWei || BigInt(approveAmountWei) <= 0n) {
          throw new Error('Enter approve amount in wei (> 0).');
        }
        setTxPreview(
          buildErc20ApproveTx({
            tokenAddress: approveToken,
            spender: approveSpender,
            amount: approveAmountWei,
          })
        );
        return;
      }

      if (!assetAddress || assetAddress.length !== 42) {
        throw new Error('Enter a valid asset address.');
      }

      // Most operations take an amount. Collateral enable/disable doesn't.
      const needsAmount =
        op === 'supply' || op === 'withdraw' || op === 'borrow' || op === 'repay';
      if (needsAmount) {
        if (!amountWei || BigInt(amountWei) <= 0n) {
          throw new Error('Enter amount in wei (> 0).');
        }
      }

      const resolvedOnBehalfOf = onBehalfOf && onBehalfOf.length === 42 ? onBehalfOf : walletAddress;
      const resolvedTo = toAddress && toAddress.length === 42 ? toAddress : walletAddress;

      if ((op === 'supply' || op === 'borrow' || op === 'repay') && (!resolvedOnBehalfOf || resolvedOnBehalfOf.length !== 42)) {
        throw new Error('Enter a wallet address (or onBehalfOf) to build this tx.');
      }
      if (op === 'withdraw' && (!resolvedTo || resolvedTo.length !== 42)) {
        throw new Error('Enter a wallet address (or to) to build this tx.');
      }

      switch (op) {
        case 'supply':
          setTxPreview(
            buildAaveSupplyTx({
              chain,
              assetAddress,
              amount: amountWei,
              onBehalfOf: resolvedOnBehalfOf,
              poolAddress,
            })
          );
          break;
        case 'withdraw':
          setTxPreview(
            buildAaveWithdrawTx({
              chain,
              assetAddress,
              amount: amountWei,
              to: resolvedTo,
              poolAddress,
            })
          );
          break;
        case 'borrow':
          setTxPreview(
            buildAaveBorrowTx({
              chain,
              assetAddress,
              amount: amountWei,
              interestRateMode,
              onBehalfOf: resolvedOnBehalfOf,
              poolAddress,
            })
          );
          break;
        case 'repay':
          setTxPreview(
            buildAaveRepayTx({
              chain,
              assetAddress,
              amount: amountWei,
              interestRateMode,
              onBehalfOf: resolvedOnBehalfOf,
              poolAddress,
            })
          );
          break;
        case 'enable-collateral':
        case 'disable-collateral':
          setTxPreview(
            buildAaveSetCollateralTx({
              chain,
              assetAddress,
              useAsCollateral: op === 'enable-collateral' ? true : false,
              poolAddress,
            })
          );
          break;
        default:
          throw new Error('Unsupported operation.');
      }
    } catch (e) {
      setTxError(e instanceof Error ? e : new Error('Failed to build tx'));
    }
  };

  const handleSendWithMetamask = async () => {
    if (!txPreview) return;
    setSendError(null);
    setSendHash(null);

    try {
      if (typeof window === 'undefined' || !(window as any).ethereum) {
        throw new Error('No EIP-1193 wallet found. Please install or open MetaMask.');
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
      setSendError(e instanceof Error ? e : new Error('Failed to send transaction'));
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="p-3 rounded-lg border border-forge-border/50 bg-forge-bg/50">
        <div className="flex items-center gap-2 mb-2">
          <Coins className="w-4 h-4 text-accent-cyan" />
          <span className="text-sm font-medium text-white">Aave V3 Lending</span>
        </div>
        <p className="text-xs text-forge-muted">
          Supply, borrow, withdraw, and repay on Aave V3. Supports Arbitrum, Arbitrum Sepolia, and Ethereum Sepolia.
        </p>
      </div>

      {/* 1. Select Network */}
      <div>
        <label className="text-xs text-forge-muted mb-1.5 block">1. Select Network</label>
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

      {/* 2. Pool info (read-only) */}
      <div>
        <label className="text-xs text-forge-muted mb-1.5 block">2. Aave V3 Pool (this chain)</label>
        <div className="p-2 rounded-lg border border-forge-border/50 bg-forge-bg/50 font-mono text-[10px] text-forge-muted break-all">
          Pool: {poolConfig.poolAddress}
        </div>
        <p className="text-[10px] text-forge-muted mt-1">
          Optional: override in generated project via env <code className="bg-forge-elevated px-1 rounded">AAVE_POOL_ADDRESS</code>.
        </p>
      </div>

      {/* 3. Test: Fetch account data */}
      <div>
        <label className="text-xs text-forge-muted mb-1.5 block">3. Test – Fetch Account Data</label>
        <p className="text-[10px] text-forge-muted mb-2">
          Enter a wallet address to preview Aave account data (collateral, debt, health factor).
        </p>
        <div className="flex gap-2">
          <Input
            type="text"
            placeholder="0x..."
            value={walletAddress}
            onChange={(e) => setWalletAddress(e.target.value)}
            className="text-xs h-8 font-mono flex-1"
          />
          <Button
            type="button"
            onClick={handleFetchAccountData}
            disabled={loading || !walletAddress || walletAddress.length !== 42}
            size="sm"
          >
            {loading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              'Fetch'
            )}
          </Button>
        </div>

        {fetched && (
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
            {accountData && !error && (
              <div className="p-3 rounded-lg bg-forge-elevated/50 border border-forge-border/50 space-y-2">
                <p className="text-xs font-medium text-white">Account Data</p>
                <div className="grid grid-cols-1 gap-1 text-[10px]">
                  <div className="flex justify-between">
                    <span className="text-forge-muted">Health Factor</span>
                    <span className="font-mono text-white">{accountData.healthFactor}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-forge-muted">Total Collateral (base)</span>
                    <span className="font-mono text-white">{accountData.totalCollateralBase}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-forge-muted">Total Debt (base)</span>
                    <span className="font-mono text-white">{accountData.totalDebtBase}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-forge-muted">Available to Borrow (base)</span>
                    <span className="font-mono text-white">{accountData.availableBorrowsBase}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-forge-muted">LTV</span>
                    <span className="font-mono text-white">{accountData.ltv}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-forge-muted">Liquidation Threshold</span>
                    <span className="font-mono text-white">{accountData.currentLiquidationThreshold}%</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 4. Build transaction calldata */}
      <div>
        <label className="text-xs text-forge-muted mb-1.5 block">4. Build Transaction (calldata)</label>
        <p className="text-[10px] text-forge-muted mb-2">
          This generates the contract call ({' '}
          <span className="font-mono">to</span> + <span className="font-mono">data</span>{' '}
          ) for Aave actions. Amounts are raw <span className="font-mono">wei</span>.
        </p>

        <div className="grid grid-cols-1 gap-2">
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setOp('supply')}
              className={cn(
                'px-3 py-2 rounded-lg border text-xs font-medium transition-all',
                op === 'supply'
                  ? 'border-white bg-forge-elevated text-white'
                  : 'border-forge-border/50 bg-forge-bg/50 text-forge-muted hover:border-forge-border'
              )}
            >
              Supply
            </button>
            <button
              type="button"
              onClick={() => setOp('withdraw')}
              className={cn(
                'px-3 py-2 rounded-lg border text-xs font-medium transition-all',
                op === 'withdraw'
                  ? 'border-white bg-forge-elevated text-white'
                  : 'border-forge-border/50 bg-forge-bg/50 text-forge-muted hover:border-forge-border'
              )}
            >
              Withdraw
            </button>
            <button
              type="button"
              onClick={() => setOp('borrow')}
              className={cn(
                'px-3 py-2 rounded-lg border text-xs font-medium transition-all',
                op === 'borrow'
                  ? 'border-white bg-forge-elevated text-white'
                  : 'border-forge-border/50 bg-forge-bg/50 text-forge-muted hover:border-forge-border'
              )}
            >
              Borrow
            </button>
            <button
              type="button"
              onClick={() => setOp('repay')}
              className={cn(
                'px-3 py-2 rounded-lg border text-xs font-medium transition-all',
                op === 'repay'
                  ? 'border-white bg-forge-elevated text-white'
                  : 'border-forge-border/50 bg-forge-bg/50 text-forge-muted hover:border-forge-border'
              )}
            >
              Repay
            </button>
            <button
              type="button"
              onClick={() => setOp('enable-collateral')}
              className={cn(
                'px-3 py-2 rounded-lg border text-xs font-medium transition-all',
                op === 'enable-collateral'
                  ? 'border-white bg-forge-elevated text-white'
                  : 'border-forge-border/50 bg-forge-bg/50 text-forge-muted hover:border-forge-border'
              )}
            >
              Enable Collateral
            </button>
            <button
              type="button"
              onClick={() => setOp('disable-collateral')}
              className={cn(
                'px-3 py-2 rounded-lg border text-xs font-medium transition-all',
                op === 'disable-collateral'
                  ? 'border-white bg-forge-elevated text-white'
                  : 'border-forge-border/50 bg-forge-bg/50 text-forge-muted hover:border-forge-border'
              )}
            >
              Disable Collateral
            </button>
          </div>

          <button
            type="button"
            onClick={() => setOp('erc20-approve')}
            className={cn(
              'px-3 py-2 rounded-lg border text-xs font-medium transition-all',
              op === 'erc20-approve'
                ? 'border-white bg-forge-elevated text-white'
                : 'border-forge-border/50 bg-forge-bg/50 text-forge-muted hover:border-forge-border'
            )}
          >
            ERC20 Approve (pre-step)
          </button>

          {op === 'erc20-approve' ? (
            <div className="grid grid-cols-1 gap-2">
              <Input
                type="text"
                placeholder="Token address (0x...)"
                value={approveToken}
                onChange={(e) => setApproveToken(e.target.value)}
                className="text-xs h-8 font-mono"
              />
              <Input
                type="text"
                placeholder={`Spender (usually Pool): ${poolConfig.poolAddress}`}
                value={approveSpender}
                onChange={(e) => setApproveSpender(e.target.value)}
                className="text-xs h-8 font-mono"
              />
              <Input
                type="text"
                placeholder="Amount (wei)"
                value={approveAmountWei}
                onChange={(e) => setApproveAmountWei(e.target.value)}
                className="text-xs h-8 font-mono"
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-2">
              <Input
                type="text"
                placeholder="Asset address (0x...)"
                value={assetAddress}
                onChange={(e) => setAssetAddress(e.target.value)}
                className="text-xs h-8 font-mono"
              />

              {(op === 'supply' || op === 'withdraw' || op === 'borrow' || op === 'repay') && (
                <Input
                  type="text"
                  placeholder="Amount (wei)"
                  value={amountWei}
                  onChange={(e) => setAmountWei(e.target.value)}
                  className="text-xs h-8 font-mono"
                />
              )}

              {(op === 'borrow' || op === 'repay') && (
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setInterestRateMode('variable')}
                    className={cn(
                      'px-3 py-2 rounded-lg border text-xs font-medium transition-all',
                      interestRateMode === 'variable'
                        ? 'border-white bg-forge-elevated text-white'
                        : 'border-forge-border/50 bg-forge-bg/50 text-forge-muted hover:border-forge-border'
                    )}
                  >
                    Variable
                  </button>
                  <button
                    type="button"
                    onClick={() => setInterestRateMode('stable')}
                    className={cn(
                      'px-3 py-2 rounded-lg border text-xs font-medium transition-all',
                      interestRateMode === 'stable'
                        ? 'border-white bg-forge-elevated text-white'
                        : 'border-forge-border/50 bg-forge-bg/50 text-forge-muted hover:border-forge-border'
                    )}
                  >
                    Stable
                  </button>
                </div>
              )}

              {(op === 'withdraw') && (
                <Input
                  type="text"
                  placeholder="To (defaults to walletAddress)"
                  value={toAddress}
                  onChange={(e) => setToAddress(e.target.value)}
                  className="text-xs h-8 font-mono"
                />
              )}

              {(op === 'supply' || op === 'borrow' || op === 'repay') && (
                <Input
                  type="text"
                  placeholder="On behalf of (defaults to walletAddress)"
                  value={onBehalfOf}
                  onChange={(e) => setOnBehalfOf(e.target.value)}
                  className="text-xs h-8 font-mono"
                />
              )}

              {(op === 'enable-collateral' || op === 'disable-collateral') && (
                <div className="flex items-center justify-between px-3 py-2 rounded-lg border border-forge-border/50 bg-forge-bg/50">
                  <span className="text-xs text-forge-muted">useAsCollateral</span>
                  <button
                    type="button"
                    onClick={() => setUseAsCollateral((v) => !v)}
                    className={cn(
                      'px-2 py-1 rounded border text-[10px] font-medium',
                      useAsCollateral ? 'border-white text-white' : 'border-forge-border/50 text-forge-muted'
                    )}
                  >
                    {useAsCollateral ? 'true' : 'false'}
                  </button>
                </div>
              )}
            </div>
          )}

          <Button type="button" onClick={handleBuildTx} size="sm">
            Build calldata
          </Button>

          {txError && (
            <div className="flex items-start gap-2 p-2 rounded-lg bg-red-500/10 border border-red-500/20">
              <AlertCircle className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-xs font-medium text-red-400">Tx build error</p>
                <p className="text-[10px] text-red-300 mt-0.5">{txError.message}</p>
              </div>
            </div>
          )}

          {txPreview && !txError && (
            <div className="p-3 rounded-lg bg-forge-elevated/50 border border-forge-border/50 space-y-2">
              <p className="text-xs font-medium text-white">Transaction Preview</p>
              <div className="grid grid-cols-1 gap-1 text-[10px]">
                <div className="flex justify-between gap-4">
                  <span className="text-forge-muted shrink-0">to</span>
                  <span className="font-mono text-white break-all text-right">{txPreview.to}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-forge-muted shrink-0">value</span>
                  <span className="font-mono text-white break-all text-right">{txPreview.value ?? '0'}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-forge-muted shrink-0">data</span>
                  <span className="font-mono text-white break-all text-right">{txPreview.data}</span>
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
                      <p className="text-xs font-medium text-red-400">Wallet error</p>
                      <p className="text-[10px] text-red-300 mt-0.5">{sendError.message}</p>
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
            Aave V3 is deployed on Arbitrum, Arbitrum Sepolia, and Ethereum Sepolia. Use the generated app to supply, borrow, withdraw, and repay.
          </p>
        </div>
      </div>
    </div>
  );
}
