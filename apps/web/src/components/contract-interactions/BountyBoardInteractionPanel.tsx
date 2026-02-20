'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { ethers } from 'ethers';
import {
  ClipboardList,
  Users,
  RefreshCw,
  Loader2,
  AlertCircle,
  Check,
  ExternalLink,
  Timer,
  TrendingUp,
  Plus,
  ChevronDown,
  XCircle,
  CheckCircle,
  Send,
  Ban,
} from 'lucide-react';
import { useAccount } from 'wagmi';
import { cn } from '@/lib/utils';
import BnbChainLogo from '@/assets/blocks/BNB Chain.png';

import { BNB_BOUNTYBOARD_NETWORKS, type BnbNetworkKey } from '@root/lib/bnb-network-config';

const BOUNTYBOARD_ABI = [
  { "inputs": [], "stateMutability": "nonpayable", "type": "constructor" },
  { "anonymous": false, "inputs": [{ "indexed": true, "internalType": "uint256", "name": "bountyId", "type": "uint256" }], "name": "BountyCancelled", "type": "event" },
  { "anonymous": false, "inputs": [{ "indexed": true, "internalType": "uint256", "name": "bountyId", "type": "uint256" }, { "indexed": true, "internalType": "address", "name": "poster", "type": "address" }, { "indexed": false, "internalType": "string", "name": "title", "type": "string" }, { "indexed": false, "internalType": "uint256", "name": "reward", "type": "uint256" }], "name": "BountyCreated", "type": "event" },
  { "anonymous": false, "inputs": [{ "indexed": true, "internalType": "uint256", "name": "bountyId", "type": "uint256" }, { "indexed": true, "internalType": "address", "name": "poster", "type": "address" }, { "indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256" }], "name": "BountyReclaimed", "type": "event" },
  { "anonymous": false, "inputs": [{ "indexed": true, "internalType": "uint256", "name": "bountyId", "type": "uint256" }, { "indexed": true, "internalType": "address", "name": "worker", "type": "address" }, { "indexed": false, "internalType": "uint256", "name": "submissionIdx", "type": "uint256" }], "name": "SubmissionApproved", "type": "event" },
  { "anonymous": false, "inputs": [{ "indexed": true, "internalType": "uint256", "name": "bountyId", "type": "uint256" }, { "indexed": true, "internalType": "address", "name": "worker", "type": "address" }, { "indexed": false, "internalType": "uint256", "name": "submissionIdx", "type": "uint256" }], "name": "SubmissionRejected", "type": "event" },
  { "anonymous": false, "inputs": [{ "indexed": true, "internalType": "uint256", "name": "bountyId", "type": "uint256" }, { "indexed": true, "internalType": "address", "name": "worker", "type": "address" }], "name": "WorkSubmitted", "type": "event" },
  { "inputs": [{ "internalType": "uint256", "name": "_bountyId", "type": "uint256" }, { "internalType": "uint256", "name": "_submissionIdx", "type": "uint256" }], "name": "approveSubmission", "outputs": [], "stateMutability": "nonpayable", "type": "function" },
  { "inputs": [], "name": "bountyCount", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" },
  { "inputs": [{ "internalType": "uint256", "name": "_bountyId", "type": "uint256" }], "name": "cancelBounty", "outputs": [], "stateMutability": "nonpayable", "type": "function" },
  { "inputs": [{ "internalType": "string", "name": "_title", "type": "string" }, { "internalType": "string", "name": "_description", "type": "string" }, { "internalType": "string", "name": "_requirements", "type": "string" }, { "internalType": "string", "name": "_category", "type": "string" }, { "internalType": "uint256", "name": "_deadlineDays", "type": "uint256" }], "name": "createBounty", "outputs": [], "stateMutability": "payable", "type": "function" },
  { "inputs": [{ "internalType": "uint256", "name": "_id", "type": "uint256" }], "name": "getBounty", "outputs": [{ "components": [{ "internalType": "uint256", "name": "id", "type": "uint256" }, { "internalType": "address", "name": "poster", "type": "address" }, { "internalType": "string", "name": "title", "type": "string" }, { "internalType": "string", "name": "description", "type": "string" }, { "internalType": "string", "name": "requirements", "type": "string" }, { "internalType": "string", "name": "category", "type": "string" }, { "internalType": "uint256", "name": "reward", "type": "uint256" }, { "internalType": "uint256", "name": "deadline", "type": "uint256" }, { "internalType": "enum BountyBoard.BountyStatus", "name": "status", "type": "uint8" }, { "internalType": "uint256", "name": "submissionCount", "type": "uint256" }, { "internalType": "address", "name": "winner", "type": "address" }, { "internalType": "uint256", "name": "createdAt", "type": "uint256" }], "internalType": "struct BountyBoard.Bounty", "name": "", "type": "tuple" }], "stateMutability": "view", "type": "function" },
  { "inputs": [{ "internalType": "uint256", "name": "_bountyId", "type": "uint256" }], "name": "getSubmissions", "outputs": [{ "components": [{ "internalType": "address", "name": "worker", "type": "address" }, { "internalType": "string", "name": "solutionUrl", "type": "string" }, { "internalType": "string", "name": "notes", "type": "string" }, { "internalType": "uint256", "name": "submittedAt", "type": "uint256" }, { "internalType": "bool", "name": "approved", "type": "bool" }, { "internalType": "bool", "name": "rejected", "type": "bool" }], "internalType": "struct BountyBoard.Submission[]", "name": "", "type": "tuple[]" }], "stateMutability": "view", "type": "function" },
  { "inputs": [], "name": "owner", "outputs": [{ "internalType": "address", "name": "", "type": "address" }], "stateMutability": "view", "type": "function" },
  { "inputs": [], "name": "platformFeePercent", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" },
  { "inputs": [{ "internalType": "uint256", "name": "_bountyId", "type": "uint256" }], "name": "reclaimExpiredBounty", "outputs": [], "stateMutability": "nonpayable", "type": "function" },
  { "inputs": [{ "internalType": "uint256", "name": "_bountyId", "type": "uint256" }, { "internalType": "uint256", "name": "_submissionIdx", "type": "uint256" }], "name": "rejectSubmission", "outputs": [], "stateMutability": "nonpayable", "type": "function" },
  { "inputs": [{ "internalType": "uint256", "name": "_bountyId", "type": "uint256" }, { "internalType": "string", "name": "_solutionUrl", "type": "string" }, { "internalType": "string", "name": "_notes", "type": "string" }], "name": "submitWork", "outputs": [], "stateMutability": "nonpayable", "type": "function" },
];

const BOUNTY_STATUS_LABELS = ['Open', 'Under Review', 'Completed', 'Expired', 'Cancelled'];
const BOUNTY_STATUS_COLORS: Record<number, string> = {
  0: 'bg-green-500/15 text-green-400',
  1: 'bg-yellow-500/15 text-yellow-400',
  2: 'bg-blue-500/15 text-blue-400',
  3: 'bg-orange-500/15 text-orange-400',
  4: 'bg-red-500/15 text-red-400',
};

export interface BountyBoardInteractionPanelProps {
  contractAddress?: string;
}

interface BountyData {
  id: number;
  poster: string;
  title: string;
  description: string;
  requirements: string;
  category: string;
  reward: bigint;
  deadline: bigint;
  status: number;
  submissionCount: bigint;
  winner: string;
  createdAt: bigint;
}

interface SubmissionData {
  worker: string;
  solutionUrl: string;
  notes: string;
  submittedAt: bigint;
  approved: boolean;
  rejected: boolean;
}

interface TxStatus {
  status: 'idle' | 'pending' | 'success' | 'error';
  message: string;
  hash?: string;
}

export function BountyBoardInteractionPanel({
  contractAddress: initialAddress,
}: BountyBoardInteractionPanelProps) {
  const [selectedNetwork, setSelectedNetwork] = useState<BnbNetworkKey>('testnet');
  const [showNetworkDropdown, setShowNetworkDropdown] = useState(false);
  const networkConfig = BNB_BOUNTYBOARD_NETWORKS[selectedNetwork];
  const contractAddress = networkConfig.contracts.bountyBoard ?? initialAddress ?? '0x54e583f445b5b4736628d04fcff66698977b4b00';

  const { address: userAddress, isConnected: walletConnected, chain } = useAccount();

  // Bounty state
  const [bountyCount, setBountyCount] = useState<number>(0);
  const [selectedBountyId, setSelectedBountyId] = useState<number | null>(null);
  const [bountyData, setBountyData] = useState<BountyData | null>(null);
  const [submissions, setSubmissions] = useState<SubmissionData[]>([]);

  // Submit work state
  const [solutionUrl, setSolutionUrl] = useState('');
  const [solutionNotes, setSolutionNotes] = useState('');
  const [showSubmitForm, setShowSubmitForm] = useState(false);

  // Create bounty state
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newRequirements, setNewRequirements] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [newDeadlineDays, setNewDeadlineDays] = useState('14');
  const [newReward, setNewReward] = useState('0.1');
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Tx status
  const [txStatus, setTxStatus] = useState<TxStatus>({ status: 'idle', message: '' });
  const [contractError, setContractError] = useState<string | null>(null);

  const explorerUrl = `${networkConfig.explorerUrl}/address/${contractAddress}`;

  const getReadContract = useCallback(() => {
    if (!contractAddress) return null;
    const provider = new ethers.JsonRpcProvider(networkConfig.rpcUrl);
    return new ethers.Contract(contractAddress, BOUNTYBOARD_ABI, provider);
  }, [contractAddress, networkConfig.rpcUrl]);

  const getWriteContract = useCallback(async () => {
    if (!contractAddress) throw new Error('No contract address specified');
    if (!walletConnected) throw new Error('Please connect your wallet first');

    const ethereum = (window as any).ethereum;
    if (!ethereum) throw new Error('No wallet detected. Please install MetaMask or a compatible wallet.');

    const targetChainIdHex = `0x${networkConfig.chainId.toString(16)}`;

    if (chain?.id !== networkConfig.chainId) {
      try {
        await ethereum.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: targetChainIdHex }] });
      } catch (switchError: any) {
        if (switchError.code === 4902) {
          await ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{ chainId: targetChainIdHex, chainName: networkConfig.name, rpcUrls: [networkConfig.rpcUrl], nativeCurrency: networkConfig.nativeCurrency, blockExplorerUrls: [networkConfig.explorerUrl] }],
          });
        } else {
          throw switchError;
        }
      }
    }

    const provider = new ethers.BrowserProvider(ethereum);
    const signer = await provider.getSigner();
    return new ethers.Contract(contractAddress, BOUNTYBOARD_ABI, signer);
  }, [contractAddress, walletConnected, chain?.id, networkConfig]);

  // Fetch bounty count
  const fetchBountyCount = useCallback(async () => {
    try {
      const contract = getReadContract();
      if (!contract) return;
      const count = await contract.bountyCount();
      const countNum = Number(count);
      setBountyCount(countNum);
      if (countNum > 0 && selectedBountyId === null) {
        setSelectedBountyId(countNum);
      }
      setContractError(null);
    } catch (err: any) {
      setContractError(err.message || 'Failed to fetch bounty count');
    }
  }, [getReadContract, selectedBountyId]);

  // Fetch bounty data
  const fetchBountyData = useCallback(async () => {
    if (selectedBountyId === null || selectedBountyId < 1) return;
    try {
      const contract = getReadContract();
      if (!contract) return;

      const b = await contract.getBounty(selectedBountyId);
      setBountyData({
        id: Number(b.id),
        poster: b.poster,
        title: b.title,
        description: b.description,
        requirements: b.requirements,
        category: b.category,
        reward: b.reward,
        deadline: b.deadline,
        status: Number(b.status),
        submissionCount: b.submissionCount,
        winner: b.winner,
        createdAt: b.createdAt,
      });

      const subs = await contract.getSubmissions(selectedBountyId);
      setSubmissions(subs.map((s: any) => ({
        worker: s.worker,
        solutionUrl: s.solutionUrl,
        notes: s.notes,
        submittedAt: s.submittedAt,
        approved: s.approved,
        rejected: s.rejected,
      })));

      setContractError(null);
    } catch (err: any) {
      setContractError(err.message || 'Failed to fetch bounty data');
    }
  }, [selectedBountyId, getReadContract]);

  useEffect(() => { fetchBountyCount(); }, [fetchBountyCount]);
  useEffect(() => { fetchBountyData(); }, [fetchBountyData]);

  // Auto-refresh
  useEffect(() => {
    const iv = setInterval(() => { fetchBountyCount(); fetchBountyData(); }, 15000);
    return () => clearInterval(iv);
  }, [fetchBountyCount, fetchBountyData]);

  // ── Actions ───────────────────────────────────────────────────────
  const handleCreateBounty = async () => {
    try {
      setTxStatus({ status: 'pending', message: 'Creating bounty…' });
      const contract = await getWriteContract();
      const tx = await contract.createBounty(newTitle, newDescription, newRequirements, newCategory, BigInt(newDeadlineDays), { value: ethers.parseEther(newReward) });
      setTxStatus({ status: 'pending', message: 'Waiting for confirmation…', hash: tx.hash });
      await tx.wait();
      setTxStatus({ status: 'success', message: 'Bounty created!', hash: tx.hash });
      setShowCreateForm(false);
      setNewTitle(''); setNewDescription(''); setNewRequirements(''); setNewCategory(''); setNewReward('0.1'); setNewDeadlineDays('14');
      fetchBountyCount();
    } catch (err: any) {
      setTxStatus({ status: 'error', message: err.reason || err.message || 'Transaction failed' });
    }
  };

  const handleSubmitWork = async () => {
    try {
      if (selectedBountyId === null) return;
      setTxStatus({ status: 'pending', message: 'Submitting work…' });
      const contract = await getWriteContract();
      const tx = await contract.submitWork(selectedBountyId, solutionUrl, solutionNotes);
      setTxStatus({ status: 'pending', message: 'Waiting for confirmation…', hash: tx.hash });
      await tx.wait();
      setTxStatus({ status: 'success', message: 'Work submitted!', hash: tx.hash });
      setShowSubmitForm(false);
      setSolutionUrl(''); setSolutionNotes('');
      fetchBountyData();
    } catch (err: any) {
      setTxStatus({ status: 'error', message: err.reason || err.message || 'Transaction failed' });
    }
  };

  const handleApprove = async (idx: number) => {
    try {
      if (selectedBountyId === null) return;
      setTxStatus({ status: 'pending', message: 'Approving submission…' });
      const contract = await getWriteContract();
      const tx = await contract.approveSubmission(selectedBountyId, idx);
      setTxStatus({ status: 'pending', message: 'Waiting for confirmation…', hash: tx.hash });
      await tx.wait();
      setTxStatus({ status: 'success', message: 'Submission approved!', hash: tx.hash });
      fetchBountyData();
    } catch (err: any) {
      setTxStatus({ status: 'error', message: err.reason || err.message || 'Transaction failed' });
    }
  };

  const handleReject = async (idx: number) => {
    try {
      if (selectedBountyId === null) return;
      setTxStatus({ status: 'pending', message: 'Rejecting submission…' });
      const contract = await getWriteContract();
      const tx = await contract.rejectSubmission(selectedBountyId, idx);
      setTxStatus({ status: 'pending', message: 'Waiting for confirmation…', hash: tx.hash });
      await tx.wait();
      setTxStatus({ status: 'success', message: 'Submission rejected!', hash: tx.hash });
      fetchBountyData();
    } catch (err: any) {
      setTxStatus({ status: 'error', message: err.reason || err.message || 'Transaction failed' });
    }
  };

  const handleCancel = async () => {
    try {
      if (selectedBountyId === null) return;
      setTxStatus({ status: 'pending', message: 'Cancelling bounty…' });
      const contract = await getWriteContract();
      const tx = await contract.cancelBounty(selectedBountyId);
      setTxStatus({ status: 'pending', message: 'Waiting for confirmation…', hash: tx.hash });
      await tx.wait();
      setTxStatus({ status: 'success', message: 'Bounty cancelled!', hash: tx.hash });
      fetchBountyData();
    } catch (err: any) {
      setTxStatus({ status: 'error', message: err.reason || err.message || 'Transaction failed' });
    }
  };

  const handleReclaim = async () => {
    try {
      if (selectedBountyId === null) return;
      setTxStatus({ status: 'pending', message: 'Reclaiming bounty…' });
      const contract = await getWriteContract();
      const tx = await contract.reclaimExpiredBounty(selectedBountyId);
      setTxStatus({ status: 'pending', message: 'Waiting for confirmation…', hash: tx.hash });
      await tx.wait();
      setTxStatus({ status: 'success', message: 'Bounty reclaimed!', hash: tx.hash });
      fetchBountyData();
    } catch (err: any) {
      setTxStatus({ status: 'error', message: err.reason || err.message || 'Transaction failed' });
    }
  };

  // Helpers
  const isPoster = bountyData && userAddress ? bountyData.poster.toLowerCase() === userAddress.toLowerCase() : false;
  const isExpired = bountyData ? Number(bountyData.deadline) * 1000 < Date.now() : false;

  const formatTimeLeft = (deadline: bigint) => {
    const ms = Number(deadline) * 1000 - Date.now();
    if (ms <= 0) return 'Expired';
    const d = Math.floor(ms / 86400000);
    const h = Math.floor((ms % 86400000) / 3600000);
    if (d > 0) return `${d}d ${h}h left`;
    const m = Math.floor((ms % 3600000) / 60000);
    return `${h}h ${m}m left`;
  };

  return (
    <div className="space-y-3 text-sm">
      {/* Network selector */}
      <div className="relative">
        <button
          onClick={() => setShowNetworkDropdown(!showNetworkDropdown)}
          className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-[hsl(var(--color-bg-default))] border border-[hsl(var(--color-border-default))] text-xs hover:border-accent-cyan/40 transition-all"
        >
          <div className="flex items-center gap-2">
            <Image src={BnbChainLogo} alt="BNB" width={16} height={16} className="rounded-full" />
            <span className="text-[hsl(var(--color-text-default))]">{networkConfig.name}</span>
          </div>
          <ChevronDown className={cn('w-3 h-3 text-[hsl(var(--color-text-dim))] transition-transform', showNetworkDropdown && 'rotate-180')} />
        </button>
        {showNetworkDropdown && (
          <div className="absolute z-50 w-full mt-1 py-1 rounded-lg bg-[hsl(var(--color-bg-elevated))] border border-[hsl(var(--color-border-default))] shadow-xl">
            {Object.entries(BNB_BOUNTYBOARD_NETWORKS).map(([key, net]) => (
              <button
                key={key}
                onClick={() => { setSelectedNetwork(key as BnbNetworkKey); setShowNetworkDropdown(false); }}
                className={cn(
                  'w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-[hsl(var(--color-bg-hover))]',
                  selectedNetwork === key && 'bg-accent-cyan/10 text-accent-cyan'
                )}
              >
                <Image src={BnbChainLogo} alt="BNB" width={14} height={14} className="rounded-full" />
                {net.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Explorer link */}
      <a href={explorerUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-[10px] text-accent-cyan/60 hover:text-accent-cyan transition-colors">
        <ExternalLink className="w-3 h-3" /> View on {networkConfig.name} Explorer
      </a>

      {/* Contract error */}
      {contractError && (
        <div className="p-2 rounded-lg bg-red-500/10 border border-red-500/20 text-[10px] text-red-400 flex items-start gap-2">
          <AlertCircle className="w-3 h-3 mt-0.5 shrink-0" />
          <span className="break-all">{contractError}</span>
        </div>
      )}

      {/* Bounty selector */}
      <div className="p-3 rounded-lg bg-[hsl(var(--color-bg-muted))] border border-[hsl(var(--color-border-default))]">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] uppercase tracking-wider text-[hsl(var(--color-text-dim))] font-medium">Bounty #{selectedBountyId ?? '—'}</span>
          <button onClick={() => { fetchBountyCount(); fetchBountyData(); }} className="p-1 rounded hover:bg-[hsl(var(--color-bg-hover))] text-[hsl(var(--color-text-dim))] hover:text-accent-cyan transition-colors">
            <RefreshCw className="w-3 h-3" />
          </button>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setSelectedBountyId((prev) => Math.max(1, (prev ?? 1) - 1))}
            disabled={!selectedBountyId || selectedBountyId <= 1}
            className="px-2 py-1 rounded bg-[hsl(var(--color-bg-default))] border border-[hsl(var(--color-border-default))] text-[10px] disabled:opacity-30 hover:border-accent-cyan/40 transition-all"
          >
            ◀
          </button>
          <span className="flex-1 text-center text-xs font-mono text-[hsl(var(--color-text-default))]">{selectedBountyId ?? '—'} / {bountyCount}</span>
          <button
            onClick={() => setSelectedBountyId((prev) => Math.min(bountyCount, (prev ?? 0) + 1))}
            disabled={!selectedBountyId || selectedBountyId >= bountyCount}
            className="px-2 py-1 rounded bg-[hsl(var(--color-bg-default))] border border-[hsl(var(--color-border-default))] text-[10px] disabled:opacity-30 hover:border-accent-cyan/40 transition-all"
          >
            ▶
          </button>
        </div>
      </div>

      {/* Bounty details */}
      {bountyData && (
        <div className="space-y-3">
          {/* Title & Status */}
          <div className="p-3 rounded-lg bg-[hsl(var(--color-bg-muted))] border border-[hsl(var(--color-border-default))]">
            <div className="flex items-start justify-between mb-1">
              <h4 className="text-sm font-semibold text-[hsl(var(--color-text-default))]">{bountyData.title}</h4>
              <span className={cn('px-1.5 py-0.5 rounded text-[9px] font-medium shrink-0 ml-2', BOUNTY_STATUS_COLORS[bountyData.status] || 'bg-gray-500/15 text-gray-400')}>
                {BOUNTY_STATUS_LABELS[bountyData.status] ?? 'Unknown'}
              </span>
            </div>
            <p className="text-[10px] text-[hsl(var(--color-text-dim))] mb-1 line-clamp-2">{bountyData.description}</p>
            {bountyData.category && (
              <span className="inline-block px-1.5 py-0.5 rounded text-[9px] font-medium bg-accent-cyan/10 text-accent-cyan/70">{bountyData.category}</span>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-2">
            <div className="p-2 rounded-lg bg-[hsl(var(--color-bg-muted))] border border-[hsl(var(--color-border-default))] text-center">
              <div className="text-xs font-mono text-accent-cyan">{ethers.formatEther(bountyData.reward)}</div>
              <div className="text-[9px] text-[hsl(var(--color-text-dim))]">BNB Reward</div>
            </div>
            <div className="p-2 rounded-lg bg-[hsl(var(--color-bg-muted))] border border-[hsl(var(--color-border-default))] text-center">
              <div className="text-xs font-mono text-[hsl(var(--color-text-default))]">{Number(bountyData.submissionCount)}</div>
              <div className="text-[9px] text-[hsl(var(--color-text-dim))]">Submissions</div>
            </div>
            <div className="p-2 rounded-lg bg-[hsl(var(--color-bg-muted))] border border-[hsl(var(--color-border-default))] text-center">
              <div className="text-xs font-mono text-[hsl(var(--color-text-default))]">{isExpired ? 'Expired' : formatTimeLeft(bountyData.deadline)}</div>
              <div className="text-[9px] text-[hsl(var(--color-text-dim))]">Deadline</div>
            </div>
          </div>

          {/* Requirements */}
          {bountyData.requirements && (
            <div className="p-3 rounded-lg bg-[hsl(var(--color-bg-muted))] border border-[hsl(var(--color-border-default))]">
              <span className="text-[10px] uppercase tracking-wider text-[hsl(var(--color-text-dim))] font-medium">Requirements</span>
              <p className="mt-1 text-[10px] text-[hsl(var(--color-text-default))]">{bountyData.requirements}</p>
            </div>
          )}

          {/* Submissions list */}
          {submissions.length > 0 && (
            <div className="p-3 rounded-lg bg-[hsl(var(--color-bg-muted))] border border-[hsl(var(--color-border-default))]">
              <span className="text-[10px] uppercase tracking-wider text-[hsl(var(--color-text-dim))] font-medium mb-2 block">Submissions ({submissions.length})</span>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {submissions.map((sub, idx) => (
                  <div key={idx} className="p-2 rounded bg-[hsl(var(--color-bg-default))] border border-[hsl(var(--color-border-default))] text-[10px]">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono text-[hsl(var(--color-text-dim))]">{sub.worker.slice(0, 6)}…{sub.worker.slice(-4)}</span>
                      {sub.approved && <span className="text-green-400 text-[9px]">✓ Approved</span>}
                      {sub.rejected && <span className="text-red-400 text-[9px]">✗ Rejected</span>}
                      {!sub.approved && !sub.rejected && <span className="text-yellow-400 text-[9px]">Pending</span>}
                    </div>
                    {sub.solutionUrl && <a href={sub.solutionUrl} target="_blank" rel="noreferrer" className="text-accent-cyan/60 hover:text-accent-cyan underline block truncate">{sub.solutionUrl}</a>}
                    {sub.notes && <p className="text-[hsl(var(--color-text-dim))] mt-0.5">{sub.notes}</p>}
                    {/* Poster actions */}
                    {isPoster && !sub.approved && !sub.rejected && bountyData.status === 1 && (
                      <div className="flex gap-1 mt-1.5">
                        <button onClick={() => handleApprove(idx)} disabled={txStatus.status === 'pending'} className="flex-1 px-2 py-1 rounded text-[9px] font-medium bg-green-500/15 text-green-400 hover:bg-green-500/25 transition-all">
                          <CheckCircle className="w-2.5 h-2.5 inline mr-0.5" /> Approve
                        </button>
                        <button onClick={() => handleReject(idx)} disabled={txStatus.status === 'pending'} className="flex-1 px-2 py-1 rounded text-[9px] font-medium bg-red-500/15 text-red-400 hover:bg-red-500/25 transition-all">
                          <Ban className="w-2.5 h-2.5 inline mr-0.5" /> Reject
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Submit work (for workers) */}
          {!isPoster && bountyData.status === 0 && !isExpired && (
            <div>
              <button onClick={() => setShowSubmitForm(!showSubmitForm)} className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-accent-cyan/10 text-accent-cyan hover:bg-accent-cyan/20 border border-accent-cyan/20 transition-all">
                <Send className="w-3 h-3" /> Submit Work
              </button>
              {showSubmitForm && (
                <div className="mt-2 space-y-2 p-3 rounded-lg bg-[hsl(var(--color-bg-muted))] border border-[hsl(var(--color-border-default))]">
                  <input value={solutionUrl} onChange={(e) => setSolutionUrl(e.target.value)} placeholder="Solution URL" className="w-full bg-[hsl(var(--color-bg-default))] border border-[hsl(var(--color-border-default))] rounded px-2 py-1.5 text-xs text-[hsl(var(--color-text-default))] placeholder-[hsl(var(--color-text-dim))] focus:outline-none focus:ring-1 focus:ring-accent-cyan/50" />
                  <textarea value={solutionNotes} onChange={(e) => setSolutionNotes(e.target.value)} placeholder="Notes" rows={2} className="w-full bg-[hsl(var(--color-bg-default))] border border-[hsl(var(--color-border-default))] rounded px-2 py-1.5 text-xs text-[hsl(var(--color-text-default))] placeholder-[hsl(var(--color-text-dim))] focus:outline-none focus:ring-1 focus:ring-accent-cyan/50 resize-none" />
                  <button onClick={handleSubmitWork} disabled={!walletConnected || !solutionUrl || txStatus.status === 'pending'} className={cn('w-full px-3 py-2 rounded-lg text-xs font-medium transition-all', walletConnected && solutionUrl ? 'bg-accent-cyan text-black hover:bg-accent-cyan/80' : 'bg-gray-600 text-gray-400 cursor-not-allowed')}>
                    {txStatus.status === 'pending' ? <Loader2 className="w-3 h-3 animate-spin mx-auto" /> : 'Submit'}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Poster actions */}
          {isPoster && (
            <div className="space-y-2">
              {bountyData.status === 0 && (
                <button onClick={handleCancel} disabled={txStatus.status === 'pending'} className="w-full px-3 py-2 rounded-lg text-xs font-medium bg-red-500/15 text-red-400 hover:bg-red-500/25 border border-red-500/20 transition-all">
                  <XCircle className="w-3 h-3 inline mr-1.5" /> Cancel Bounty
                </button>
              )}
              {isExpired && (bountyData.status === 0 || bountyData.status === 1) && (
                <button onClick={handleReclaim} disabled={txStatus.status === 'pending'} className="w-full px-3 py-2 rounded-lg text-xs font-medium bg-orange-500/15 text-orange-400 hover:bg-orange-500/25 border border-orange-500/20 transition-all">
                  Reclaim Expired Bounty
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Create bounty */}
      <div className="border-t border-[hsl(var(--color-border-default))] pt-3">
        <button onClick={() => setShowCreateForm(!showCreateForm)} className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-accent-cyan/10 text-accent-cyan hover:bg-accent-cyan/20 border border-accent-cyan/20 transition-all">
          <Plus className="w-3 h-3" /> Create Bounty
        </button>

        {showCreateForm && (
          <div className="mt-3 space-y-2 p-3 rounded-lg bg-[hsl(var(--color-bg-muted))] border border-[hsl(var(--color-border-default))]">
            <input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="Bounty title" className="w-full bg-[hsl(var(--color-bg-default))] border border-[hsl(var(--color-border-default))] rounded px-2 py-1.5 text-xs text-[hsl(var(--color-text-default))] placeholder-[hsl(var(--color-text-dim))] focus:outline-none focus:ring-1 focus:ring-accent-cyan/50" />
            <textarea value={newDescription} onChange={(e) => setNewDescription(e.target.value)} placeholder="Description" rows={2} className="w-full bg-[hsl(var(--color-bg-default))] border border-[hsl(var(--color-border-default))] rounded px-2 py-1.5 text-xs text-[hsl(var(--color-text-default))] placeholder-[hsl(var(--color-text-dim))] focus:outline-none focus:ring-1 focus:ring-accent-cyan/50 resize-none" />
            <input value={newRequirements} onChange={(e) => setNewRequirements(e.target.value)} placeholder="Requirements" className="w-full bg-[hsl(var(--color-bg-default))] border border-[hsl(var(--color-border-default))] rounded px-2 py-1.5 text-xs text-[hsl(var(--color-text-default))] placeholder-[hsl(var(--color-text-dim))] focus:outline-none focus:ring-1 focus:ring-accent-cyan/50" />
            <input value={newCategory} onChange={(e) => setNewCategory(e.target.value)} placeholder="Category (e.g. Development)" className="w-full bg-[hsl(var(--color-bg-default))] border border-[hsl(var(--color-border-default))] rounded px-2 py-1.5 text-xs text-[hsl(var(--color-text-default))] placeholder-[hsl(var(--color-text-dim))] focus:outline-none focus:ring-1 focus:ring-accent-cyan/50" />
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[9px] text-[hsl(var(--color-text-dim))] mb-0.5">Reward (BNB)</label>
                <input type="number" min="0.001" step="0.001" value={newReward} onChange={(e) => setNewReward(e.target.value)} className="w-full bg-[hsl(var(--color-bg-default))] border border-[hsl(var(--color-border-default))] rounded px-2 py-1.5 text-xs font-mono text-[hsl(var(--color-text-default))] focus:outline-none focus:ring-1 focus:ring-accent-cyan/50" />
              </div>
              <div>
                <label className="block text-[9px] text-[hsl(var(--color-text-dim))] mb-0.5">Deadline (days)</label>
                <input type="number" min="1" value={newDeadlineDays} onChange={(e) => setNewDeadlineDays(e.target.value)} className="w-full bg-[hsl(var(--color-bg-default))] border border-[hsl(var(--color-border-default))] rounded px-2 py-1.5 text-xs font-mono text-[hsl(var(--color-text-default))] focus:outline-none focus:ring-1 focus:ring-accent-cyan/50" />
              </div>
            </div>
            <button onClick={handleCreateBounty} disabled={!walletConnected || !newTitle || txStatus.status === 'pending'} className={cn('w-full px-3 py-2 rounded-lg text-xs font-medium transition-all', walletConnected && newTitle ? 'bg-accent-cyan text-black hover:bg-accent-cyan/80' : 'bg-gray-600 text-gray-400 cursor-not-allowed')}>
              {txStatus.status === 'pending' ? <Loader2 className="w-3 h-3 animate-spin mx-auto" /> : 'Create Bounty (sends reward)'}
            </button>
          </div>
        )}
      </div>

      {/* Tx status */}
      {txStatus.status !== 'idle' && (
        <div className={cn(
          'p-2 rounded-lg text-[10px] flex items-start gap-2 border',
          txStatus.status === 'pending' && 'bg-yellow-500/10 border-yellow-500/20 text-yellow-300',
          txStatus.status === 'success' && 'bg-green-500/10 border-green-500/20 text-green-300',
          txStatus.status === 'error' && 'bg-red-500/10 border-red-500/20 text-red-300'
        )}>
          {txStatus.status === 'pending' && <Loader2 className="w-3 h-3 animate-spin shrink-0 mt-0.5" />}
          {txStatus.status === 'success' && <Check className="w-3 h-3 shrink-0 mt-0.5" />}
          {txStatus.status === 'error' && <AlertCircle className="w-3 h-3 shrink-0 mt-0.5" />}
          <div>
            <span>{txStatus.message}</span>
            {txStatus.hash && (
              <a href={`${networkConfig.explorerUrl}/tx/${txStatus.hash}`} target="_blank" rel="noreferrer" className="block mt-1 text-accent-cyan/60 hover:text-accent-cyan underline">
                View Transaction
              </a>
            )}
          </div>
        </div>
      )}

      {/* Wallet warning */}
      {!walletConnected && (
        <div className="p-2 rounded-lg bg-orange-500/10 border border-orange-500/20 text-[10px] text-orange-300 flex items-center gap-2">
          <AlertCircle className="w-3 h-3 shrink-0" />
          Connect your wallet to interact with this contract
        </div>
      )}
    </div>
  );
}
