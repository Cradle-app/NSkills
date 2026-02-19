'use client';

import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import {
    PiggyBank,
    Users,
    RefreshCw,
    Loader2,
    AlertCircle,
    Check,
    ExternalLink,
    Timer,
    TrendingUp,
    ArrowDownToLine,
    Target,
    ChevronDown,
    Globe,
} from 'lucide-react';
import Image from 'next/image';
import { useAccount } from 'wagmi';
import { cn } from '@/lib/utils';
import BnbChainLogo from '@/assets/blocks/BNB Chain.png';
import GROUP_SAVINGS_ABI from '../../../../../packages/components/bnb-groupsavings/contract/groupsavings/group-savings.json';

const BNB_NETWORKS = {
    testnet: {
        id: 'testnet' as const,
        name: 'BNB Smart Chain Testnet',
        chainId: 97,
        rpcUrl: 'https://data-seed-prebsc-1-s1.bnbchain.org:8545',
        explorerUrl: 'https://testnet.bscscan.com',
        label: 'BNB Testnet',
        description: 'Deployed GroupSavings.sol contract on BNB Testnet',
        disabled: false,
        symbol: 'tBNB',
        contractAddress: '0x9C8ca8Cb9eC9886f2cbD9917F083D561e773cF28',
    },
    mainnet: {
        id: 'mainnet' as const,
        name: 'BSC Mainnet',
        chainId: 56,
        rpcUrl: 'https://bsc-dataseed.bnbchain.org',
        explorerUrl: 'https://bscscan.com',
        label: 'BNB Mainnet',
        description: 'No GroupSavings contract deployed yet (coming soon)',
        disabled: true,
        symbol: 'BNB',
        contractAddress: undefined,
    },
    opbnbTestnet: {
        id: 'opbnbTestnet' as const,
        name: 'opBNB Testnet',
        chainId: 5611,
        rpcUrl: 'https://opbnb-testnet-rpc.bnbchain.org',
        explorerUrl: 'https://opbnb-testnet.bscscan.com',
        label: 'opBNB Testnet',
        description: 'Deployed GroupSavings.sol contract on opBNB L2 Testnet',
        disabled: false,
        symbol: 'tBNB',
        contractAddress: '0xB9896Cb9aC638EE36324B57c6eF8E88668Ef6c3c',
    },
    opbnbMainnet: {
        id: 'opbnbMainnet' as const,
        name: 'opBNB Mainnet',
        chainId: 204,
        rpcUrl: 'https://opbnb-mainnet-rpc.bnbchain.org',
        explorerUrl: 'https://opbnbscan.com',
        label: 'opBNB Mainnet',
        description: 'opBNB L2 Mainnet (coming soon)',
        disabled: true,
        symbol: 'BNB',
        contractAddress: undefined,
    },
} as const;

type BnbNetworkKey = keyof typeof BNB_NETWORKS;

export interface GroupSavingsInteractionPanelProps {
    contractAddress?: string;
    onNetworkChange?: (contractAddress: string, networkLabel: string) => void;
}

interface TxStatus {
    status: 'idle' | 'pending' | 'success' | 'error';
    message: string;
    hash?: string;
}

