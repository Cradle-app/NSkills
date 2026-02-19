'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { ethers } from 'ethers';
import {
  Vote,
  Users,
  RefreshCw,
  Loader2,
  AlertCircle,
  Check,
  ExternalLink,
  Wallet,
  Globe,
  ChevronDown,
} from 'lucide-react';
import { useAccount } from 'wagmi';
import { cn } from '@/lib/utils';
import BnbChainLogo from '@/assets/blocks/BNB Chain.png';

import { BNB_NETWORKS, type BnbNetworkKey } from '../../../../../lib/bnb-network-config';
import VOTING_ABI from '../../../../../packages/components/bnb-voting/contract/voting/voting-abi.json';

type Candidate = {
  name: string;
  voteCount: bigint;
};

interface VotingInteractionPanelProps {
  contractAddress?: string;
}

interface TxStatus {
  status: 'idle' | 'pending' | 'success' | 'error';
  message: string;
  hash?: string;
}

export function VotingInteractionPanel({
  contractAddress: initialAddress,
}: VotingInteractionPanelProps) {
  const defaultAddress = initialAddress ?? '0x8a64dFb64A71AfD00F926064E1f2a0B9a7cBe7dD';
  const [contractAddress] = useState(defaultAddress);
  const [selectedNetwork, setSelectedNetwork] = useState<BnbNetworkKey>('testnet');
  const [showNetworkDropdown, setShowNetworkDropdown] = useState(false);
  const networkConfig = BNB_NETWORKS[selectedNetwork];

  const { address: userAddress, isConnected: walletConnected, chain } = useAccount();

  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [totalVotes, setTotalVotes] = useState<bigint | null>(null);
  const [winnerName, setWinnerName] = useState<string | null>(null);
  const [winnerVotes, setWinnerVotes] = useState<bigint | null>(null);
  const [owner, setOwner] = useState<string | null>(null);
  const [votingOpen, setVotingOpen] = useState<boolean | null>(null);

  const [candidateIndex, setCandidateIndex] = useState('');
  const [txStatus, setTxStatus] = useState<TxStatus>({ status: 'idle', message: '' });
  const [contractError, setContractError] = useState<string | null>(null);

  const [hasVotedAddress, setHasVotedAddress] = useState('');
  const [hasVotedResult, setHasVotedResult] = useState<boolean | null>(null);
  const [hasVotedError, setHasVotedError] = useState<string | null>(null);

  const [candidateQueryIndex, setCandidateQueryIndex] = useState('');
  const [candidateQueryResult, setCandidateQueryResult] = useState<Candidate | null>(null);
  const [candidateQueryError, setCandidateQueryError] = useState<string | null>(null);

  const explorerUrl = `${networkConfig.explorerUrl}/address/${contractAddress}`;

  const getReadContract = useCallback(() => {
    if (!contractAddress) return null;
    const provider = new ethers.JsonRpcProvider(networkConfig.rpcUrl);
    return new ethers.Contract(contractAddress, VOTING_ABI, provider);
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
    return new ethers.Contract(contractAddress, VOTING_ABI, signer);
  }, [chain?.id, contractAddress, walletConnected]);

  const fetchState = useCallback(async () => {
    const contract = getReadContract();
    if (!contract) return;

    setContractError(null);
    try {
      const [rawCandidates, total, winner, contractOwner, open] = await Promise.all([
        contract.getCandidates(),
        contract.totalVotes(),
        contract.getWinner(),
        contract.owner(),
        contract.votingOpen(),
      ]);

      const mappedCandidates: Candidate[] = rawCandidates.map((c: any) => ({
        name: c.name as string,
        voteCount: c.voteCount as bigint,
      }));

      setCandidates(mappedCandidates);
      setTotalVotes(total as bigint);
      setWinnerName(winner[0] as string);
      setWinnerVotes(winner[1] as bigint);
      setOwner(contractOwner as string);
      setVotingOpen(Boolean(open));
    } catch (error: any) {
      console.error('Error fetching voting state:', error);
      setContractError(error?.reason || error?.message || 'Unable to read contract state on BNB Testnet');
    }
  }, [getReadContract]);

  useEffect(() => {
    if (contractAddress) {
      fetchState();
    }
  }, [contractAddress, fetchState]);

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
      console.error('Voting transaction error:', error);
      const msg = error?.reason || error?.message || 'Transaction failed';
      setTxStatus({ status: 'error', message: msg });
    } finally {
      setTimeout(() => setTxStatus({ status: 'idle', message: '' }), 6000);
    }
  };

  const handleStartVoting = async () => {
    try {
      const contract = await getWriteContract();
      await handleTx(() => contract.startVoting(), 'Voting opened');
    } catch (error: any) {
      setTxStatus({ status: 'error', message: error?.message || 'Failed to start voting' });
    }
  };

  const handleEndVoting = async () => {
    try {
      const contract = await getWriteContract();
      await handleTx(() => contract.endVoting(), 'Voting closed');
    } catch (error: any) {
      setTxStatus({ status: 'error', message: error?.message || 'Failed to end voting' });
    }
  };

  const handleVote = async () => {
    if (!candidateIndex) return;
    const index = Number(candidateIndex);
    if (Number.isNaN(index) || index < 0) {
      setTxStatus({ status: 'error', message: 'Candidate index must be a non-negative number' });
      return;
    }

    try {
      const contract = await getWriteContract();
      await handleTx(() => contract.vote(index), `Cast vote for candidate #${index}`);
      setCandidateIndex('');
    } catch (error: any) {
      setTxStatus({ status: 'error', message: error?.message || 'Failed to cast vote' });
    }
  };

  const handleCheckHasVoted = async () => {
    const contract = getReadContract();
    if (!contract) return;

    const target = (hasVotedAddress || userAddress)?.toString();
    if (!target) {
      setHasVotedError('Enter an address or connect your wallet');
      setHasVotedResult(null);
      return;
    }

    try {
      setHasVotedError(null);
      const result = await contract.hasVoted(target);
      setHasVotedResult(Boolean(result));
    } catch (error: any) {
      console.error('Error checking hasVoted:', error);
      setHasVotedError(error?.reason || error?.message || 'Unable to check voting status');
      setHasVotedResult(null);
    }
  };

  const handleQueryCandidate = async () => {
    const contract = getReadContract();
    if (!contract || candidateQueryIndex === '') {
      setCandidateQueryError('Please enter a candidate index');
      setCandidateQueryResult(null);
      return;
    }

    const index = parseInt(candidateQueryIndex);
    if (Number.isNaN(index) || index < 0) {
      setCandidateQueryError('Index must be a non-negative number');
      setCandidateQueryResult(null);
      return;
    }

    try {
      setCandidateQueryError(null);
      const result = await contract.candidates(index);
      setCandidateQueryResult({
        name: result.name as string,
        voteCount: result.voteCount as bigint,
      });
    } catch (error: any) {
      console.error('Error querying candidate:', error);
      setCandidateQueryError(error?.reason || error?.message || 'Candidate not found at this index');
      setCandidateQueryResult(null);
    }
  };

  const isOwnerHint = (
    <p className="text-[10px] text-[hsl(var(--color-text-muted))]">
      Owner-only functions. If your transaction reverts, make sure you are using the deployer wallet.
    </p>
  );

  return (
    <div className="space-y-4 p-3">
      {/* Header */}
      <div className="p-3 rounded-lg border border-[hsl(var(--color-accent-primary)/0.3)] bg-gradient-to-r from-[hsl(var(--color-accent-primary)/0.08)] to-transparent">
        <div className="flex items-center justify-between gap-2 mb-1">
          <div className="flex items-center gap-2">
            <Vote className="w-4 h-4 text-[hsl(var(--color-accent-primary))]" />
            <div>
              <h3 className="text-sm font-medium text-[hsl(var(--color-text-primary))]">
                BNB Voting Contract
              </h3>
              <p className="text-[10px] text-[hsl(var(--color-text-muted))]">
                On-chain votes on BNB Smart Chain Testnet.
              </p>
            </div>
          </div>
        </div>
        <a
          href={explorerUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-[10px] font-mono text-[hsl(var(--color-accent-primary))] hover:underline"
        >
          {contractAddress.slice(0, 6)}...{contractAddress.slice(-4)}
          <ExternalLink className="w-2.5 h-2.5" />
        </a>
      </div>

      {/* Wallet Status */}
      <div className={cn(
        'p-2.5 rounded-lg border',
        walletConnected ? 'border-[hsl(var(--color-success)/0.3)] bg-[hsl(var(--color-success)/0.05)]' : 'border-[hsl(var(--color-warning)/0.3)] bg-[hsl(var(--color-warning)/0.05)]'
      )}>
        <div className="flex items-center gap-2">
          <Wallet className={cn('w-3.5 h-3.5', walletConnected ? 'text-[hsl(var(--color-success))]' : 'text-[hsl(var(--color-warning))]')} />
          {walletConnected ? (
            <span className="text-[10px] text-[hsl(var(--color-success)/0.8)]">
              Connected: <code className="text-[hsl(var(--color-success))]">{userAddress?.slice(0, 6)}...{userAddress?.slice(-4)}</code>
            </span>
          ) : (
            <span className="text-[10px] text-[hsl(var(--color-warning)/0.8)]">Connect wallet via Wallet Auth node for write ops</span>
          )}
        </div>
      </div>


      {/* Network Selector */}
      <div className="space-y-1.5">
        <label className="text-xs text-[hsl(var(--color-text-muted))] flex items-center gap-1.5">
          <Globe className="w-3 h-3" /> Network
        </label>
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowNetworkDropdown(!showNetworkDropdown)}
            className={cn(
              'w-full flex items-center justify-between px-3 py-2 rounded-lg border text-sm',
              'bg-[hsl(var(--color-bg-base))] border-[hsl(var(--color-border-default))]',
              'text-[hsl(var(--color-text-primary))] hover:border-[hsl(var(--color-accent-primary)/0.5)] transition-colors'
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
                <span className="text-[8px] px-1.5 py-0.5 bg-[hsl(var(--color-warning)/0.2)] text-[hsl(var(--color-warning))] rounded">Testnet</span>
              )}
            </div>
            <ChevronDown className={cn(
              'w-4 h-4 text-[hsl(var(--color-text-muted))] transition-transform',
              showNetworkDropdown && 'rotate-180'
            )} />
          </button>

          {/* Dropdown Menu */}
          {showNetworkDropdown && (
            <div className="absolute top-full mt-1 w-full bg-[hsl(var(--color-bg-base))] border border-[hsl(var(--color-border-default))] rounded-lg shadow-xl z-50 overflow-hidden">
              {Object.entries(BNB_NETWORKS).map(([key, network]) => (
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
                      ? 'opacity-50 cursor-not-allowed bg-[hsl(var(--color-bg-base))]/80 backdrop-blur-sm'
                      : 'hover:bg-[hsl(var(--color-accent-primary)/0.1)] cursor-pointer',
                    selectedNetwork === key && 'bg-[hsl(var(--color-accent-primary)/0.2)]'
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
                        <span className="text-[hsl(var(--color-text-primary))]">{network.name}</span>
                        {(network.id === 'testnet' || network.id === 'opbnbTestnet') && (
                          <span className="text-[8px] px-1.5 py-0.5 bg-[hsl(var(--color-warning)/0.2)] text-[hsl(var(--color-warning))] rounded">Testnet</span>
                        )}
                      </div>
                      <p className="text-[10px] text-[hsl(var(--color-text-muted))] mt-0.5">
                        {network.description}
                      </p>
                    </div>
                  </div>
                  {network.disabled && (
                    <span className="text-[9px] px-1.5 py-0.5 bg-gray-500/20 text-gray-400 rounded">Coming Soon</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Refresh button */}
      <button
        onClick={fetchState}
        className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-[hsl(var(--color-accent-primary))] hover:bg-[hsl(var(--color-accent-primary)/0.9)] text-black rounded-lg text-xs font-medium transition-colors"
      >
        <RefreshCw className="w-3.5 h-3.5" />
        Refresh state
      </button>

      {/* Tx status */}
      {txStatus.status !== 'idle' && (
        <div
          className={cn(
            'rounded-lg p-2.5 border flex items-start gap-2',
            txStatus.status === 'pending' &&
            'bg-[hsl(var(--color-info)/0.08)] border-[hsl(var(--color-info)/0.4)]',
            txStatus.status === 'success' &&
            'bg-[hsl(var(--color-success)/0.08)] border-[hsl(var(--color-success)/0.4)]',
            txStatus.status === 'error' &&
            'bg-[hsl(var(--color-error)/0.08)] border-[hsl(var(--color-error)/0.4)]'
          )}
        >
          {txStatus.status === 'pending' && (
            <Loader2 className="w-3.5 h-3.5 text-[hsl(var(--color-info))] animate-spin shrink-0" />
          )}
          {txStatus.status === 'success' && (
            <Check className="w-3.5 h-3.5 text-[hsl(var(--color-success))] shrink-0" />
          )}
          {txStatus.status === 'error' && (
            <AlertCircle className="w-3.5 h-3.5 text-[hsl(var(--color-error))] shrink-0" />
          )}
          <div className="flex-1 min-w-0">
            <p
              className={cn(
                'text-[10px] font-medium truncate',
                txStatus.status === 'pending' && 'text-[hsl(var(--color-info)/0.9)]',
                txStatus.status === 'success' && 'text-[hsl(var(--color-success)/0.9)]',
                txStatus.status === 'error' && 'text-[hsl(var(--color-error)/0.9)]'
              )}
            >
              {txStatus.message}
            </p>
            {txStatus.hash && (
              <a
                href={`${networkConfig.explorerUrl}/tx/${txStatus.hash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[9px] text-[hsl(var(--color-text-muted))] hover:text-[hsl(var(--color-text-primary))] flex items-center gap-1"
              >
                View on BscScan
                <ExternalLink className="w-2.5 h-2.5" />
              </a>
            )}
          </div>
        </div>
      )}

      {/* Admin actions */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Vote className="w-3.5 h-3.5 text-[hsl(var(--color-accent-primary))]" />
          <span className="text-xs font-medium text-[hsl(var(--color-text-primary))]">
            Admin Controls
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <button
            onClick={handleStartVoting}
            disabled={!walletConnected || txStatus.status === 'pending'}
            className="px-3 py-2 text-[11px] rounded-lg bg-[hsl(var(--color-success))] text-black font-medium hover:bg-[hsl(var(--color-success)/0.9)] disabled:opacity-50"
          >
            Start Voting
          </button>
          <button
            onClick={handleEndVoting}
            disabled={!walletConnected || txStatus.status === 'pending'}
            className="px-3 py-2 text-[11px] rounded-lg bg-[hsl(var(--color-error))] text-white font-medium hover:bg-[hsl(var(--color-error)/0.9)] disabled:opacity-50"
          >
            End Voting
          </button>
        </div>
        {isOwnerHint}
      </div>

      {/* Vote form */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Users className="w-3.5 h-3.5 text-[hsl(var(--color-accent-secondary))]" />
          <span className="text-xs font-medium text-[hsl(var(--color-text-primary))]">
            Cast Your Vote
          </span>
        </div>
        <div className="p-3 rounded-lg bg-[hsl(var(--color-bg-base)/0.4)] border border-[hsl(var(--color-border-default)/0.4)] space-y-2">
          <input
            type="number"
            min={0}
            value={candidateIndex}
            onChange={(e) => setCandidateIndex(e.target.value)}
            placeholder="Candidate index (0, 1, 2, ...)"
            className="w-full px-3 py-2 bg-[hsl(var(--color-bg-base))] border border-[hsl(var(--color-border-default)/0.6)] rounded-lg text-xs text-[hsl(var(--color-text-primary))] placeholder-[hsl(var(--color-text-muted))] focus:outline-none focus:border-[hsl(var(--color-accent-primary))]"
          />
          <button
            onClick={handleVote}
            disabled={!walletConnected || txStatus.status === 'pending'}
            className="w-full py-2 bg-[hsl(var(--color-accent-primary))] hover:bg-[hsl(var(--color-accent-primary)/0.9)] text-black rounded-lg text-[11px] font-medium disabled:opacity-50"
          >
            Vote
          </button>
          <p className="text-[10px] text-[hsl(var(--color-text-muted))]">
            You can only vote once. The contract enforces one vote per address.
          </p>
        </div>
      </div>

      {/* Voting state */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Users className="w-3.5 h-3.5 text-[hsl(var(--color-accent-secondary))]" />
          <span className="text-xs font-medium text-[hsl(var(--color-text-primary))]">
            Current Results
          </span>
        </div>
        {contractError && (
          <div className="p-2.5 rounded-lg bg-[hsl(var(--color-error)/0.08)] border border-[hsl(var(--color-error)/0.4)] flex items-start gap-2">
            <AlertCircle className="w-3.5 h-3.5 text-[hsl(var(--color-error))]" />
            <p className="text-[10px] text-[hsl(var(--color-error)/0.9)]">{contractError}</p>
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          <div className="p-2.5 rounded-lg bg-[hsl(var(--color-bg-base)/0.5)] border border-[hsl(var(--color-border-default)/0.5)]">
            <p className="text-[10px] text-[hsl(var(--color-text-muted))]">Total votes</p>
            <p className="text-sm font-semibold text-[hsl(var(--color-text-primary))]">
              {totalVotes !== null ? totalVotes.toString() : '—'}
            </p>
          </div>
          <div className="p-2.5 rounded-lg bg-[hsl(var(--color-bg-base)/0.5)] border border-[hsl(var(--color-border-default)/0.5)]">
            <p className="text-[10px] text-[hsl(var(--color-text-muted))]">Owner</p>
            <p className="text-[11px] font-mono text-[hsl(var(--color-text-primary))] truncate">
              {owner ?? '—'}
            </p>
            <p className="text-[10px] text-[hsl(var(--color-text-muted))] mt-1">
              Voting status:{' '}
              <span className="font-medium">
                {votingOpen === null ? '—' : votingOpen ? 'Open' : 'Closed'}
              </span>
            </p>
          </div>
          <div className="p-2.5 rounded-lg bg-[hsl(var(--color-bg-base)/0.5)] border border-[hsl(var(--color-border-default)/0.5)]">
            <p className="text-[10px] text-[hsl(var(--color-text-muted))]">Leading candidate</p>
            <p className="text-sm font-semibold text-[hsl(var(--color-text-primary))]">
              {winnerName ?? '—'}
            </p>
            {winnerVotes !== null && (
              <p className="text-[10px] text-[hsl(var(--color-text-muted))]">
                Votes: <span className="font-medium">{winnerVotes.toString()}</span>
              </p>
            )}
          </div>
        </div>

        {/* Candidate list */}
        <div className="space-y-1">
          {candidates.length === 0 ? (
            <p className="text-[10px] text-[hsl(var(--color-text-muted))]">
              No candidates found yet. Make sure the contract is deployed on BNB Testnet and voting
              has been configured.
            </p>
          ) : (
            <div className="space-y-1.5">
              {candidates.map((c, idx) => (
                <div
                  key={`${c.name}-${idx}`}
                  className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-[hsl(var(--color-bg-base)/0.5)] border border-[hsl(var(--color-border-default)/0.4)]"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-[hsl(var(--color-text-muted))]">#{idx}</span>
                    <span className="text-xs font-medium text-[hsl(var(--color-text-primary))]">
                      {c.name}
                    </span>
                  </div>
                  <span className="text-xs font-semibold text-[hsl(var(--color-accent-primary))]">
                    {c.voteCount.toString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Has voted check */}
        <div className="space-y-2">
          <p className="text-[10px] font-medium text-[hsl(var(--color-text-primary))]">
            Check if an address has voted
          </p>
          <div className="flex flex-col gap-1.5">
            <input
              type="text"
              placeholder={userAddress ? 'Leave empty to use connected wallet' : '0x... address'}
              value={hasVotedAddress}
              onChange={(e) => setHasVotedAddress(e.target.value)}
              className="w-full px-3 py-1.5 bg-[hsl(var(--color-bg-base))] border border-[hsl(var(--color-border-default)/0.6)] rounded-lg text-[11px] text-[hsl(var(--color-text-primary))] placeholder-[hsl(var(--color-text-muted))] focus:outline-none focus:border-[hsl(var(--color-accent-primary))]"
            />
            <div className="flex items-center gap-2">
              <button
                onClick={handleCheckHasVoted}
                className="px-2.5 py-1.5 text-[10px] rounded-lg bg-[hsl(var(--color-accent-primary))] text-black font-medium hover:bg-[hsl(var(--color-accent-primary)/0.9)]"
              >
                Check status
              </button>
              {hasVotedResult !== null && !hasVotedError && (
                <span className="text-[10px] text-[hsl(var(--color-text-muted))]">
                  Result:{' '}
                  <span className="font-semibold">
                    {hasVotedResult ? 'Has voted' : 'Not voted yet'}
                  </span>
                </span>
              )}
              {hasVotedError && (
                <span className="text-[10px] text-[hsl(var(--color-error))] truncate">
                  {hasVotedError}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Get candidate by index */}
        <div className="space-y-2">
          <p className="text-[10px] font-medium text-[hsl(var(--color-text-primary))]">
            Get candidate by index
          </p>
          <div className="flex flex-col gap-1.5">
            <input
              type="number"
              min={0}
              placeholder="Enter candidate index (0, 1, 2, ...)"
              value={candidateQueryIndex}
              onChange={(e) => setCandidateQueryIndex(e.target.value)}
              className="w-full px-3 py-1.5 bg-[hsl(var(--color-bg-base))] border border-[hsl(var(--color-border-default)/0.6)] rounded-lg text-[11px] text-[hsl(var(--color-text-primary))] placeholder-[hsl(var(--color-text-muted))] focus:outline-none focus:border-[hsl(var(--color-accent-primary))]"
            />
            <div className="flex items-center gap-2">
              <button
                onClick={handleQueryCandidate}
                className="px-2.5 py-1.5 text-[10px] rounded-lg bg-[hsl(var(--color-accent-primary))] text-black font-medium hover:bg-[hsl(var(--color-accent-primary)/0.9)]"
              >
                Query candidate
              </button>
              {candidateQueryResult && !candidateQueryError && (
                <div className="flex items-center gap-2 text-[10px] text-[hsl(var(--color-text-muted))]">
                  <span className="font-semibold text-[hsl(var(--color-text-primary))]">
                    {candidateQueryResult.name}
                  </span>
                  <span>•</span>
                  <span>
                    Votes: <span className="font-semibold">{candidateQueryResult.voteCount.toString()}</span>
                  </span>
                </div>
              )}
              {candidateQueryError && (
                <span className="text-[10px] text-[hsl(var(--color-error))] truncate">
                  {candidateQueryError}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

