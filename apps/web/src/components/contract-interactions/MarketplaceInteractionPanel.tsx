/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { ethers } from 'ethers';
import {
    ShoppingBag,
    Users,
    RefreshCw,
    Loader2,
    AlertCircle,
    Check,
    ExternalLink,
    TrendingUp,
    ArrowDownToLine,
    ListPlus,
    ArrowRightLeft,
    ChevronDown,
} from 'lucide-react';
import { useAccount } from 'wagmi';
import { cn } from '@/lib/utils';
import BnbChainLogo from '@/assets/blocks/BNB Chain.png';

const BNB_NETWORKS = {
    testnet: {
        id: 'testnet' as const,
        name: 'BNB Smart Chain Testnet',
        chainId: 97,
        rpcUrl: 'https://data-seed-prebsc-1-s1.bnbchain.org:8545',
        explorerUrl: 'https://testnet.bscscan.com',
        label: 'BNB Testnet',
        description: 'Deployed SimpleMarketplace.sol contract on BNB Testnet',
        disabled: false,
        symbol: 'tBNB',
    },
    mainnet: {
        id: 'mainnet' as const,
        name: 'BSC Mainnet',
        chainId: 56,
        rpcUrl: 'https://bsc-dataseed.bnbchain.org',
        explorerUrl: 'https://bscscan.com',
        label: 'BNB Mainnet',
        description: 'No marketplace contract deployed yet (coming soon)',
        disabled: true,
        symbol: 'BNB',
    },
    opbnbTestnet: {
        id: 'opbnbTestnet' as const,
        name: 'opBNB Testnet',
        chainId: 5611,
        rpcUrl: 'https://opbnb-testnet-rpc.bnbchain.org',
        explorerUrl: 'https://testnet.opbnbscan.com',
        label: 'opBNB Testnet',
        description: 'opBNB L2 Testnet (coming soon)',
        disabled: true,
        symbol: 'tBNB',
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
    },
} as const;

type BnbNetworkKey = keyof typeof BNB_NETWORKS;

const MARKETPLACE_ABI = [
    {
        inputs: [
            { internalType: 'string', name: 'name', type: 'string' },
            { internalType: 'string', name: 'description', type: 'string' },
            { internalType: 'uint256', name: 'price', type: 'uint256' },
        ],
        name: 'listItem',
        outputs: [{ internalType: 'uint256', name: 'itemId', type: 'uint256' }],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [{ internalType: 'uint256', name: 'itemId', type: 'uint256' }],
        name: 'cancelItem',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [{ internalType: 'uint256', name: 'itemId', type: 'uint256' }],
        name: 'purchaseItem',
        outputs: [],
        stateMutability: 'payable',
        type: 'function',
    },
    {
        inputs: [{ internalType: 'uint256', name: 'itemId', type: 'uint256' }],
        name: 'confirmDelivery',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [{ internalType: 'uint256', name: 'itemId', type: 'uint256' }],
        name: 'raiseDispute',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [{ internalType: 'uint256', name: 'itemId', type: 'uint256' }],
        name: 'refundBuyer',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [{ internalType: 'uint256', name: 'itemId', type: 'uint256' }],
        name: 'releaseFundsToSeller',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [],
        name: 'getAvailableItems',
        outputs: [
            {
                components: [
                    { internalType: 'uint256', name: 'itemId', type: 'uint256' },
                    { internalType: 'address', name: 'seller', type: 'address' },
                    { internalType: 'address', name: 'buyer', type: 'address' },
                    { internalType: 'string', name: 'name', type: 'string' },
                    { internalType: 'string', name: 'description', type: 'string' },
                    { internalType: 'uint256', name: 'price', type: 'uint256' },
                    { internalType: 'uint8', name: 'status', type: 'uint8' },
                    { internalType: 'uint256', name: 'listedAt', type: 'uint256' },
                    { internalType: 'uint256', name: 'purchasedAt', type: 'uint256' },
                    { internalType: 'uint256', name: 'completedAt', type: 'uint256' },
                ],
                internalType: 'struct SimpleMarketplace.Item[]',
                name: '',
                type: 'tuple[]',
            },
        ],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [],
        name: 'getMarketplaceStats',
        outputs: [
            { internalType: 'uint256', name: 'totalItems', type: 'uint256' },
            { internalType: 'uint256', name: 'availableItems', type: 'uint256' },
            { internalType: 'uint256', name: 'soldItems', type: 'uint256' },
            { internalType: 'uint256', name: 'completedItems', type: 'uint256' },
            { internalType: 'uint256', name: 'disputedItems', type: 'uint256' },
            { internalType: 'uint256', name: 'cancelledItems', type: 'uint256' },
        ],
        stateMutability: 'view',
        type: 'function',
    },
] as const;