export function GroupSavingsInteractionPanel({
    contractAddress: initialAddress,
    onNetworkChange,
}: GroupSavingsInteractionPanelProps) {
    const [selectedNetwork, setSelectedNetwork] = useState<BnbNetworkKey>('testnet');
    const [showNetworkDropdown, setShowNetworkDropdown] = useState(false);
    const networkConfig = BNB_NETWORKS[selectedNetwork];
    const contractAddress = networkConfig.contractAddress ?? initialAddress ?? '0x1234567890123456789012345678901234567890';

    const { address: userAddress, isConnected: walletConnected, chain } = useAccount();

    const [desc, setDesc] = useState<string | null>(null);
    const [goalAmount, setGoalAmount] = useState<bigint | null>(null);
    const [totalRaised, setTotalRaised] = useState<bigint | null>(null);
    const [remaining, setRemaining] = useState<bigint | null>(null);
    const [secondsLeft, setSecondsLeft] = useState<bigint | null>(null);
    const [goalMet, setGoalMet] = useState<boolean | null>(null);
    const [isWithdrawn, setIsWithdrawn] = useState<boolean | null>(null);
    const [owner, setOwner] = useState<string | null>(null);
    const [progressPct, setProgressPct] = useState<bigint | null>(null);

    const [contributeAmount, setContributeAmount] = useState('');

    const [checkAddress, setCheckAddress] = useState('');
    const [checkResult, setCheckResult] = useState<bigint | null>(null);
    const [checkError, setCheckError] = useState<string | null>(null);

    const [txStatus, setTxStatus] = useState<TxStatus>({ status: 'idle', message: '' });
    const [contractError, setContractError] = useState<string | null>(null);

    const explorerUrl = `${networkConfig.explorerUrl}/address/${contractAddress}`;

    const getReadContract = useCallback(() => {
        if (!contractAddress) return null;
        const provider = new ethers.JsonRpcProvider(networkConfig.rpcUrl);
        return new ethers.Contract(contractAddress, GROUP_SAVINGS_ABI, provider);
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
                                    nativeCurrency: {
                                        name: networkConfig.symbol,
                                        symbol: networkConfig.symbol,
                                        decimals: 18,
                                    },
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
        return new ethers.Contract(contractAddress, GROUP_SAVINGS_ABI, signer);
    }, [chain?.id, contractAddress, walletConnected, networkConfig]);

    const resetState = useCallback(() => {
        setDesc(null);
        setGoalAmount(null);
        setTotalRaised(null);
        setRemaining(null);
        setSecondsLeft(null);
        setGoalMet(null);
        setIsWithdrawn(null);
        setOwner(null);
        setProgressPct(null);
        setCheckResult(null);
        setCheckError(null);
        setContractError(null);
    }, []);

    const fetchState = useCallback(async () => {
        const contract = getReadContract();
        if (!contract) return;

        setContractError(null);
        try {
            const [status, contractOwner, pct] = await Promise.all([
                contract.getStatus(),
                contract.owner(),
                contract.progressPercent(),
            ]);

            setDesc(status.desc as string);
            setGoalAmount(status.goal as bigint);
            setTotalRaised(status.raised as bigint);
            setRemaining(status.remaining as bigint);
            setSecondsLeft(status.secondsLeft as bigint);
            setGoalMet(Boolean(status.goalMet));
            setIsWithdrawn(Boolean(status.isWithdrawn));
            setOwner(contractOwner as string);
            setProgressPct(pct as bigint);
        } catch (error: any) {
            console.error('Error fetching savings state:', error);
            setContractError(error?.reason || error?.message || 'Unable to read contract state on BNB Testnet');
        }
    }, [getReadContract]);

    useEffect(() => {
        if (contractAddress) {
            resetState();
            fetchState();
        }
    }, [contractAddress, selectedNetwork, fetchState, resetState]);

    useEffect(() => {
        if (goalMet || isWithdrawn || secondsLeft === null || secondsLeft === 0n) return;
        const interval = setInterval(() => {
            setSecondsLeft((prev) => {
                if (prev === null || prev <= 1n) return 0n;
                return prev - 1n;
            });
        }, 1000);
        return () => clearInterval(interval);
    }, [goalMet, isWithdrawn, secondsLeft]);

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
            console.error('GroupSavings transaction error:', error);
            const msg = error?.reason || error?.message || 'Transaction failed';
            setTxStatus({ status: 'error', message: msg });
        } finally {
            setTimeout(() => setTxStatus({ status: 'idle', message: '' }), 6000);
        }
    };

    const handleContribute = async () => {
        if (!contributeAmount) {
            setTxStatus({ status: 'error', message: 'Please enter a contribution amount' });
            setTimeout(() => setTxStatus({ status: 'idle', message: '' }), 3000);
            return;
        }

        const value = parseFloat(contributeAmount);
        if (Number.isNaN(value) || value <= 0) {
            setTxStatus({ status: 'error', message: 'Amount must be a positive number' });
            setTimeout(() => setTxStatus({ status: 'idle', message: '' }), 3000);
            return;
        }

        if (secondsLeft !== null && secondsLeft <= 0n) {
            setTxStatus({ status: 'error', message: 'Deadline has passed. Cannot contribute.' });
            setTimeout(() => setTxStatus({ status: 'idle', message: '' }), 4000);
            return;
        }

        if (isWithdrawn) {
            setTxStatus({ status: 'error', message: 'Funds already withdrawn.' });
            setTimeout(() => setTxStatus({ status: 'idle', message: '' }), 4000);
            return;
        }

        try {
            const contract = await getWriteContract();
            const weiValue = ethers.parseEther(contributeAmount);
            await handleTx(
                () => contract.contribute({ value: weiValue }),
                `Contributed: ${contributeAmount} BNB`
            );
            setContributeAmount('');
        } catch (error: any) {
            console.error('Contribute error:', error);
            let errorMsg = 'Failed to contribute';

            if (error?.message?.includes('Deadline has passed')) {
                errorMsg = 'Deadline has passed. Cannot contribute.';
            } else if (error?.message?.includes('Funds already withdrawn')) {
                errorMsg = 'Funds have already been withdrawn.';
            } else if (error?.message?.includes('Must send ETH')) {
                errorMsg = 'Must send BNB (amount > 0).';
            } else if (error?.reason) {
                errorMsg = error.reason;
            } else if (error?.message) {
                errorMsg = error.message;
            }

            setTxStatus({ status: 'error', message: errorMsg });
            setTimeout(() => setTxStatus({ status: 'idle', message: '' }), 6000);
        }
    };

    const handleRefund = async () => {
        try {
            const contract = await getWriteContract();
            await handleTx(() => contract.refund(), 'Refund claimed successfully');
        } catch (error: any) {
            setTxStatus({ status: 'error', message: error?.message || 'Failed to claim refund' });
        }
    };

    const handleWithdrawFunds = async () => {
        try {
            const contract = await getWriteContract();
            await handleTx(() => contract.withdrawFunds(), 'Funds withdrawn by owner');
        } catch (error: any) {
            setTxStatus({ status: 'error', message: error?.message || 'Failed to withdraw funds' });
        }
    };

    const handleCheckContribution = async () => {
        const contract = getReadContract();
        if (!contract) return;

        const target = (checkAddress || userAddress)?.toString();
        if (!target) {
            setCheckError('Enter an address or connect your wallet');
            setCheckResult(null);
            return;
        }

        try {
            setCheckError(null);
            const result = await contract.contributions(target);
            setCheckResult(result as bigint);
        } catch (error: any) {
            console.error('Error checking contribution:', error);
            setCheckError(error?.reason || error?.message || 'Unable to check contribution');
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

    const deadlinePassed = secondsLeft !== null && secondsLeft <= 0n;
    const canRefund = deadlinePassed && !goalMet && !isWithdrawn;
    const canWithdraw = goalMet === true && !isWithdrawn;

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="p-3 rounded-lg border border-emerald-500/30 bg-gradient-to-r from-emerald-500/10 to-transparent">
                <div className="flex items-center justify-between gap-2 mb-1">
                    <div className="flex items-center gap-2">
                        <PiggyBank className="w-4 h-4 text-emerald-400" />
                        <div>
                            <h3 className="text-sm font-medium text-white">BNB Group Savings</h3>
                            <p className="text-[10px] text-forge-muted">
                                Shared savings pot on {networkConfig.name}.
                            </p>
                        </div>
                    </div>
                </div>
                <a
                    href={explorerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[10px] font-mono text-emerald-400 hover:underline"
                >
                    {contractAddress.slice(0, 6)}...{contractAddress.slice(-4)}
                    <ExternalLink className="w-2.5 h-2.5" />
                </a>
            </div>

            {/* Network Selector */}
            <div className="space-y-1.5">
                <label className="text-xs text-forge-muted flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5" /> Network
                </label>
                <div className="relative">
                    <button
                        type="button"
                        onClick={() => setShowNetworkDropdown(!showNetworkDropdown)}
                        className={cn(
                            'w-full flex items-center justify-between px-3 py-2 rounded-lg border text-sm',
                            'bg-forge-bg border-forge-border',
                            'text-white hover:border-emerald-500/50 transition-colors'
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
                                <span className="text-[8px] px-1.5 py-0.5 bg-emerald-500/20 text-emerald-400 rounded">Testnet</span>
                            )}
                        </div>
                        <ChevronDown className={cn(
                            'w-4 h-4 text-forge-muted transition-transform',
                            showNetworkDropdown && 'rotate-180'
                        )} />
                    </button>

                    {showNetworkDropdown && (
                        <div className="absolute top-full mt-1 w-full bg-forge-bg border border-forge-border rounded-lg shadow-xl z-50 overflow-hidden">
                            {Object.entries(BNB_NETWORKS).map(([key, network]) => (
                                <button
                                    key={key}
                                    type="button"
                                    disabled={network.disabled}
                                    onClick={() => {
                                        if (!network.disabled) {
                                            setSelectedNetwork(key as BnbNetworkKey);
                                            setShowNetworkDropdown(false);
                                            onNetworkChange?.(
                                                network.contractAddress ?? '',
                                                network.label,
                                            );
                                        }
                                    }}
                                    className={cn(
                                        'w-full px-3 py-2.5 text-left text-sm transition-colors',
                                        'flex items-center justify-between',
                                        network.disabled
                                            ? 'opacity-50 cursor-not-allowed bg-forge-bg/80 backdrop-blur-sm'
                                            : 'hover:bg-emerald-500/10 cursor-pointer',
                                        selectedNetwork === key && 'bg-emerald-500/20'
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
                                                    <span className="text-[8px] px-1.5 py-0.5 bg-emerald-500/20 text-emerald-400 rounded">Testnet</span>
                                                )}
                                            </div>
                                            <p className="text-[10px] text-forge-muted mt-0.5">
                                                {network.description}
                                            </p>
                                        </div>
                                    </div>
                                    {network.disabled && (
                                        <span className="text-[9px] px-1.5 py-0.5 bg-gray-500/30 text-gray-400 rounded shrink-0">Coming soon</span>
                                    )}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Wallet Status */}
            <div className={cn(
                'p-2.5 rounded-lg border',
                walletConnected ? 'border-green-500/30 bg-green-500/5' : 'border-emerald-500/30 bg-emerald-500/5'
            )}>
                <div className="flex items-center gap-2">
                    <Users className={cn('w-3.5 h-3.5', walletConnected ? 'text-green-400' : 'text-emerald-400')} />
                    {walletConnected ? (
                        <span className="text-[10px] text-green-300">
                            Connected: <code className="text-green-400">{userAddress?.slice(0, 6)}...{userAddress?.slice(-4)}</code>
                        </span>
                    ) : (
                        <span className="text-[10px] text-emerald-300">Connect wallet via Wallet Auth node for write ops</span>
                    )}
                </div>
            </div>

            {/* Refresh button */}
            <button
                onClick={fetchState}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-medium transition-colors"
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
                        txStatus.status === 'success' && 'bg-emerald-500/10 border-emerald-500/30',
                        txStatus.status === 'error' && 'bg-red-500/10 border-red-500/30'
                    )}
                >
                    {txStatus.status === 'pending' && (
                        <Loader2 className="w-3.5 h-3.5 text-blue-400 animate-spin shrink-0" />
                    )}
                    {txStatus.status === 'success' && (
                        <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    )}
                    {txStatus.status === 'error' && (
                        <AlertCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                        <p
                            className={cn(
                                'text-[10px] font-medium truncate',
                                txStatus.status === 'pending' && 'text-blue-300',
                                txStatus.status === 'success' && 'text-emerald-300',
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

            {/* Savings Status */}
            <div className="space-y-3">
                <div className="flex items-center gap-2">
                    <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-xs font-medium text-white">Savings Status</span>
                </div>
                {contractError && (
                    <div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/30 flex items-start gap-2">
                        <AlertCircle className="w-3.5 h-3.5 text-red-400" />
                        <p className="text-[10px] text-red-200">{contractError}</p>
                    </div>
                )}

                {/* Description */}
                <div className="p-2.5 rounded-lg bg-forge-bg/50 border border-forge-border/30">
                    <p className="text-[10px] text-forge-muted">Description</p>
                    <p className="text-sm font-semibold text-white">
                        {desc ?? '—'}
                    </p>
                </div>

                {/* Progress Bar */}
                {goalAmount !== null && totalRaised !== null && (
                    <div className="p-2.5 rounded-lg bg-forge-bg/50 border border-forge-border/30 space-y-1.5">
                        <div className="flex items-center justify-between">
                            <p className="text-[10px] text-forge-muted">Progress</p>
                            <p className="text-[10px] font-medium text-emerald-400">
                                {progressPct !== null ? `${Number(progressPct)}%` : '—'}
                            </p>
                        </div>
                        <div className="w-full h-2 rounded-full bg-forge-border/30 overflow-hidden">
                            <div
                                className={cn(
                                    'h-full rounded-full transition-all duration-500',
                                    goalMet ? 'bg-emerald-400' : 'bg-emerald-600'
                                )}
                                style={{ width: `${Math.min(Number(progressPct ?? 0n), 100)}%` }}
                            />
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    <div className="p-2.5 rounded-lg bg-forge-bg/50 border border-forge-border/30">
                        <div className="flex items-center gap-1">
                            <Target className="w-3 h-3 text-emerald-400" />
                            <p className="text-[10px] text-forge-muted">Goal</p>
                        </div>
                        <p className="text-sm font-semibold text-white">
                            {goalAmount !== null
                                ? `${ethers.formatEther(goalAmount)} BNB`
                                : '—'}
                        </p>
                    </div>
                    <div className="p-2.5 rounded-lg bg-forge-bg/50 border border-forge-border/30">
                        <p className="text-[10px] text-forge-muted">Raised</p>
                        <p className="text-sm font-semibold text-white">
                            {totalRaised !== null
                                ? `${ethers.formatEther(totalRaised)} BNB`
                                : '—'}
                        </p>
                    </div>
                    <div className="p-2.5 rounded-lg bg-forge-bg/50 border border-forge-border/30">
                        <div className="flex items-center gap-1">
                            <Timer className="w-3 h-3 text-emerald-400" />
                            <p className="text-[10px] text-forge-muted">Time Left</p>
                        </div>
                        <p className="text-sm font-semibold text-white">
                            {secondsLeft !== null ? formatTimeLeft(secondsLeft) : '—'}
                        </p>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <div className="p-2.5 rounded-lg bg-forge-bg/50 border border-forge-border/30">
                        <p className="text-[10px] text-forge-muted">Remaining</p>
                        <p className="text-sm font-semibold text-white">
                            {remaining !== null
                                ? `${ethers.formatEther(remaining)} BNB`
                                : '—'}
                        </p>
                    </div>
                    <div className="p-2.5 rounded-lg bg-forge-bg/50 border border-forge-border/30">
                        <p className="text-[10px] text-forge-muted">Owner</p>
                        <p className="text-[11px] font-mono text-white truncate">
                            {owner ?? '—'}
                        </p>
                        <p className="text-[10px] text-forge-muted mt-1">
                            Status:{' '}
                            <span className="font-semibold text-white">
                                {isWithdrawn === null
                                    ? '—'
                                    : isWithdrawn
                                        ? 'Withdrawn'
                                        : goalMet
                                            ? 'Goal Met ✓'
                                            : deadlinePassed
                                                ? 'Expired'
                                                : 'Active'}
                            </span>
                        </p>
                    </div>
                </div>
            </div>

            {/* Contribute */}
            <div className="space-y-2">
                <div className="flex items-center gap-2">
                    <PiggyBank className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-xs font-medium text-white">Contribute</span>
                </div>
                <div className="p-3 rounded-lg bg-forge-bg/50 border border-forge-border/40 space-y-2">
                    {deadlinePassed || isWithdrawn ? (
                        <div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/30 flex items-center gap-2">
                            <AlertCircle className="w-3.5 h-3.5 text-red-400" />
                            <p className="text-[10px] text-red-200">
                                {isWithdrawn
                                    ? 'Funds have been withdrawn. No more contributions.'
                                    : 'Deadline has passed. No more contributions.'}
                            </p>
                        </div>
                    ) : (
                        <>
                            <div className="space-y-1">
                                <input
                                    type="number"
                                    step="0.001"
                                    min={0}
                                    value={contributeAmount}
                                    onChange={(e) => setContributeAmount(e.target.value)}
                                    placeholder="Amount in BNB (e.g. 0.01)"
                                    className="w-full px-2.5 py-1.5 bg-forge-bg border border-forge-border/50 rounded text-xs text-white placeholder-white/40 focus:outline-none"
                                />
                                {remaining !== null && remaining > 0n && (
                                    <p className="text-[9px] text-emerald-400">
                                        Still needed: {ethers.formatEther(remaining)} BNB
                                    </p>
                                )}
                            </div>
                            <button
                                onClick={handleContribute}
                                disabled={!walletConnected || txStatus.status === 'pending'}
                                className="w-full py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[10px] font-medium disabled:opacity-50"
                            >
                                Contribute
                            </button>
                            <p className="text-[10px] text-forge-muted">
                                Send BNB to help reach the group savings goal.
                            </p>
                        </>
                    )}
                </div>
            </div>

            {/* Refund */}
            <div className="space-y-2">
                <div className="flex items-center gap-2">
                    <ArrowDownToLine className="w-3.5 h-3.5 text-orange-400" />
                    <span className="text-xs font-medium text-white">Claim Refund</span>
                </div>
                <button
                    onClick={handleRefund}
                    disabled={!walletConnected || txStatus.status === 'pending' || !canRefund}
                    className="w-full py-1.5 bg-orange-600 hover:bg-orange-500 text-white rounded text-[10px] font-medium disabled:opacity-50"
                >
                    Claim Refund
                </button>
                <p className="text-[10px] text-forge-muted">
                    Refunds are available if the deadline passes without reaching the goal.
                </p>
            </div>

            {/* Owner: Withdraw Funds */}
            <div className="space-y-2">
                <div className="flex items-center gap-2">
                    <PiggyBank className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-xs font-medium text-white">Owner Controls</span>
                </div>
                <button
                    onClick={handleWithdrawFunds}
                    disabled={!walletConnected || txStatus.status === 'pending' || !canWithdraw}
                    className="w-full py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[10px] font-medium disabled:opacity-50"
                >
                    Withdraw Funds
                </button>
                <p className="text-[10px] text-forge-muted">
                    Owner-only. Withdraw all funds once the goal is reached. If you are not the owner, the transaction will revert.
                </p>
            </div>

            {/* Check Contribution */}
            <div className="space-y-2">
                <p className="text-[10px] font-medium text-white">
                    Check contribution for an address
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
                            onClick={handleCheckContribution}
                            className="px-2.5 py-1.5 text-[10px] rounded-lg bg-emerald-600 text-white font-medium hover:bg-emerald-500"
                        >
                            Check
                        </button>
                        {checkResult !== null && !checkError && (
                            <span className="text-[10px] text-forge-muted">
                                Contribution:{' '}
                                <span className="font-semibold text-white">
                                    {ethers.formatEther(checkResult)} BNB
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