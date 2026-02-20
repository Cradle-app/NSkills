'use client';

import { useState, useEffect, useCallback } from 'react';
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
import { cn } from './cn';

import { BNB_MARKETPLACE_NETWORKS, type BnbNetworkKey } from '@root/lib/bnb-network-config';

// Importing the ABI JSON is left to consumers; here we define the subset we use inline.
// This mirrors the structure from Marketplace.json.
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
    const defaultAddress = initialAddress ?? BNB_MARKETPLACE_NETWORKS.testnet.contracts.marketplace;
    const [contractAddress] = useState(defaultAddress || '');
    const [selectedNetwork, setSelectedNetwork] = useState<BnbNetworkKey>('testnet');
    const [showNetworkDropdown, setShowNetworkDropdown] = useState(false);
    const networkConfig = BNB_MARKETPLACE_NETWORKS[selectedNetwork];

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

    const fetchState = useCallback(async () => {
        const contract = getReadContract();
        if (!contract) return;

        setContractError(null);
        try {
            const [rawItems, rawStats] = await Promise.all([
                contract.getAvailableItems(),
                contract.getMarketplaceStats(),
            ]);

            const mappedItems: MarketplaceItem[] = (rawItems as any[]).map((it) => ({
                itemId: it.itemId as bigint,
                seller: it.seller as string,
                buyer: it.buyer as string,
                name: it.name as string,
                description: it.description as string,
                price: it.price as bigint,
                status: Number(it.status),
                listedAt: it.listedAt as bigint,
                purchasedAt: it.purchasedAt as bigint,
                completedAt: it.completedAt as bigint,
            }));

            setItems(mappedItems);
            setStats({
                totalItems: rawStats.totalItems as bigint,
                availableItems: rawStats.availableItems as bigint,
                soldItems: rawStats.soldItems as bigint,
                completedItems: rawStats.completedItems as bigint,
                disputedItems: rawStats.disputedItems as bigint,
                cancelledItems: rawStats.cancelledItems as bigint,
            });
        } catch (error: any) {
            console.error('Error fetching marketplace state:', error);
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
            console.error('Marketplace transaction error:', error);
            const msg = error?.reason || error?.message || 'Transaction failed';
            setTxStatus({ status: 'error', message: msg });
        } finally {
            setTimeout(() => setTxStatus({ status: 'idle', message: '' }), 6000);
        }
    };

    const handleListItem = async () => {
        if (!newItemName || !newItemDescription || !newItemPrice) {
            setTxStatus({ status: 'error', message: 'Please fill all fields' });
            setTimeout(() => setTxStatus({ status: 'idle', message: '' }), 3000);
            return;
        }

        try {
            const contract = await getWriteContract();
            const priceWei = ethers.parseEther(newItemPrice);
            await handleTx(
                () => contract.listItem(newItemName, newItemDescription, priceWei),
                'Item listed successfully',
            );
            setNewItemName('');
            setNewItemDescription('');
            setNewItemPrice('');
        } catch (error: any) {
            setTxStatus({ status: 'error', message: error?.message || 'Failed to list item' });
        }
    };

    const handlePurchase = async () => {
        if (!purchaseItemId) {
            setTxStatus({ status: 'error', message: 'Enter an item ID to purchase' });
            setTimeout(() => setTxStatus({ status: 'idle', message: '' }), 3000);
            return;
        }

        const id = BigInt(purchaseItemId);
        const item = items.find((it) => it.itemId === id);
        if (!item) {
            setTxStatus({ status: 'error', message: 'Item not found in available items' });
            setTimeout(() => setTxStatus({ status: 'idle', message: '' }), 3000);
            return;
        }

        try {
            const contract = await getWriteContract();
            await handleTx(
                () => contract.purchaseItem(id, { value: item.price }),
                'Item purchased successfully',
            );
            setPurchaseItemId('');
        } catch (error: any) {
            setTxStatus({ status: 'error', message: error?.message || 'Failed to purchase item' });
        }
    };

    const handleConfirmDelivery = async () => {
        if (!confirmItemId) {
            setTxStatus({ status: 'error', message: 'Enter an item ID to confirm' });
            setTimeout(() => setTxStatus({ status: 'idle', message: '' }), 3000);
            return;
        }
        const id = BigInt(confirmItemId);
        try {
            const contract = await getWriteContract();
            await handleTx(
                () => contract.confirmDelivery(id),
                'Delivery confirmed, seller paid',
            );
            setConfirmItemId('');
        } catch (error: any) {
            setTxStatus({ status: 'error', message: error?.message || 'Failed to confirm delivery' });
        }
    };

    const handleRaiseDispute = async () => {
        if (!disputeItemId) {
            setTxStatus({ status: 'error', message: 'Enter an item ID to dispute' });
            setTimeout(() => setTxStatus({ status: 'idle', message: '' }), 3000);
            return;
        }
        const id = BigInt(disputeItemId);
        try {
            const contract = await getWriteContract();
            await handleTx(
                () => contract.raiseDispute(id),
                'Dispute raised, awaiting owner resolution',
            );
            setDisputeItemId('');
        } catch (error: any) {
            setTxStatus({ status: 'error', message: error?.message || 'Failed to raise dispute' });
        }
    };

    const formatPrice = (value: bigint) => `${ethers.formatEther(value)} BNB`;

    const statusLabel = (status: number) => {
        switch (status) {
            case 0:
                return 'Available';
            case 1:
                return 'Sold';
            case 2:
                return 'Completed';
            case 3:
                return 'Disputed';
            case 4:
                return 'Cancelled';
            default:
                return 'Unknown';
        }
    };

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
                                Escrow-protected peer-to-peer marketplace on BNB Smart Chain Testnet.
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
            <div
                className={cn(
                    'p-2.5 rounded-lg border',
                    walletConnected ? 'border-green-500/30 bg-green-500/5' : 'border-emerald-500/30 bg-emerald-500/5',
                )}
            >
                <div className="flex items-center gap-2">
                    <Users
                        className={cn(
                            'w-3.5 h-3.5',
                            walletConnected ? 'text-green-400' : 'text-emerald-400',
                        )}
                    />
                    {walletConnected ? (
                        <span className="text-[10px] text-green-300">
                            Connected:{' '}
                            <code className="text-green-400">
                                {userAddress?.slice(0, 6)}...{userAddress?.slice(-4)}
                            </code>
                        </span>
                    ) : (
                        <span className="text-[10px] text-emerald-300">
                            Connect wallet via Wallet Auth node for write ops
                        </span>
                    )}
                </div>
            </div>

            {/* Network Selector (fixed to testnet for now) */}
            <div className="space-y-1.5">
                <label className="text-xs text-forge-muted flex items-center gap-1.5">
                    <span className="text-sm">🌐</span> Network
                </label>
                <div className="relative">
                    <button
                        type="button"
                        disabled
                        className={cn(
                            'w-full flex items-center justify-between px-3 py-2 rounded-lg border text-sm',
                            'bg-forge-bg border-forge-border',
                            'text-white',
                            'opacity-60 cursor-not-allowed',
                        )}
                    >
                        <div className="flex items-center gap-2">
                            <span className="text-sm">🟡</span>
                            <span>{networkConfig.name}</span>
                            <span className="text-[8px] px-1.5 py-0.5 bg-emerald-500/20 text-emerald-300 rounded">
                                Testnet
                            </span>
                        </div>
                    </button>
                    <p className="text-[10px] text-forge-muted mt-1">
                        Contract deployed on BNB Testnet only. Mainnet support coming soon.
                    </p>
                </div>
            </div>

            {/* Refresh */}
            <button
                onClick={fetchState}
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
                        txStatus.status === 'error' && 'bg-red-500/10 border-red-500/30',
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
                                txStatus.status === 'error' && 'text-red-300',
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

            {/* Stats */}
            <div className="space-y-3">
                <div className="flex items-center gap-2">
                    <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-xs font-medium text-white">Marketplace Stats</span>
                </div>
                {contractError && (
                    <div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/30 flex items-start gap-2">
                        <AlertCircle className="w-3.5 h-3.5 text-red-400" />
                        <p className="text-[10px] text-red-200">{contractError}</p>
                    </div>
                )}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {stats && (
                        <>
                            <div className="p-2.5 rounded-lg bg-forge-bg/50 border border-forge-border/30">
                                <p className="text-[10px] text-forge-muted">Total Items</p>
                                <p className="text-sm font-semibold text-white">{stats.totalItems.toString()}</p>
                            </div>
                            <div className="p-2.5 rounded-lg bg-forge-bg/50 border border-forge-border/30">
                                <p className="text-[10px] text-forge-muted">Available</p>
                                <p className="text-sm font-semibold text-white">
                                    {stats.availableItems.toString()}
                                </p>
                            </div>
                            <div className="p-2.5 rounded-lg bg-forge-bg/50 border border-forge-border/30">
                                <p className="text-[10px] text-forge-muted">Completed</p>
                                <p className="text-sm font-semibold text-white">
                                    {stats.completedItems.toString()}
                                </p>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* List Item */}
            <div className="space-y-2">
                <div className="flex items-center gap-2">
                    <ListPlus className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-xs font-medium text-white">List a New Item</span>
                </div>
                <div className="p-3 rounded-lg bg-forge-bg/50 border border-forge-border/40 space-y-2">
                    <input
                        type="text"
                        value={newItemName}
                        onChange={(e) => setNewItemName(e.target.value)}
                        placeholder="Item name"
                        className="w-full px-2.5 py-1.5 bg-forge-bg border border-forge-border/50 rounded text-xs text-white placeholder-white/40 focus:outline-none"
                    />
                    <textarea
                        value={newItemDescription}
                        onChange={(e) => setNewItemDescription(e.target.value)}
                        placeholder="Item description"
                        rows={2}
                        className="w-full px-2.5 py-1.5 bg-forge-bg border border-forge-border/50 rounded text-xs text-white placeholder-white/40 focus:outline-none resize-none"
                    />
                    <input
                        type="number"
                        step="0.001"
                        min={0}
                        value={newItemPrice}
                        onChange={(e) => setNewItemPrice(e.target.value)}
                        placeholder="Price in BNB (e.g. 0.01)"
                        className="w-full px-2.5 py-1.5 bg-forge-bg border border-forge-border/50 rounded text-xs text-white placeholder-white/40 focus:outline-none"
                    />
                    <button
                        onClick={handleListItem}
                        disabled={!walletConnected || txStatus.status === 'pending'}
                        className="w-full py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[10px] font-medium disabled:opacity-50"
                    >
                        List Item
                    </button>
                    <p className="text-[10px] text-forge-muted">
                        Sellers list items with a fixed BNB price. Funds are held in escrow until delivery is
                        confirmed.
                    </p>
                </div>
            </div>

            {/* Purchase / Confirm / Dispute */}
            <div className="space-y-3">
                <div className="flex items-center gap-2">
                    <ArrowRightLeft className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-xs font-medium text-white">Purchase & Resolution</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    <div className="p-3 rounded-lg bg-forge-bg/50 border border-forge-border/40 space-y-2">
                        <p className="text-[10px] text-forge-muted font-semibold">Purchase Item</p>
                        <input
                            type="number"
                            min={0}
                            value={purchaseItemId}
                            onChange={(e) => setPurchaseItemId(e.target.value)}
                            placeholder="Item ID"
                            className="w-full px-2.5 py-1.5 bg-forge-bg border border-forge-border/50 rounded text-xs text-white placeholder-white/40 focus:outline-none"
                        />
                        <button
                            onClick={handlePurchase}
                            disabled={!walletConnected || txStatus.status === 'pending'}
                            className="w-full py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[10px] font-medium disabled:opacity-50"
                        >
                            Purchase
                        </button>
                    </div>
                    <div className="p-3 rounded-lg bg-forge-bg/50 border border-forge-border/40 space-y-2">
                        <p className="text-[10px] text-forge-muted font-semibold">Confirm Delivery</p>
                        <input
                            type="number"
                            min={0}
                            value={confirmItemId}
                            onChange={(e) => setConfirmItemId(e.target.value)}
                            placeholder="Item ID"
                            className="w-full px-2.5 py-1.5 bg-forge-bg border border-forge-border/50 rounded text-xs text-white placeholder-white/40 focus:outline-none"
                        />
                        <button
                            onClick={handleConfirmDelivery}
                            disabled={!walletConnected || txStatus.status === 'pending'}
                            className="w-full py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[10px] font-medium disabled:opacity-50"
                        >
                            Confirm
                        </button>
                    </div>
                    <div className="p-3 rounded-lg bg-forge-bg/50 border border-forge-border/40 space-y-2">
                        <p className="text-[10px] text-forge-muted font-semibold">Raise Dispute</p>
                        <input
                            type="number"
                            min={0}
                            value={disputeItemId}
                            onChange={(e) => setDisputeItemId(e.target.value)}
                            placeholder="Item ID"
                            className="w-full px-2.5 py-1.5 bg-forge-bg border border-forge-border/50 rounded text-xs text-white placeholder-white/40 focus:outline-none"
                        />
                        <button
                            onClick={handleRaiseDispute}
                            disabled={!walletConnected || txStatus.status === 'pending'}
                            className="w-full py-1.5 bg-red-600 hover:bg-red-500 text-white rounded text-[10px] font-medium disabled:opacity-50"
                        >
                            Dispute
                        </button>
                    </div>
                </div>
            </div>

            {/* Available Items */}
            <div className="space-y-2">
                <div className="flex items-center gap-2">
                    <ShoppingBag className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-xs font-medium text-white">Available Items</span>
                </div>
                {items.length === 0 ? (
                    <p className="text-[10px] text-forge-muted">No available items yet.</p>
                ) : (
                    <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                        {items.map((item) => (
                            <div
                                key={item.itemId.toString()}
                                className="p-2.5 rounded-lg bg-forge-bg/60 border border-forge-border/40 space-y-1"
                            >
                                <div className="flex items-center justify-between gap-2">
                                    <span className="text-[11px] font-semibold text-white">
                                        #{item.itemId.toString()} · {item.name}
                                    </span>
                                    <span className="text-[11px] text-emerald-300">
                                        {formatPrice(item.price)}
                                    </span>
                                </div>
                                <p className="text-[10px] text-forge-muted line-clamp-2">
                                    {item.description}
                                </p>
                                <div className="flex items-center justify-between gap-2">
                                    <span className="text-[9px] font-mono text-forge-muted truncate">
                                        Seller: {item.seller}
                                    </span>
                                    <span className="text-[9px] text-forge-muted">
                                        {statusLabel(item.status)}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Owner hint */}
            <div className="p-2.5 rounded-lg bg-forge-bg/60 border border-forge-border/40 flex items-start gap-2">
                <ArrowDownToLine className="w-3.5 h-3.5 text-forge-muted" />
                <p className="text-[10px] text-forge-muted">
                    Owner resolves disputes off-chain by calling <code>refundBuyer</code> or{' '}
                    <code>releaseFundsToSeller</code> from the deployer wallet. Those admin functions can be wired
                    into a separate owner-only dashboard or run directly from a script.
                </p>
            </div>
        </div>
    );
}