export interface MarketplaceInteractionPanelProps {
    contractAddress?: string;
}

interface TxStatus {
    status: 'idle' | 'pending' | 'success' | 'error';
    message: string;
    hash?: string;
}

interface MarketplaceItem {
    itemId: bigint;
    seller: string;
    buyer: string;
    name: string;
    description: string;
    price: bigint;
    status: number;
    listedAt: bigint;
    purchasedAt: bigint;
    completedAt: bigint;
}

export function MarketplaceInteractionPanel({
    contractAddress: initialAddress,
}: MarketplaceInteractionPanelProps) {
    const defaultAddress = initialAddress ?? '0x1E15115269D39e6F7D89a73331D7A0aC99a9Fb61';
    const [contractAddress] = useState(defaultAddress);
    const [selectedNetwork, setSelectedNetwork] = useState<BnbNetworkKey>('testnet');
    const [showNetworkDropdown, setShowNetworkDropdown] = useState(false);
    const networkConfig = BNB_NETWORKS[selectedNetwork];

    const { address: userAddress, isConnected: walletConnected, chain } = useAccount();

    const [items, setItems] = useState<MarketplaceItem[]>([]);
    const [stats, setStats] = useState<{
        totalItems: bigint;
        availableItems: bigint;
        soldItems: bigint;
        completedItems: bigint;
        disputedItems: bigint;
        cancelledItems: bigint;
    } | null>(null);

    const [newItemName, setNewItemName] = useState('');
    const [newItemDescription, setNewItemDescription] = useState('');
    const [newItemPrice, setNewItemPrice] = useState('');

    const [purchaseItemId, setPurchaseItemId] = useState('');
    const [confirmItemId, setConfirmItemId] = useState('');
    const [disputeItemId, setDisputeItemId] = useState('');

    const [txStatus, setTxStatus] = useState<TxStatus>({ status: 'idle', message: '' });
    const [contractError, setContractError] = useState<string | null>(null);

    const explorerUrl = `${networkConfig.explorerUrl}/address/${contractAddress}`;

    const getReadContract = useCallback(() => {
        if (!contractAddress) return null;
        const provider = new ethers.JsonRpcProvider(networkConfig.rpcUrl);
        return new ethers.Contract(contractAddress, MARKETPLACE_ABI, provider);
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
                                        name: 'BNB',
                                        symbol: 'BNB',
                                        decimals: 18,
                                    },
                                    rpcUrls: [networkConfig.rpcUrl],
                                    blockExplorerUrls: [networkConfig.explorerUrl],
                                },
                            ],
                        });
                    } catch (addError: any) {
                        throw new Error(`Failed to add BNB chain to wallet: ${addError.message}`);
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
        return new ethers.Contract(contractAddress, MARKETPLACE_ABI, signer);
    }, [chain?.id, contractAddress, walletConnected, networkConfig]);

    const fetchItems = useCallback(async () => {
        try {
            setContractError(null);
            const contract = getReadContract();
            if (!contract) return;
            const result = (await contract.getAvailableItems()) as any[];
            const mapped = result.map((item) => ({
                itemId: item.itemId as bigint,
                seller: item.seller as string,
                buyer: item.buyer as string,
                name: item.name as string,
                description: item.description as string,
                price: item.price as bigint,
                status: Number(item.status),
                listedAt: item.listedAt as bigint,
                purchasedAt: item.purchasedAt as bigint,
                completedAt: item.completedAt as bigint,
            }));
            setItems(mapped);
        } catch (error: any) {
            console.error('Error fetching items:', error);
            setContractError(error.message || 'Failed to fetch marketplace items');
        }
    }, [getReadContract]);

    const fetchStats = useCallback(async () => {
        try {
            setContractError(null);
            const contract = getReadContract();
            if (!contract) return;
            const result = await contract.getMarketplaceStats();
            setStats({
                totalItems: result.totalItems as bigint,
                availableItems: result.availableItems as bigint,
                soldItems: result.soldItems as bigint,
                completedItems: result.completedItems as bigint,
                disputedItems: result.disputedItems as bigint,
                cancelledItems: result.cancelledItems as bigint,
            });
        } catch (error: any) {
            console.error('Error fetching stats:', error);
            setContractError(error.message || 'Failed to fetch marketplace stats');
        }
    }, [getReadContract]);

    useEffect(() => {
        fetchItems();
        fetchStats();
    }, [fetchItems, fetchStats]);

    const resetTxStatus = () => setTxStatus({ status: 'idle', message: '' });

    const handleListItem = async () => {
        if (!newItemName || !newItemPrice) {
            setTxStatus({ status: 'error', message: 'Name and price are required' });
            return;
        }
        try {
            setTxStatus({ status: 'pending', message: 'Listing item...' });
            setContractError(null);
            const contract = await getWriteContract();
            const tx = await contract.listItem(
                newItemName,
                newItemDescription || '',
                ethers.parseEther(newItemPrice),
            );
            const receipt = await tx.wait();
            setTxStatus({
                status: 'success',
                message: 'Item listed successfully',
                hash: receipt?.hash,
            });
            setNewItemName('');
            setNewItemDescription('');
            setNewItemPrice('');
            await Promise.all([fetchItems(), fetchStats()]);
        } catch (error: any) {
            console.error('Error listing item:', error);
            setTxStatus({
                status: 'error',
                message: error.message || 'Failed to list item',
            });
        }
    };

    const handlePurchaseItem = async () => {
        if (!purchaseItemId) {
            setTxStatus({ status: 'error', message: 'Item ID is required' });
            return;
        }
        const item = items.find((i) => i.itemId === BigInt(purchaseItemId));
        if (!item) {
            setTxStatus({ status: 'error', message: 'Item not found' });
            return;
        }
        try {
            setTxStatus({ status: 'pending', message: 'Processing purchase...' });
            setContractError(null);
            const contract = await getWriteContract();
            const tx = await contract.purchaseItem(item.itemId, {
                value: item.price,
            });
            const receipt = await tx.wait();
            setTxStatus({
                status: 'success',
                message: 'Purchase successful',
                hash: receipt?.hash,
            });
            setPurchaseItemId('');
            await Promise.all([fetchItems(), fetchStats()]);
        } catch (error: any) {
            console.error('Error purchasing item:', error);
            setTxStatus({
                status: 'error',
                message: error.message || 'Failed to purchase item',
            });
        }
    };

    const handleConfirmDelivery = async () => {
        if (!confirmItemId) {
            setTxStatus({ status: 'error', message: 'Item ID is required' });
            return;
        }
        try {
            setTxStatus({ status: 'pending', message: 'Confirming delivery...' });
            setContractError(null);
            const contract = await getWriteContract();
            const tx = await contract.confirmDelivery(BigInt(confirmItemId));
            const receipt = await tx.wait();
            setTxStatus({
                status: 'success',
                message: 'Delivery confirmed',
                hash: receipt?.hash,
            });
            setConfirmItemId('');
            await Promise.all([fetchItems(), fetchStats()]);
        } catch (error: any) {
            console.error('Error confirming delivery:', error);
            setTxStatus({
                status: 'error',
                message: error.message || 'Failed to confirm delivery',
            });
        }
    };

    const handleRaiseDispute = async () => {
        if (!disputeItemId) {
            setTxStatus({ status: 'error', message: 'Item ID is required' });
            return;
        }
        try {
            setTxStatus({ status: 'pending', message: 'Raising dispute...' });
            setContractError(null);
            const contract = await getWriteContract();
            const tx = await contract.raiseDispute(BigInt(disputeItemId));
            const receipt = await tx.wait();
            setTxStatus({
                status: 'success',
                message: 'Dispute raised',
                hash: receipt?.hash,
            });
            setDisputeItemId('');
            await Promise.all([fetchItems(), fetchStats()]);
        } catch (error: any) {
            console.error('Error raising dispute:', error);
            setTxStatus({
                status: 'error',
                message: error.message || 'Failed to raise dispute',
            });
        }
    };

    const formatPrice = (value: bigint) => {
        try {
            return `${ethers.formatEther(value)} BNB`;
        } catch {
            return `${value.toString()} wei`;
        }
    };

    const formatDate = (value: bigint) => {
        if (value === 0n) return '—';
        const date = new Date(Number(value) * 1000);
        return date.toLocaleString();
    };

    const statusBadge = (status: number) => {
        const baseClass = 'inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium';
        switch (status) {
            case 0:
                return <span className={cn(baseClass, 'bg-emerald-500/10 text-emerald-400')}>Available</span>;
            case 1:
                return <span className={cn(baseClass, 'bg-amber-500/10 text-amber-400')}>In Escrow</span>;
            case 2:
                return <span className={cn(baseClass, 'bg-blue-500/10 text-blue-400')}>Completed</span>;
            case 3:
                return <span className={cn(baseClass, 'bg-red-500/10 text-red-400')}>Disputed</span>;
            case 4:
                return <span className={cn(baseClass, 'bg-zinc-500/10 text-zinc-300')}>Cancelled</span>;
            default:
                return <span className={cn(baseClass, 'bg-zinc-500/10 text-zinc-300')}>Unknown</span>;
        }
    };

    const canInteract = walletConnected && !!userAddress;

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="p-3 rounded-lg border border-emerald-500/30 bg-gradient-to-r from-emerald-500/10 to-transparent">
                <div className="flex items-center justify-between gap-2 mb-1">
                    <div className="flex items-center gap-2">
                        <ShoppingBag className="w-4 h-4 text-emerald-400" />
                        <div>
                            <h3 className="text-sm font-medium text-white">BNB Marketplace Contract</h3>
                            <p className="text-[10px] text-forge-muted">
                                Escrow-based marketplace on BNB Smart Chain.
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
                onClick={() => { fetchItems(); fetchStats(); }}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-medium transition-colors"
            >
                <RefreshCw className="w-3.5 h-3.5" />
                Refresh marketplace state
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

            {/* List new item */}
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-950/40 p-4">
                        <div className="flex items-center justify-between gap-2 mb-3">
                            <div className="flex items-center gap-2">
                                <div className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-emerald-500/10 text-emerald-400">
                                    <ListPlus className="w-4 h-4" />
                                </div>
                                <div>
                                    <h4 className="text-xs font-semibold text-emerald-50">List new item</h4>
                                    <p className="text-[10px] text-emerald-100/70">
                                        Create a new escrow listing with price in BNB
                                    </p>
                                </div>
                            </div>
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[9px] font-medium text-emerald-300 border border-emerald-500/30">
                                <ArrowRightLeft className="w-3 h-3" />
                                Escrow
                            </span>
                        </div>

                        <div className="grid gap-2.5">
                            <div className="grid gap-2 md:grid-cols-2">
                                <div>
                                    <label className="mb-1 block text-[10px] font-medium text-emerald-100/80">
                                        Item name
                                    </label>
                                    <input
                                        type="text"
                                        value={newItemName}
                                        onChange={(e) => setNewItemName(e.target.value)}
                                        placeholder="e.g. Design audit, NFT, access pass"
                                        className="w-full rounded-lg border border-emerald-500/30 bg-black/20 px-3 py-2 text-xs text-emerald-50 placeholder:text-emerald-200/40 focus:outline-none focus:ring-1 focus:ring-emerald-400/70"
                                    />
                                </div>
                                <div>
                                    <label className="mb-1 block text-[10px] font-medium text-emerald-100/80">
                                        Price (BNB)
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.0001"
                                        value={newItemPrice}
                                        onChange={(e) => setNewItemPrice(e.target.value)}
                                        placeholder="0.1"
                                        className="w-full rounded-lg border border-emerald-500/30 bg-black/20 px-3 py-2 text-xs text-emerald-50 placeholder:text-emerald-200/40 focus:outline-none focus:ring-1 focus:ring-emerald-400/70"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="mb-1 block text-[10px] font-medium text-emerald-100/80">
                                    Description (optional)
                                </label>
                                <textarea
                                    value={newItemDescription}
                                    onChange={(e) => setNewItemDescription(e.target.value)}
                                    placeholder="What is included in this listing? Terms, delivery, format..."
                                    rows={2}
                                    className="w-full rounded-lg border border-emerald-500/30 bg-black/20 px-3 py-2 text-xs text-emerald-50 placeholder:text-emerald-200/40 focus:outline-none focus:ring-1 focus:ring-emerald-400/70 resize-none"
                                />
                            </div>
                            <button
                                type="button"
                                onClick={handleListItem}
                                disabled={!canInteract || txStatus.status === 'pending'}
                                className={cn(
                                    'inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-medium',
                                    'bg-emerald-500 text-emerald-950 hover:bg-emerald-400',
                                    'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-emerald-500',
                                    'transition-colors',
                                )}
                            >
                                {txStatus.status === 'pending' ? (
                                    <>
                                        <Loader2 className="w-3 h-3 animate-spin" />
                                        Processing...
                                    </>
                                ) : (
                                    <>
                                        <ShoppingBag className="w-3.5 h-3.5" />
                                        List item
                                    </>
                                )}
                            </button>
                            {!canInteract && (
                                <p className="text-[10px] text-emerald-100/70">
                                    Connect your wallet to list items.
                                </p>
                            )}
                        </div>
            </div>

            {/* Manage purchases */}
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-950/40 p-4 space-y-3">
                        <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                                <div className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-emerald-500/10 text-emerald-400">
                                    <ArrowDownToLine className="w-4 h-4" />
                                </div>
                                <div>
                                    <h4 className="text-xs font-semibold text-emerald-50">Manage purchases</h4>
                                    <p className="text-[10px] text-emerald-100/70">
                                        Purchase, confirm delivery, or raise disputes
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => {
                                    fetchItems();
                                    fetchStats();
                                }}
                                className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1.5 text-[10px] font-medium text-emerald-200 hover:bg-emerald-500/20 transition-colors"
                            >
                                <RefreshCw className="w-3 h-3" />
                                Refresh
                            </button>
                        </div>

                        <div className="grid gap-2 md:grid-cols-3">
                            <div className="space-y-1.5">
                                <label className="mb-1 block text-[10px] font-medium text-emerald-100/80">
                                    Purchase item ID
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    value={purchaseItemId}
                                    onChange={(e) => setPurchaseItemId(e.target.value)}
                                    placeholder="0"
                                    className="w-full rounded-lg border border-emerald-500/30 bg-black/20 px-3 py-2 text-xs text-emerald-50 placeholder:text-emerald-200/40 focus:outline-none focus:ring-1 focus:ring-emerald-400/70"
                                />
                                <button
                                    type="button"
                                    onClick={handlePurchaseItem}
                                    disabled={!canInteract || txStatus.status === 'pending'}
                                    className={cn(
                                        'inline-flex items-center justify-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-medium',
                                        'bg-emerald-500 text-emerald-950 hover:bg-emerald-400',
                                        'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-emerald-500',
                                        'transition-colors w-full',
                                    )}
                                >
                                    Buy
                                </button>
                            </div>

                            <div className="space-y-1.5">
                                <label className="mb-1 block text-[10px] font-medium text-emerald-100/80">
                                    Confirm delivery ID
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    value={confirmItemId}
                                    onChange={(e) => setConfirmItemId(e.target.value)}
                                    placeholder="0"
                                    className="w-full rounded-lg border border-emerald-500/30 bg-black/20 px-3 py-2 text-xs text-emerald-50 placeholder:text-emerald-200/40 focus:outline-none focus:ring-1 focus:ring-emerald-400/70"
                                />
                                <button
                                    type="button"
                                    onClick={handleConfirmDelivery}
                                    disabled={!canInteract || txStatus.status === 'pending'}
                                    className={cn(
                                        'inline-flex items-center justify-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-medium',
                                        'bg-emerald-500 text-emerald-950 hover:bg-emerald-400',
                                        'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-emerald-500',
                                        'transition-colors w-full',
                                    )}
                                >
                                    Confirm
                                </button>
                            </div>

                            <div className="space-y-1.5">
                                <label className="mb-1 block text-[10px] font-medium text-emerald-100/80">
                                    Dispute item ID
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    value={disputeItemId}
                                    onChange={(e) => setDisputeItemId(e.target.value)}
                                    placeholder="0"
                                    className="w-full rounded-lg border border-emerald-500/30 bg-black/20 px-3 py-2 text-xs text-emerald-50 placeholder:text-emerald-200/40 focus:outline-none focus:ring-1 focus:ring-emerald-400/70"
                                />
                                <button
                                    type="button"
                                    onClick={handleRaiseDispute}
                                    disabled={!canInteract || txStatus.status === 'pending'}
                                    className={cn(
                                        'inline-flex items-center justify-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-medium',
                                        'bg-red-500 text-red-950 hover:bg-red-400',
                                        'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-red-500',
                                        'transition-colors w-full',
                                    )}
                                >
                                    Dispute
                                </button>
                            </div>
                        </div>

            </div>

            {/* Marketplace activity */}
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-950/40 p-4 space-y-3">
                        <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                                <div className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-emerald-500/10 text-emerald-400">
                                    <Users className="w-4 h-4" />
                                </div>
                                <div>
                                    <h4 className="text-xs font-semibold text-emerald-50">Marketplace activity</h4>
                                    <p className="text-[10px] text-emerald-100/70">
                                        Live stats from the SimpleMarketplace contract
                                    </p>
                                </div>
                            </div>
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[9px] font-medium text-emerald-300 border border-emerald-500/30">
                                <TrendingUp className="w-3 h-3" />
                                Overview
                            </span>
                        </div>

                        {stats ? (
                            <div className="grid grid-cols-2 gap-2 text-[11px] text-emerald-100">
                                <div className="rounded-lg bg-black/10 p-2 border border-emerald-500/20">
                                    <p className="text-[10px] text-emerald-200/70">Total items</p>
                                    <p className="mt-0.5 text-sm font-semibold">
                                        {stats.totalItems.toString()}
                                    </p>
                                </div>
                                <div className="rounded-lg bg-black/10 p-2 border border-emerald-500/20">
                                    <p className="text-[10px] text-emerald-200/70">Available</p>
                                    <p className="mt-0.5 text-sm font-semibold">
                                        {stats.availableItems.toString()}
                                    </p>
                                </div>
                                <div className="rounded-lg bg-black/10 p-2 border border-emerald-500/20">
                                    <p className="text-[10px] text-emerald-200/70">Sold</p>
                                    <p className="mt-0.5 text-sm font-semibold">
                                        {stats.soldItems.toString()}
                                    </p>
                                </div>
                                <div className="rounded-lg bg-black/10 p-2 border border-emerald-500/20">
                                    <p className="text-[10px] text-emerald-200/70">Completed</p>
                                    <p className="mt-0.5 text-sm font-semibold">
                                        {stats.completedItems.toString()}
                                    </p>
                                </div>
                                <div className="rounded-lg bg-black/10 p-2 border border-emerald-500/20">
                                    <p className="text-[10px] text-emerald-200/70">Disputed</p>
                                    <p className="mt-0.5 text-sm font-semibold">
                                        {stats.disputedItems.toString()}
                                    </p>
                                </div>
                                <div className="rounded-lg bg-black/10 p-2 border border-emerald-500/20">
                                    <p className="text-[10px] text-emerald-200/70">Cancelled</p>
                                    <p className="mt-0.5 text-sm font-semibold">
                                        {stats.cancelledItems.toString()}
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center justify-center py-6 text-[11px] text-emerald-100/70">
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Loading stats...
                            </div>
                        )}
            </div>

            {/* Available listings */}
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-950/40 p-4 space-y-3">
                        <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                                <div className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-emerald-500/10 text-emerald-400">
                                    <ShoppingBag className="w-4 h-4" />
                                </div>
                                <div>
                                    <h4 className="text-xs font-semibold text-emerald-50">Available listings</h4>
                                    <p className="text-[10px] text-emerald-100/70">
                                        Browse items you can purchase from the marketplace
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1.5">
                            {items.length === 0 ? (
                                <div className="flex items-center justify-center py-6 text-[11px] text-emerald-100/70">
                                    <ShoppingBag className="w-4 h-4 mr-2 opacity-60" />
                                    No items listed yet. Create the first marketplace listing.
                                </div>
                            ) : (
                                items.map((item) => (
                                    <div
                                        key={item.itemId.toString()}
                                        className="rounded-lg border border-emerald-500/20 bg-black/10 p-3 space-y-1.5"
                                    >
                                        <div className="flex items-center justify-between gap-2">
                                            <div className="flex items-center gap-2">
                                                <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-emerald-500/10 text-emerald-300 text-[11px] font-semibold">
                                                    #{item.itemId.toString()}
                                                </span>
                                                <div>
                                                    <p className="text-[11px] font-semibold text-emerald-50">
                                                        {item.name || 'Untitled listing'}
                                                    </p>
                                                    <p className="text-[10px] text-emerald-100/70">
                                                        {formatPrice(item.price)}
                                                    </p>
                                                </div>
                                            </div>
                                            {statusBadge(item.status)}
                                        </div>
                                        {item.description && (
                                            <p className="text-[10px] text-emerald-100/80">
                                                {item.description}
                                            </p>
                                        )}
                                        <div className="grid grid-cols-2 gap-2 mt-1.5 text-[9px] text-emerald-200/80">
                                            <div>
                                                <p className="text-emerald-200/60">Seller</p>
                                                <p className="font-mono truncate">
                                                    {item.seller === userAddress
                                                        ? 'You'
                                                        : `${item.seller.slice(0, 6)}...${item.seller.slice(-4)}`}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-emerald-200/60">Buyer</p>
                                                <p className="font-mono truncate">
                                                    {item.buyer === '0x0000000000000000000000000000000000000000'
                                                        ? '—'
                                                        : item.buyer === userAddress
                                                            ? 'You'
                                                            : `${item.buyer.slice(0, 6)}...${item.buyer.slice(-4)}`}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-emerald-200/60">Listed</p>
                                                <p>{formatDate(item.listedAt)}</p>
                                            </div>
                                            <div>
                                                <p className="text-emerald-200/60">Completed</p>
                                                <p>{formatDate(item.completedAt)}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
            </div>
        </div>
    );
}


