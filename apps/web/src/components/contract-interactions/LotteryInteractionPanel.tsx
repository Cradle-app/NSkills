'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { ethers } from 'ethers';
import {
  Ticket,
  Users,
  RefreshCw,
  Loader2,
  AlertCircle,
  Check,
  ExternalLink,
  Timer,
  TrendingUp,
  Trophy,
  Gift,
  ChevronDown,
} from 'lucide-react';
import { useAccount } from 'wagmi';
import { cn } from '@/lib/utils';
import BnbChainLogo from '@/assets/blocks/BNB Chain.png';

import { BNB_LOTTERY_NETWORKS, type BnbNetworkKey } from '@root/lib/bnb-network-config';
import LOTTERY_ABI from '../../../../../packages/components/bnb-lottery/contract/lottery/lottery-abi.json';

export interface LotteryInteractionPanelProps {
  contractAddress?: string;
}

interface TxStatus {
  status: 'idle' | 'pending' | 'success' | 'error';
  message: string;
  hash?: string;
}

export function LotteryInteractionPanel({
  contractAddress: initialAddress,
}: LotteryInteractionPanelProps) {
  const [selectedNetwork, setSelectedNetwork] = useState<BnbNetworkKey>('testnet');
  const [showNetworkDropdown, setShowNetworkDropdown] = useState(false);
  const networkConfig = BNB_LOTTERY_NETWORKS[selectedNetwork];
  const contractAddress = networkConfig.contracts.lottery ?? initialAddress ?? '0x9bb658a999a46d149262fe74d37894ac203ca493';

  const { address: userAddress, isConnected: walletConnected, chain } = useAccount();

  // Lottery state
  const [latestRoundId, setLatestRoundId] = useState<number | null>(null);
  const [selectedRoundId, setSelectedRoundId] = useState<number | null>(null);
  const [ticketPrice, setTicketPrice] = useState<bigint | null>(null);
  const [prizePool, setPrizePool] = useState<bigint | null>(null);
  const [totalTickets, setTotalTickets] = useState<bigint | null>(null);
  const [secondsLeft, setSecondsLeft] = useState<bigint | null>(null);
  const [drawn, setDrawn] = useState<boolean | null>(null);
  const [winnerAddress, setWinnerAddress] = useState<string | null>(null);
  const [paid, setPaid] = useState<boolean | null>(null);
  const [isOpen, setIsOpen] = useState<boolean | null>(null);
  const [owner, setOwner] = useState<string | null>(null);

  // My tickets
  const [myTickets, setMyTickets] = useState<bigint | null>(null);
  const [ticketQuantity, setTicketQuantity] = useState('1');
  const [checkAddress, setCheckAddress] = useState('');
  const [checkResult, setCheckResult] = useState<bigint | null>(null);
  const [checkError, setCheckError] = useState<string | null>(null);

  // Round creation state
  const [newTicketPrice, setNewTicketPrice] = useState('0.01');
  const [newDuration, setNewDuration] = useState('3600');

  // Tx status
  const [txStatus, setTxStatus] = useState<TxStatus>({ status: 'idle', message: '' });
  const [contractError, setContractError] = useState<string | null>(null);

  const explorerUrl = `${networkConfig.explorerUrl}/address/${contractAddress}`;

  const getReadContract = useCallback(() => {
    if (!contractAddress) return null;
    const provider = new ethers.JsonRpcProvider(networkConfig.rpcUrl);
    return new ethers.Contract(contractAddress, LOTTERY_ABI, provider);
  }, [contractAddress, networkConfig.rpcUrl]);

  const getWriteContract = useCallback(async () => {
    if (!contractAddress) {
      throw new Error('No contract address specified');
    }
    if (!walletConnected) {
      throw new Error('Please connect your wallet first');
    }

    const ethereum = (window as any).ethereum;
    if (!ethereum) {
      throw new Error('No wallet detected. Please install MetaMask or a compatible wallet.');
    }

    const targetChainIdHex = `0x${networkConfig.chainId.toString(16)}`;

    if (chain?.id !== networkConfig.chainId) {
      try {
        await ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: targetChainIdHex }],
        });
      } catch (switchError: any) {
        if (switchError.code === 4902 || switchError.message?.includes('Unrecognized chain')) {
          try {
            await ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [
                {
                  chainId: targetChainIdHex,
                  chainName: networkConfig.name,
                  nativeCurrency: networkConfig.nativeCurrency,
                  rpcUrls: [networkConfig.rpcUrl],
                  blockExplorerUrls: [networkConfig.explorerUrl],
                },
              ],
            });
          } catch (addError: any) {
            throw new Error(`Failed to add BNB Testnet to wallet: ${addError.message}`);
          }
        } else if (switchError.code === 4001) {
          throw new Error('User rejected chain switch');
        } else {
          throw switchError;
        }
      }
    }

    const provider = new ethers.BrowserProvider(ethereum);
    const signer = await provider.getSigner();
    return new ethers.Contract(contractAddress, LOTTERY_ABI, signer);
  }, [chain?.id, contractAddress, walletConnected, networkConfig]);

  const fetchState = useCallback(async () => {
    const contract = getReadContract();
    if (!contract) return;

    setContractError(null);
    try {
      // First check if the address actually has code on the network
      const provider = new ethers.JsonRpcProvider(networkConfig.rpcUrl);
      const code = await provider.getCode(contractAddress);

      if (code === '0x' || code === '0x0') {
        setContractError(`No contract found at this address on ${networkConfig.name}. Please verify the address and network.`);
        return;
      }

      const [count, contractOwner] = await Promise.all([
        contract.roundCount(),
        contract.owner(),
      ]);

      const roundCount = Number(count);
      setLatestRoundId(roundCount);
      setOwner(contractOwner as string);

      const roundIdToFetch = selectedRoundId ?? roundCount;
      if (roundIdToFetch > 0) {
        const round = await contract.getRound(roundIdToFetch);

        setTicketPrice(round.ticketPrice as bigint);
        setPrizePool(round.prizePool as bigint);
        setTotalTickets(round.totalTickets as bigint);

        // Calculate seconds left
        const now = BigInt(Math.floor(Date.now() / 1000));
        const left = round.endTime > now ? round.endTime - now : 0n;
        setSecondsLeft(left);

        setDrawn(round.winner !== ethers.ZeroAddress);
        setWinnerAddress(round.winner as string);
        setPaid(Boolean(round.isPaid));
        setIsOpen(Boolean(round.isOpen));

        if (userAddress) {
          try {
            const myCount = await contract.getMyTickets(roundIdToFetch, userAddress);
            setMyTickets(myCount as bigint);
          } catch {
            setMyTickets(null);
          }
        }
      } else {
        // No rounds created yet
        setTicketPrice(null);
        setPrizePool(null);
        setTotalTickets(null);
        setSecondsLeft(null);
        setDrawn(false);
        setWinnerAddress(ethers.ZeroAddress);
        setPaid(false);
        setIsOpen(false);
      }
    } catch (error: any) {
      console.error('Error fetching lottery state:', error);

      let errorMessage = 'Unable to read contract state on BNB Testnet';

      if (error.message?.includes('execution reverted')) {
        errorMessage = 'Contract call reverted. This may happen if the round does not exist, the contract is invalid, or the ABI is mismatched.';
      } else if (error.code === 'NETWORK_ERROR') {
        errorMessage = 'Network error: Unable to connect to BNB Testnet RPC. Please check your internet connection.';
      } else if (error.reason) {
        errorMessage = `Contract error: ${error.reason}`;
      } else {
        errorMessage = error.message || errorMessage;
      }

      setContractError(errorMessage);
    }
  }, [getReadContract, userAddress, selectedRoundId, networkConfig]);

  useEffect(() => {
    if (contractAddress) {
      fetchState();
    }
  }, [contractAddress, fetchState]);

  // Auto-refresh countdown
  useEffect(() => {
    if (drawn || secondsLeft === null || secondsLeft === 0n) return;
    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev === null || prev <= 1n) return 0n;
        return prev - 1n;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [drawn, secondsLeft]);

  const handleTx = async (op: () => Promise<ethers.TransactionResponse>, successMessage: string) => {
    if (!walletConnected) {
      setTxStatus({ status: 'error', message: 'Please connect your wallet first' });
      setTimeout(() => setTxStatus({ status: 'idle', message: '' }), 4000);
      return;
    }

    try {
      setTxStatus({ status: 'pending', message: 'Confirm in your wallet…' });
      const tx = await op();
      setTxStatus({ status: 'pending', message: 'Waiting for confirmation…', hash: tx.hash });
      await tx.wait();
      setTxStatus({ status: 'success', message: successMessage, hash: tx.hash });
      await fetchState();
    } catch (error: any) {
      console.error('Lottery transaction error:', error);
      const msg = error?.reason || error?.message || 'Transaction failed';
      setTxStatus({ status: 'error', message: msg });
    } finally {
      setTimeout(() => setTxStatus({ status: 'idle', message: '' }), 6000);
    }
  };

  const handleBuyTickets = async () => {
    const roundId = selectedRoundId ?? latestRoundId;
    if (!roundId || roundId <= 0) {
      setTxStatus({ status: 'error', message: 'No active round found.' });
      return;
    }

    if (!isOpen) {
      setTxStatus({ status: 'error', message: 'Round is closed.' });
      return;
    }

    const quantity = parseInt(ticketQuantity);
    if (isNaN(quantity) || quantity <= 0) {
      setTxStatus({ status: 'error', message: 'Invalid quantity.' });
      return;
    }

    try {
      const contract = await getWriteContract();
      const price = ticketPrice ?? (await contract.rounds(roundId)).ticketPrice;
      const totalValue = price * BigInt(quantity);

      await handleTx(
        () => contract.buyTickets(roundId, quantity, { value: totalValue }),
        `Purchased ${quantity} ticket(s)! 🎟️`
      );
    } catch (error: any) {
      console.error('Buy ticket error:', error);
      setTxStatus({ status: 'error', message: error?.reason || error?.message || 'Failed to buy tickets' });
    }
  };

  const handlePickWinner = async () => {
    const roundId = selectedRoundId ?? latestRoundId;
    if (!roundId) return;
    try {
      const contract = await getWriteContract();
      await handleTx(() => contract.pickWinner(roundId), 'Winner picked! 🏆');
    } catch (error: any) {
      setTxStatus({ status: 'error', message: error?.message || 'Failed to pick winner' });
    }
  };

  const handleCloseRound = async () => {
    const roundId = selectedRoundId ?? latestRoundId;
    if (!roundId) return;
    try {
      const contract = await getWriteContract();
      await handleTx(() => contract.closeRound(roundId), 'Round closed! 🔒');
    } catch (error: any) {
      setTxStatus({ status: 'error', message: error?.message || 'Failed to close round' });
    }
  };

  const handleCreateRound = async () => {
    try {
      const contract = await getWriteContract();
      const priceWei = ethers.parseEther(newTicketPrice);
      const durationSec = parseInt(newDuration);

      await handleTx(
        () => contract.createRound(priceWei, durationSec),
        'New round created! 🚀'
      );
    } catch (error: any) {
      setTxStatus({ status: 'error', message: error?.message || 'Failed to create round' });
    }
  };

  const handleCheckTickets = async () => {
    const contract = getReadContract();
    if (!contract) return;

    const target = (checkAddress || userAddress)?.toString();
    if (!target) {
      setCheckError('Enter an address or connect your wallet');
      setCheckResult(null);
      return;
    }

    const roundId = selectedRoundId ?? latestRoundId;
    if (!roundId) {
      setCheckError('No round selected');
      return;
    }

    try {
      setCheckError(null);
      const result = await contract.getMyTickets(roundId, target);
      setCheckResult(result as bigint);
    } catch (error: any) {
      console.error('Error checking tickets:', error);
      setCheckError(error?.reason || error?.message || 'Unable to check tickets');
      setCheckResult(null);
    }
  };

  function formatTimeLeft(secs: bigint): string {
    const total = Number(secs);
    if (total <= 0) return 'Ended';
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;
    if (h > 0) return `${h}h ${m}m ${s}s`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
  }

  const isOwnerHint = (
    <p className="text-[10px] text-forge-muted">
      Owner-only function. If your transaction reverts, make sure you are using the deployer wallet.
    </p>
  );

  const isLotteryOver = drawn || (secondsLeft !== null && secondsLeft <= 0n);
  const isWinner = userAddress && winnerAddress && userAddress.toLowerCase() === winnerAddress.toLowerCase();

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="p-3 rounded-lg border border-accent-cyan/30 bg-gradient-to-r from-accent-cyan/10 to-transparent">
        <div className="flex items-center justify-between gap-2 mb-1">
          <div className="flex items-center gap-2">
            <Ticket className="w-4 h-4 text-accent-cyan" />
            <div>
              <h3 className="text-sm font-medium text-white">BNB Lottery Contract</h3>
              <p className="text-[10px] text-forge-muted">
                Ticket-based lottery on BNB Smart Chain Testnet.
              </p>
            </div>
          </div>
        </div>
        <a
          href={explorerUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-[10px] font-mono text-accent-cyan hover:underline"
        >
          {contractAddress.slice(0, 6)}...{contractAddress.slice(-4)}
          <ExternalLink className="w-2.5 h-2.5" />
        </a>
      </div>

      {/* Wallet Status */}
      <div className={cn(
        'p-2.5 rounded-lg border',
        walletConnected ? 'border-green-500/30 bg-green-500/5' : 'border-accent-cyan/30 bg-accent-cyan/5'
      )}>
        <div className="flex items-center gap-2">
          <Users className={cn('w-3.5 h-3.5', walletConnected ? 'text-green-400' : 'text-accent-cyan')} />
          {walletConnected ? (
            <span className="text-[10px] text-green-300">
              Connected: <code className="text-green-400">{userAddress?.slice(0, 6)}...{userAddress?.slice(-4)}</code>
              {myTickets !== null && myTickets > 0n && (
                <span className="ml-2 text-accent-cyan/80">
                  ({Number(myTickets)} ticket{Number(myTickets) !== 1 ? 's' : ''})
                </span>
              )}
            </span>
          ) : (
            <span className="text-[10px] text-accent-cyan/80">Connect wallet via Wallet Auth node for write ops</span>
          )}
        </div>
      </div>

      {/* Network Selector */}
      <div className="space-y-1.5">
        <label className="text-xs text-forge-muted flex items-center gap-1.5">
          <span className="text-sm">🌐</span> Network
        </label>
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowNetworkDropdown(!showNetworkDropdown)}
            className={cn(
              'w-full flex items-center justify-between px-3 py-2 rounded-lg border text-sm',
              'bg-forge-bg border-forge-border',
              'text-white hover:border-accent-cyan/50 transition-colors'
            )}
          >
            <div className="flex items-center gap-2">
              <Image
                src={BnbChainLogo}
                alt="BNB Chain"
                width={16}
                height={16}
                className="rounded"
              />
              <span>{networkConfig.name}</span>
              {(networkConfig.id === 'testnet' || networkConfig.id === 'opbnbTestnet') && (
                <span className="text-[8px] px-1.5 py-0.5 bg-accent-cyan/20 text-accent-cyan rounded">Testnet</span>
              )}
            </div>
            <ChevronDown className={cn(
              'w-4 h-4 text-forge-muted transition-transform',
              showNetworkDropdown && 'rotate-180'
            )} />
          </button>

          {/* Dropdown Menu */}
          {showNetworkDropdown && (
            <div className="absolute top-full mt-1 w-full bg-forge-bg border border-forge-border rounded-lg shadow-xl z-50 overflow-hidden">
              {Object.entries(BNB_LOTTERY_NETWORKS).map(([key, network]) => {
                return (
                  <button
                    key={key}
                    type="button"
                    disabled={network.disabled}
                    onClick={() => {
                      if (!network.disabled) {
                        setSelectedNetwork(key as BnbNetworkKey);
                        setShowNetworkDropdown(false);
                      }
                    }}
                    className={cn(
                      'w-full px-3 py-2.5 text-left text-sm transition-colors',
                      'flex items-center justify-between',
                      network.disabled
                        ? 'opacity-50 cursor-not-allowed bg-forge-bg/80 backdrop-blur-sm'
                        : 'hover:bg-accent-cyan/10 cursor-pointer',
                      selectedNetwork === key && 'bg-accent-cyan/20'
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <Image
                        src={BnbChainLogo}
                        alt="BNB Chain"
                        width={16}
                        height={16}
                        className="rounded"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-white">{network.name}</span>
                          {(network.id === 'testnet' || network.id === 'opbnbTestnet') && (
                            <span className="text-[8px] px-1.5 py-0.5 bg-accent-cyan/20 text-accent-cyan rounded">Testnet</span>
                          )}
                        </div>
                        <p className="text-[10px] text-forge-muted mt-0.5">
                          {network.description}
                        </p>
                      </div>
                    </div>
                    {network.disabled && (
                      <span className="text-[9px] px-1.5 py-0.5 bg-gray-500/20 text-gray-400 rounded">Coming Soon</span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Refresh button */}
      <button
        onClick={fetchState}
        className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-accent-cyan hover:bg-accent-cyan/90 text-black rounded-lg text-xs font-medium transition-colors"
      >
        <RefreshCw className="w-3.5 h-3.5" />
        Refresh state
      </button>

      {/* Tx status */}
      {txStatus.status !== 'idle' && (
        <div
          className={cn(
            'rounded-lg p-2.5 border flex items-start gap-2',
            txStatus.status === 'pending' && 'bg-blue-500/10 border-blue-500/30',
            txStatus.status === 'success' && 'bg-accent-cyan/10 border-accent-cyan/30',
            txStatus.status === 'error' && 'bg-red-500/10 border-red-500/30'
          )}
        >
          {txStatus.status === 'pending' && (
            <Loader2 className="w-3.5 h-3.5 text-blue-400 animate-spin shrink-0" />
          )}
          {txStatus.status === 'success' && (
            <Check className="w-3.5 h-3.5 text-accent-cyan shrink-0" />
          )}
          {txStatus.status === 'error' && (
            <AlertCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />
          )}
          <div className="flex-1 min-w-0">
            <p
              className={cn(
                'text-[10px] font-medium truncate',
                txStatus.status === 'pending' && 'text-blue-300',
                txStatus.status === 'success' && 'text-accent-cyan/80',
                txStatus.status === 'error' && 'text-red-300'
              )}
            >
              {txStatus.message}
            </p>
            {txStatus.hash && (
              <a
                href={`${networkConfig.explorerUrl}/tx/${txStatus.hash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[9px] text-forge-muted hover:text-white flex items-center gap-1"
              >
                View on BscScan
                <ExternalLink className="w-2.5 h-2.5" />
              </a>
            )}
          </div>
        </div>
      )}

      {/* Lottery State */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-3.5 h-3.5 text-accent-cyan" />
            <span className="text-xs font-medium text-white">
              Lottery Round {selectedRoundId ?? latestRoundId ?? '—'}
            </span>
          </div>
          <div className="flex gap-1">
            <button
              onClick={() => setSelectedRoundId(Math.max(1, (selectedRoundId ?? latestRoundId ?? 1) - 1))}
              disabled={(selectedRoundId ?? latestRoundId ?? 1) <= 1}
              className="p-1 rounded bg-forge-bg border border-forge-border text-xs text-white disabled:opacity-30"
            >
              ←
            </button>
            <button
              onClick={() => setSelectedRoundId(Math.min(latestRoundId ?? 1, (selectedRoundId ?? latestRoundId ?? 1) + 1))}
              disabled={(selectedRoundId ?? latestRoundId ?? 1) >= (latestRoundId ?? 1)}
              className="p-1 rounded bg-forge-bg border border-forge-border text-xs text-white disabled:opacity-30"
            >
              →
            </button>
            <button
              onClick={() => setSelectedRoundId(null)}
              className="px-2 py-0.5 rounded bg-accent-cyan/20 text-[10px] text-accent-cyan border border-accent-cyan/30"
            >
              Latest
            </button>
          </div>
        </div>

        {contractError && (
          <div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/30 flex items-start gap-2">
            <AlertCircle className="w-3.5 h-3.5 text-red-400" />
            <p className="text-[10px] text-red-200">{contractError}</p>
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          <div className="p-2.5 rounded-lg bg-forge-bg/50 border border-forge-border/30">
            <p className="text-[10px] text-forge-muted">Ticket Price</p>
            <p className="text-sm font-semibold text-white">
              {ticketPrice !== null
                ? `${ethers.formatEther(ticketPrice)} BNB`
                : '—'}
            </p>
          </div>
          <div className="p-2.5 rounded-lg bg-forge-bg/50 border border-forge-border/30">
            <p className="text-[10px] text-forge-muted">Prize Pool</p>
            <p className="text-sm font-semibold text-white">
              {prizePool !== null
                ? `${ethers.formatEther(prizePool)} BNB`
                : '—'}
            </p>
          </div>
          <div className="p-2.5 rounded-lg bg-forge-bg/50 border border-forge-border/30">
            <div className="flex items-center gap-1">
              <Timer className="w-3 h-3 text-accent-cyan" />
              <p className="text-[10px] text-forge-muted">Remaining</p>
            </div>
            <p className="text-sm font-semibold text-white">
              {isOpen ? (secondsLeft !== null ? formatTimeLeft(secondsLeft) : '...') : 'Closed'}
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <div className="p-2.5 rounded-lg bg-forge-bg/50 border border-forge-border/30">
            <p className="text-[10px] text-forge-muted">Tickets Sold</p>
            <p className="text-sm font-semibold text-white">
              {totalTickets !== null ? Number(totalTickets).toString() : '—'}
            </p>
          </div>
          <div className="p-2.5 rounded-lg bg-forge-bg/50 border border-forge-border/30">
            <p className="text-[10px] text-forge-muted">Winner</p>
            <p className="text-[11px] font-mono text-white truncate">
              {winnerAddress && winnerAddress !== ethers.ZeroAddress
                ? winnerAddress
                : 'Not picked yet'}
            </p>
            <p className="text-[10px] text-forge-muted mt-1">
              Status:{' '}
              <span className="font-semibold text-white">
                {isOpen
                  ? (secondsLeft !== null && secondsLeft <= 0n ? 'Awaiting Closure' : 'Active')
                  : winnerAddress && winnerAddress !== ethers.ZeroAddress
                    ? (paid ? 'Winner Paid' : 'Winner Picked')
                    : 'Closed'}
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Buy Ticket */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Ticket className="w-3.5 h-3.5 text-accent-cyan" />
          <span className="text-xs font-medium text-white">Buy Tickets</span>
        </div>
        <div className="p-3 rounded-lg bg-forge-bg/50 border border-forge-border/40 space-y-3">
          {!isOpen ? (
            <div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/30 flex items-center gap-2">
              <AlertCircle className="w-3.5 h-3.5 text-red-400" />
              <p className="text-[10px] text-red-200">
                Round is closed.
              </p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <p className="text-[10px] text-forge-muted">
                  Price: <span className="font-semibold text-white">
                    {ticketPrice !== null ? `${ethers.formatEther(ticketPrice)} BNB` : '...'}
                  </span>
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-forge-muted">Qty:</span>
                  <input
                    type="number"
                    min="1"
                    value={ticketQuantity}
                    onChange={(e) => setTicketQuantity(e.target.value)}
                    className="w-12 h-6 px-1.5 bg-forge-bg border border-forge-border rounded text-[10px] text-white"
                  />
                </div>
              </div>
              <button
                onClick={handleBuyTickets}
                disabled={!walletConnected || txStatus.status === 'pending'}
                className="w-full py-1.5 bg-accent-cyan hover:bg-accent-cyan/90 text-black rounded text-[10px] font-medium disabled:opacity-50"
              >
                🎟️ Buy {ticketQuantity} Ticket(s)
              </button>
            </>
          )}
        </div>
      </div>

      {/* Owner Controls */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Trophy className="w-3.5 h-3.5 text-accent-cyan" />
          <span className="text-xs font-medium text-white">Owner Controls</span>
        </div>

        <div className="p-3 rounded-lg bg-purple-500/5 border border-purple-500/20 space-y-3">
          <div className="space-y-2">
            <p className="text-[10px] text-forge-muted font-medium">New Round</p>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <span className="text-[9px] text-forge-muted">Price (BNB)</span>
                <input
                  type="text"
                  value={newTicketPrice}
                  onChange={(e) => setNewTicketPrice(e.target.value)}
                  className="w-full h-7 px-2 bg-forge-bg border border-forge-border rounded text-[10px] text-white"
                />
              </div>
              <div className="space-y-1">
                <span className="text-[9px] text-forge-muted">Duration (sec)</span>
                <input
                  type="text"
                  value={newDuration}
                  onChange={(e) => setNewDuration(e.target.value)}
                  className="w-full h-7 px-2 bg-forge-bg border border-forge-border rounded text-[10px] text-white"
                />
              </div>
            </div>
            <button
              onClick={handleCreateRound}
              disabled={!walletConnected || txStatus.status === 'pending'}
              className="w-full py-1.5 bg-accent-cyan hover:bg-accent-cyan/90 text-black rounded text-[10px] font-medium disabled:opacity-50"
            >
              🚀 Create Round
            </button>
          </div>

          <div className="pt-2 border-t border-forge-border/30 grid grid-cols-2 gap-2">
            <button
              onClick={handleCloseRound}
              disabled={!walletConnected || txStatus.status === 'pending' || !isOpen}
              className="py-1.5 bg-forge-bg border border-forge-border hover:bg-forge-border/50 text-white rounded text-[10px] font-medium disabled:opacity-50"
            >
              🔒 Close Round
            </button>
            <button
              onClick={handlePickWinner}
              disabled={!walletConnected || txStatus.status === 'pending' || isOpen || (winnerAddress !== ethers.ZeroAddress)}
              className="py-1.5 bg-accent-cyan/90 hover:bg-accent-cyan text-black rounded text-[10px] font-medium disabled:opacity-50"
            >
              🎲 Pick Winner
            </button>
          </div>
        </div>
        {isOwnerHint}
      </div>

      {/* Check Tickets */}
      <div className="space-y-2">
        <p className="text-[10px] font-medium text-white">
          Check tickets for an address
        </p>
        <div className="flex flex-col gap-1.5">
          <input
            type="text"
            placeholder={userAddress ? 'Leave empty to use connected wallet' : '0x... address'}
            value={checkAddress}
            onChange={(e) => setCheckAddress(e.target.value)}
            className="w-full px-2.5 py-1.5 bg-forge-bg border border-forge-border/50 rounded text-[11px] text-white placeholder-white/40 focus:outline-none"
          />
          <div className="flex items-center gap-2">
            <button
              onClick={handleCheckTickets}
              className="px-2.5 py-1.5 text-[10px] rounded-lg bg-accent-cyan text-black font-medium hover:bg-accent-cyan/90"
            >
              Check tickets
            </button>
            {checkResult !== null && !checkError && (
              <span className="text-[10px] text-forge-muted">
                Tickets:{' '}
                <span className="font-semibold text-white">
                  {Number(checkResult)}
                </span>
              </span>
            )}
            {checkError && (
              <span className="text-[10px] text-red-300 truncate">
                {checkError}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
