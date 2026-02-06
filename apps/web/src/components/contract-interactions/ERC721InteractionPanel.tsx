'use client';

import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import {
  Sparkles,
  Send,
  Shield,
  Flame,
  RefreshCw,
  Check,
  Wallet,
  Image,
  AlertCircle,
  ExternalLink,
  Loader2,
  User,
  CheckCircle2,
  Globe,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAccount, useWalletClient, usePublicClient, useSwitchChain } from 'wagmi';
import { arbitrum, arbitrumSepolia } from 'viem/chains';
import type { Chain } from 'viem';

// Define custom Superposition chains
const superposition: Chain = {
  id: 55244,
  name: 'Superposition',
  nativeCurrency: {
    decimals: 18,
    name: 'Ether',
    symbol: 'ETH',
  },
  rpcUrls: {
    default: { http: ['https://rpc.superposition.so'] },
  },
  blockExplorers: {
    default: { name: 'Explorer', url: 'https://explorer.superposition.so' },
  },
};

const superpositionTestnet: Chain = {
  id: 98985,
  name: 'Superposition Testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'SPN',
    symbol: 'SPN',
  },
  rpcUrls: {
    default: { http: ['https://testnet-rpc.superposition.so'] },
  },
  blockExplorers: {
    default: { name: 'Explorer', url: 'https://testnet-explorer.superposition.so' },
  },
  testnet: true,
};

// ERC721 ABI for the deployed Stylus NFT contract (IStylusNFT)
const ERC721_ABI = [
  // ERC721 Standard Interface
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function balanceOf(address owner) view returns (uint256)",
  "function ownerOf(uint256 token_id) view returns (address)",
  "function safeTransferFrom(address from, address to, uint256 token_id, bytes data)",
  "function safeTransferFrom(address from, address to, uint256 token_id)",
  "function transferFrom(address from, address to, uint256 token_id)",
  "function approve(address approved, uint256 token_id)",
  "function setApprovalForAll(address operator, bool approved)",
  "function getApproved(uint256 token_id) view returns (address)",
  "function isApprovedForAll(address owner, address operator) view returns (bool)",
  // StylusNFT Specific Functions (from lib.rs)
  "function mint()",
  "function mintTo(address to)",
  "function safeMint(address to)",
  "function burn(uint256 token_id)",
];

// Network-specific default contract addresses (only for networks where contracts are deployed)
const DEFAULT_CONTRACT_ADDRESSES: Record<string, string | undefined> = {
  'arbitrum-sepolia': '0xe2a8cd01354ecc63a8341a849e9b89f14ff9f08f',
  'arbitrum': undefined,
  'superposition': undefined,
  'superposition-testnet': '0xa0cc35ec0ce975c28dacc797edb7808e882043c3',
};

// Network configurations
const NETWORKS = {
  'arbitrum-sepolia': {
    name: 'Arbitrum Sepolia',
    rpcUrl: 'https://sepolia-rollup.arbitrum.io/rpc',
    explorerUrl: 'https://sepolia.arbiscan.io',
    chainId: arbitrumSepolia.id,
    chain: arbitrumSepolia,
  },
  'arbitrum': {
    name: 'Arbitrum One',
    rpcUrl: 'https://arb1.arbitrum.io/rpc',
    explorerUrl: 'https://arbiscan.io',
    chainId: arbitrum.id,
    chain: arbitrum,
  },
  'superposition': {
    name: 'Superposition',
    rpcUrl: 'https://rpc.superposition.so',
    explorerUrl: 'https://explorer.superposition.so',
    chainId: 55244,
    chain: superposition,
  },
  'superposition-testnet': {
    name: 'Superposition Testnet',
    rpcUrl: 'https://testnet-rpc.superposition.so',
    explorerUrl: 'https://testnet-explorer.superposition.so',
    chainId: 98985,
    chain: superpositionTestnet,
  },
};

interface ERC721InteractionPanelProps {
  contractAddress?: string;
  network?: 'arbitrum' | 'arbitrum-sepolia' | 'superposition' | 'superposition-testnet';
}

interface TxStatus {
  status: 'idle' | 'pending' | 'success' | 'error';
  message: string;
  hash?: string;
}

export function ERC721InteractionPanel({
  contractAddress: initialAddress,
  network: initialNetwork = 'arbitrum-sepolia',
}: ERC721InteractionPanelProps) {
  const [selectedNetwork, setSelectedNetwork] = useState<'arbitrum' | 'arbitrum-sepolia' | 'superposition' | 'superposition-testnet'>(initialNetwork);
  const [contractAddress, setContractAddress] = useState(initialAddress || DEFAULT_CONTRACT_ADDRESSES[initialNetwork] || '');
  const [showCustomContract, setShowCustomContract] = useState(false);
  const [customAddress, setCustomAddress] = useState('');
  const [isConnected, setIsConnected] = useState(false);

  const networkConfig = NETWORKS[selectedNetwork];
  const rpcUrl = networkConfig.rpcUrl;
  const explorerUrl = networkConfig.explorerUrl;

  // Wagmi hooks for wallet connection
  const { address: userAddress, isConnected: walletConnected, chain: currentChain } = useAccount();
  const publicClient = usePublicClient({ chainId: networkConfig.chainId });
  const { data: walletClient } = useWalletClient({ chainId: networkConfig.chainId });
  const { switchChainAsync } = useSwitchChain();

  // NFT info
  const [collectionName, setCollectionName] = useState<string | null>(null);
  const [collectionSymbol, setCollectionSymbol] = useState<string | null>(null);
  const [userBalance, setUserBalance] = useState<string | null>(null);

  // Form inputs - Write operations
  const [transferFrom, setTransferFrom] = useState('');
  const [transferTo, setTransferTo] = useState('');
  const [transferTokenId, setTransferTokenId] = useState('');
  const [approveAddress, setApproveAddress] = useState('');
  const [approveTokenId, setApproveTokenId] = useState('');
  const [operatorAddress, setOperatorAddress] = useState('');
  const [operatorApproved, setOperatorApproved] = useState(true);
  const [burnTokenId, setBurnTokenId] = useState('');
  const [mintToAddress, setMintToAddress] = useState('');
  const [safeMintToAddress, setSafeMintToAddress] = useState('');

  // Read operations
  const [ownerOfTokenId, setOwnerOfTokenId] = useState('');
  const [ownerOfResult, setOwnerOfResult] = useState<string | null>(null);
  const [balanceCheckAddress, setBalanceCheckAddress] = useState('');
  const [balanceCheckResult, setBalanceCheckResult] = useState<string | null>(null);
  const [getApprovedTokenId, setGetApprovedTokenId] = useState('');
  const [getApprovedResult, setGetApprovedResult] = useState<string | null>(null);
  const [approvalCheckOwner, setApprovalCheckOwner] = useState('');
  const [approvalCheckOperator, setApprovalCheckOperator] = useState('');
  const [approvalCheckResult, setApprovalCheckResult] = useState<boolean | null>(null);

  const [txStatus, setTxStatus] = useState<TxStatus>({ status: 'idle', message: '' });
  const [customAddressError, setCustomAddressError] = useState<string | null>(null);
  const [isValidatingContract, setIsValidatingContract] = useState(false);
  const [contractError, setContractError] = useState<string | null>(null);

  // Check if using the default contract for the selected network
  const defaultAddress = DEFAULT_CONTRACT_ADDRESSES[selectedNetwork];
  const isUsingDefaultContract = defaultAddress && contractAddress === defaultAddress;
  const hasDefaultContract = !!defaultAddress;
  const displayExplorerUrl = explorerUrl;

  // Update contract address when network changes
  useEffect(() => {
    const newDefault = DEFAULT_CONTRACT_ADDRESSES[selectedNetwork];
    if (newDefault && (isUsingDefaultContract || !initialAddress)) {
      setContractAddress(newDefault);
    } else if (!newDefault && !initialAddress) {
      setContractAddress('');
    }
  }, [selectedNetwork]);

  // Validate if an address is a contract
  const validateContract = async (address: string): Promise<boolean> => {
    try {
      const provider = new ethers.JsonRpcProvider(rpcUrl);
      const code = await provider.getCode(address);
      return code !== '0x' && code.length > 2;
    } catch (error) {
      return false;
    }
  };

  // Update contract address when using custom
  const handleUseCustomContract = async () => {
    if (!customAddress || !ethers.isAddress(customAddress)) {
      setCustomAddressError('Invalid address format');
      return;
    }

    setIsValidatingContract(true);
    setCustomAddressError(null);

    const isContract = await validateContract(customAddress);
    if (!isContract) {
      setCustomAddressError('Address is not a contract');
      setIsValidatingContract(false);
      return;
    }

    setContractAddress(customAddress);
    setIsValidatingContract(false);
  };

  // Reset to default contract for the selected network
  const handleUseDefaultContract = () => {
    const defaultAddr = DEFAULT_CONTRACT_ADDRESSES[selectedNetwork];
    setContractAddress(defaultAddr || '');
    setCustomAddress('');
    setCustomAddressError(null);
    setShowCustomContract(false);
  };

  const getReadContract = useCallback(() => {
    if (!contractAddress || !rpcUrl) return null;
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    return new ethers.Contract(contractAddress, ERC721_ABI, provider);
  }, [contractAddress, rpcUrl, selectedNetwork]);

  const getWriteContract = useCallback(async () => {
    if (!contractAddress) throw new Error('No contract address specified');
    if (!walletConnected) throw new Error('Please connect your wallet first');

    const ethereum = (window as any).ethereum;
    if (!ethereum) throw new Error('No wallet detected. Please install MetaMask.');

    const targetChainIdHex = `0x${networkConfig.chainId.toString(16)}`;

    if (currentChain?.id !== networkConfig.chainId) {
      try {
        await ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: targetChainIdHex }],
        });
      } catch (switchError: any) {
        if (switchError.code === 4902 || switchError.message?.includes('Unrecognized chain') || switchError.message?.includes('wallet_addEthereumChain')) {
          try {
            await ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [{
                chainId: targetChainIdHex,
                chainName: networkConfig.name,
                nativeCurrency: networkConfig.chain.nativeCurrency,
                rpcUrls: [networkConfig.rpcUrl],
                blockExplorerUrls: [networkConfig.explorerUrl],
              }],
            });
          } catch (addError: any) {
            throw new Error(`Failed to add ${networkConfig.name} to wallet: ${addError.message}`);
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
    return new ethers.Contract(contractAddress, ERC721_ABI, signer);
  }, [contractAddress, walletConnected, currentChain?.id, networkConfig]);

  const parseContractError = useCallback((error: any): string => {
    const errorMessage = error?.message || error?.reason || String(error);

    if (errorMessage.includes('BAD_DATA') || errorMessage.includes('could not decode result data')) {
      return `Contract not found or not deployed on ${networkConfig.name}.`;
    }
    if (errorMessage.includes('call revert exception')) {
      return `Contract call failed on ${networkConfig.name}.`;
    }
    if (errorMessage.includes('network') || errorMessage.includes('connection')) {
      return `Network connection error. Please try again.`;
    }
    if (errorMessage.includes('execution reverted')) {
      return `Transaction reverted: ${error?.reason || 'Unknown reason'}`;
    }

    return `Error: ${error?.reason || error?.shortMessage || errorMessage.slice(0, 100)}`;
  }, [networkConfig.name]);

  const fetchNFTInfo = useCallback(async () => {
    const contract = getReadContract();
    if (!contract) return;

    setContractError(null);

    try {
      const [name, symbol] = await Promise.all([
        contract.name().catch(() => null),
        contract.symbol().catch(() => null),
      ]);

      if (name === null && symbol === null) {
        setContractError(`Unable to read contract data on ${networkConfig.name}.`);
        setIsConnected(false);
        return;
      }

      setCollectionName(name);
      setCollectionSymbol(symbol);

      if (userAddress) {
        try {
          const balance = await contract.balanceOf(userAddress);
          setUserBalance(balance.toString());
        } catch (balanceError: any) {
          setContractError(parseContractError(balanceError));
        }
      }
      setIsConnected(true);
    } catch (error: any) {
      setContractError(parseContractError(error));
      setIsConnected(false);
    }
  }, [getReadContract, userAddress, networkConfig.name, parseContractError]);

  useEffect(() => {
    if (contractAddress && rpcUrl) {
      fetchNFTInfo();
    }
  }, [contractAddress, rpcUrl, fetchNFTInfo, userAddress]);

  const handleTransaction = async (
    operation: () => Promise<ethers.TransactionResponse>,
    successMessage: string
  ) => {
    if (txStatus.status === 'pending') return;
    if (!walletConnected) {
      setTxStatus({ status: 'error', message: 'Please connect your wallet first' });
      setTimeout(() => setTxStatus({ status: 'idle', message: '' }), 5000);
      return;
    }

    try {
      setTxStatus({ status: 'pending', message: 'Confirming...' });
      const tx = await operation();
      setTxStatus({ status: 'pending', message: 'Waiting for confirmation...', hash: tx.hash });
      await tx.wait();
      setTxStatus({ status: 'success', message: successMessage, hash: tx.hash });
      fetchNFTInfo();
    } catch (error: any) {
      const errorMsg = error.reason || error.message || error.shortMessage || 'Transaction failed';
      setTxStatus({ status: 'error', message: errorMsg });
    }
    setTimeout(() => setTxStatus({ status: 'idle', message: '' }), 5000);
  };

  const handleMint = async () => {
    try {
      const contract = await getWriteContract();
      if (!contract) return;
      handleTransaction(() => contract.mint(), 'NFT minted to yourself!');
    } catch (error: any) {
      setTxStatus({ status: 'error', message: error.message || 'Failed to prepare transaction' });
      setTimeout(() => setTxStatus({ status: 'idle', message: '' }), 5000);
    }
  };

  const handleMintTo = async () => {
    try {
      const contract = await getWriteContract();
      if (!contract || !mintToAddress) return;
      handleTransaction(() => contract.mintTo(mintToAddress), 'NFT minted successfully!');
    } catch (error: any) {
      setTxStatus({ status: 'error', message: error.message || 'Failed to prepare transaction' });
      setTimeout(() => setTxStatus({ status: 'idle', message: '' }), 5000);
    }
  };

  const handleSafeMint = async () => {
    try {
      const contract = await getWriteContract();
      if (!contract || !safeMintToAddress) return;
      handleTransaction(() => contract['safeMint(address)'](safeMintToAddress), 'NFT safely minted!');
    } catch (error: any) {
      setTxStatus({ status: 'error', message: error.message || 'Failed to prepare transaction' });
      setTimeout(() => setTxStatus({ status: 'idle', message: '' }), 5000);
    }
  };

  const handleTransfer = async () => {
    try {
      const contract = await getWriteContract();
      if (!contract || !transferFrom || !transferTo || !transferTokenId) return;
      handleTransaction(
        () => contract['safeTransferFrom(address,address,uint256)'](transferFrom, transferTo, transferTokenId),
        `NFT #${transferTokenId} transferred!`
      );
    } catch (error: any) {
      setTxStatus({ status: 'error', message: error.message || 'Failed to prepare transaction' });
      setTimeout(() => setTxStatus({ status: 'idle', message: '' }), 5000);
    }
  };

  const handleApprove = async () => {
    try {
      const contract = await getWriteContract();
      if (!contract || !approveAddress || !approveTokenId) return;
      handleTransaction(() => contract.approve(approveAddress, approveTokenId), `Approval set for NFT #${approveTokenId}!`);
    } catch (error: any) {
      setTxStatus({ status: 'error', message: error.message || 'Failed to prepare transaction' });
      setTimeout(() => setTxStatus({ status: 'idle', message: '' }), 5000);
    }
  };

  const handleSetApprovalForAll = async () => {
    try {
      const contract = await getWriteContract();
      if (!contract || !operatorAddress) return;
      handleTransaction(
        () => contract.setApprovalForAll(operatorAddress, operatorApproved),
        `Operator ${operatorApproved ? 'approved' : 'revoked'}!`
      );
    } catch (error: any) {
      setTxStatus({ status: 'error', message: error.message || 'Failed to prepare transaction' });
      setTimeout(() => setTxStatus({ status: 'idle', message: '' }), 5000);
    }
  };

  const handleBurn = async () => {
    try {
      const contract = await getWriteContract();
      if (!contract || !burnTokenId) return;
      handleTransaction(() => contract.burn(burnTokenId), `NFT #${burnTokenId} burned!`);
    } catch (error: any) {
      setTxStatus({ status: 'error', message: error.message || 'Failed to prepare transaction' });
      setTimeout(() => setTxStatus({ status: 'idle', message: '' }), 5000);
    }
  };

  const checkOwnerOf = async () => {
    const contract = getReadContract();
    if (!contract || !ownerOfTokenId) return;
    try {
      const owner = await contract.ownerOf(ownerOfTokenId);
      setOwnerOfResult(owner);
    } catch {
      setOwnerOfResult('Token does not exist');
    }
  };

  const checkBalance = async () => {
    const contract = getReadContract();
    if (!contract || !balanceCheckAddress) return;
    try {
      const balance = await contract.balanceOf(balanceCheckAddress);
      setBalanceCheckResult(balance.toString());
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const checkGetApproved = async () => {
    const contract = getReadContract();
    if (!contract || !getApprovedTokenId) return;
    try {
      const approved = await contract.getApproved(getApprovedTokenId);
      setGetApprovedResult(approved);
    } catch {
      setGetApprovedResult('Token does not exist');
    }
  };

  const checkApprovalForAll = async () => {
    const contract = getReadContract();
    if (!contract || !approvalCheckOwner || !approvalCheckOperator) return;
    try {
      const isApproved = await contract.isApprovedForAll(approvalCheckOwner, approvalCheckOperator);
      setApprovalCheckResult(isApproved);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return (
    <div className="space-y-4 p-3">
      {/* Header */}
      <div className="p-3 rounded-lg border border-[hsl(var(--color-accent-primary)/0.3)] bg-gradient-to-r from-[hsl(var(--color-accent-primary)/0.1)] to-transparent">
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="w-4 h-4 text-[hsl(var(--color-accent-primary))]" />
          <span className="text-sm font-medium text-[hsl(var(--color-text-primary))]">
            {collectionName || 'ERC-721'} {collectionSymbol ? `(${collectionSymbol})` : 'NFT'}
          </span>
        </div>
        <p className="text-[10px] text-[hsl(var(--color-text-muted))]">Stylus NFT Contract Interaction</p>
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
        <div className="grid grid-cols-2 gap-2">
          {(['arbitrum-sepolia', 'arbitrum', 'superposition', 'superposition-testnet'] as const).map((net) => (
            <button
              key={net}
              onClick={() => setSelectedNetwork(net)}
              className={cn(
                'px-3 py-2 rounded-lg text-xs font-medium transition-colors border',
                selectedNetwork === net
                  ? 'bg-[hsl(var(--color-accent-primary))] border-[hsl(var(--color-accent-primary))] text-black'
                  : 'bg-[hsl(var(--color-bg-base))] border-[hsl(var(--color-border-default)/0.5)] text-[hsl(var(--color-text-muted))] hover:text-[hsl(var(--color-text-primary))] hover:border-[hsl(var(--color-accent-primary)/0.5)]'
              )}
            >
              {NETWORKS[net].name}
            </button>
          ))}
        </div>
      </div>

      {/* Contract Info */}
      <div className="p-2.5 rounded-lg bg-[hsl(var(--color-bg-base)/0.5)] border border-[hsl(var(--color-border-default)/0.3)]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-[hsl(var(--color-text-muted))]">Contract:</span>
            {isUsingDefaultContract && (
              <span className="text-[8px] px-1.5 py-0.5 bg-[hsl(var(--color-success)/0.2)] text-[hsl(var(--color-success))] rounded">Default</span>
            )}
          </div>
          <a
            href={`${displayExplorerUrl}/address/${contractAddress}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] font-mono text-[hsl(var(--color-accent-primary))] hover:underline flex items-center gap-1"
          >
            {contractAddress.slice(0, 6)}...{contractAddress.slice(-4)}
            <ExternalLink className="w-2.5 h-2.5" />
          </a>
        </div>
      </div>

      {/* Custom Contract Toggle */}
      <button
        onClick={() => setShowCustomContract(!showCustomContract)}
        className="w-full flex items-center justify-between px-3 py-2 bg-[hsl(var(--color-bg-base)/0.5)] border border-[hsl(var(--color-border-default)/0.3)] rounded-lg text-xs text-[hsl(var(--color-text-muted))] hover:text-[hsl(var(--color-text-primary))] transition-colors"
      >
        <span>Use Custom Contract</span>
        {showCustomContract ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
      </button>

      {showCustomContract && (
        <div className="p-3 rounded-lg bg-[hsl(var(--color-bg-base)/0.3)] border border-[hsl(var(--color-border-default)/0.3)] space-y-2">
          <input
            type="text"
            value={customAddress}
            onChange={(e) => {
              setCustomAddress(e.target.value);
              setCustomAddressError(null);
            }}
            placeholder="0x..."
            className={cn(
              "w-full px-3 py-2 bg-[hsl(var(--color-bg-base))] border rounded-lg text-xs text-[hsl(var(--color-text-primary))] placeholder-[hsl(var(--color-text-muted))] focus:outline-none",
              customAddressError ? "border-[hsl(var(--color-error)/0.5)]" : "border-[hsl(var(--color-border-default)/0.5)] focus:border-[hsl(var(--color-accent-primary)/0.5)]"
            )}
          />
          {customAddressError && (
            <p className="text-[10px] text-[hsl(var(--color-error))] flex items-center gap-1">
              <AlertCircle className="w-3 h-3" /> {customAddressError}
            </p>
          )}
          <div className="flex gap-2">
            <button
              onClick={handleUseCustomContract}
              disabled={!customAddress || isValidatingContract}
              className="flex-1 py-1.5 bg-[hsl(var(--color-accent-primary))] hover:bg-[hsl(var(--color-accent-primary)/0.9)] text-black rounded text-[10px] font-medium disabled:opacity-50 flex items-center justify-center gap-1"
            >
              {isValidatingContract ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin" /> Validating...
                </>
              ) : (
                'Use Custom'
              )}
            </button>
            <button
              onClick={handleUseDefaultContract}
              className="flex-1 py-1.5 bg-[hsl(var(--color-border-default))] hover:bg-[hsl(var(--color-text-muted)/0.2)] text-[hsl(var(--color-text-primary))] rounded text-[10px] font-medium"
            >
              Reset to Default
            </button>
          </div>
        </div>
      )}

      <button
        onClick={fetchNFTInfo}
        className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-[hsl(var(--color-accent-primary))] hover:bg-[hsl(var(--color-accent-primary)/0.9)] text-black rounded-lg text-xs font-medium transition-colors"
      >
        <RefreshCw className="w-3.5 h-3.5" /> Refresh
      </button>

      {/* Transaction Status */}
      {txStatus.status !== 'idle' && (
        <div className={cn(
          'rounded-lg p-2.5 border flex items-start gap-2',
          txStatus.status === 'pending' && 'bg-[hsl(var(--color-info)/0.1)] border-[hsl(var(--color-info)/0.3)]',
          txStatus.status === 'success' && 'bg-[hsl(var(--color-success)/0.1)] border-[hsl(var(--color-success)/0.3)]',
          txStatus.status === 'error' && 'bg-[hsl(var(--color-error)/0.1)] border-[hsl(var(--color-error)/0.3)]'
        )}>
          {txStatus.status === 'pending' && <Loader2 className="w-3.5 h-3.5 text-[hsl(var(--color-info))] animate-spin shrink-0" />}
          {txStatus.status === 'success' && <Check className="w-3.5 h-3.5 text-[hsl(var(--color-success))] shrink-0" />}
          {txStatus.status === 'error' && <AlertCircle className="w-3.5 h-3.5 text-[hsl(var(--color-error))] shrink-0" />}
          <div className="flex-1 min-w-0">
            <p className={cn(
              'text-[10px] font-medium truncate',
              txStatus.status === 'pending' && 'text-[hsl(var(--color-info)/0.8)]',
              txStatus.status === 'success' && 'text-[hsl(var(--color-success)/0.8)]',
              txStatus.status === 'error' && 'text-[hsl(var(--color-error)/0.8)]'
            )}>{txStatus.message}</p>
            {txStatus.hash && (
              <a href={`${explorerUrl}/tx/${txStatus.hash}`} target="_blank" rel="noopener noreferrer"
                className="text-[9px] text-[hsl(var(--color-text-muted))] hover:text-[hsl(var(--color-text-primary))] flex items-center gap-1">
                Explorer <ExternalLink className="w-2.5 h-2.5" />
              </a>
            )}
          </div>
        </div>
      )}

      {/* NFT Stats */}
      {isConnected && walletConnected && (
        <div className="space-y-2">
          <div className="flex items-center justify-between p-2.5 rounded-lg bg-[hsl(var(--color-bg-base)/0.5)] border border-[hsl(var(--color-border-default)/0.3)]">
            <div className="flex items-center gap-1.5">
              <Image className="w-3 h-3 text-[hsl(var(--color-accent-primary))]" />
              <span className="text-[10px] text-[hsl(var(--color-text-muted))]">Your NFTs</span>
            </div>
            <span className="text-xs font-medium text-[hsl(var(--color-text-primary))]">{userBalance || '0'}</span>
          </div>
        </div>
      )}

      {/* Write Operations */}
      {isConnected && walletConnected && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Send className="w-3.5 h-3.5 text-[hsl(var(--color-success))]" />
            <span className="text-xs font-medium text-[hsl(var(--color-text-primary))]">Write Operations</span>
          </div>

          {/* Mint (to self) */}
          <div className="p-3 rounded-lg bg-[hsl(var(--color-bg-base)/0.5)] border border-[hsl(var(--color-border-default)/0.3)] space-y-2">
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-[hsl(var(--color-accent-primary))]" />
              <span className="text-[10px] font-medium text-[hsl(var(--color-accent-primary))]">Mint (to yourself)</span>
            </div>
            <button onClick={handleMint} disabled={txStatus.status === 'pending'}
              className="w-full py-2 bg-[hsl(var(--color-accent-primary))] hover:bg-[hsl(var(--color-accent-primary)/0.9)] text-black rounded-lg text-[10px] font-medium disabled:opacity-50 transition-colors">
              Mint NFT
            </button>
          </div>

          {/* Mint To */}
          <div className="p-3 rounded-lg bg-[hsl(var(--color-bg-base)/0.5)] border border-[hsl(var(--color-border-default)/0.3)] space-y-2">
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-[hsl(var(--color-accent-primary))]" />
              <span className="text-[10px] font-medium text-[hsl(var(--color-accent-primary))]">Mint To Address</span>
            </div>
            <input type="text" value={mintToAddress} onChange={(e) => setMintToAddress(e.target.value)}
              placeholder="To Address (0x...)"
              className="w-full px-3 py-2 bg-[hsl(var(--color-bg-base))] border border-[hsl(var(--color-border-default)/0.5)] rounded-lg text-xs text-[hsl(var(--color-text-primary))] placeholder-[hsl(var(--color-text-muted))] focus:outline-none" />
            <button onClick={handleMintTo} disabled={txStatus.status === 'pending'}
              className="w-full py-2 bg-[hsl(var(--color-accent-primary))] hover:bg-[hsl(var(--color-accent-primary)/0.9)] text-black rounded-lg text-[10px] font-medium disabled:opacity-50 transition-colors">
              Mint To
            </button>
          </div>

          {/* Safe Mint */}
          <div className="p-3 rounded-lg bg-[hsl(var(--color-bg-base)/0.5)] border border-[hsl(var(--color-border-default)/0.3)] space-y-2">
            <div className="flex items-center gap-1.5">
              <Shield className="w-3 h-3 text-[hsl(var(--color-accent-primary))]" />
              <span className="text-[10px] font-medium text-[hsl(var(--color-accent-primary))]">Safe Mint</span>
            </div>
            <input type="text" value={safeMintToAddress} onChange={(e) => setSafeMintToAddress(e.target.value)}
              placeholder="To Address (0x...)"
              className="w-full px-3 py-2 bg-[hsl(var(--color-bg-base))] border border-[hsl(var(--color-border-default)/0.5)] rounded-lg text-xs text-[hsl(var(--color-text-primary))] placeholder-[hsl(var(--color-text-muted))] focus:outline-none" />
            <button onClick={handleSafeMint} disabled={txStatus.status === 'pending'}
              className="w-full py-2 bg-[hsl(var(--color-accent-primary))] hover:bg-[hsl(var(--color-accent-primary)/0.9)] text-black rounded-lg text-[10px] font-medium disabled:opacity-50 transition-colors">
              Safe Mint
            </button>
          </div>

          {/* Safe Transfer */}
          <div className="p-3 rounded-lg bg-[hsl(var(--color-bg-base)/0.5)] border border-[hsl(var(--color-border-default)/0.3)] space-y-2">
            <div className="flex items-center gap-1.5">
              <Shield className="w-3 h-3 text-[hsl(var(--color-accent-primary))]" />
              <span className="text-[10px] font-medium text-[hsl(var(--color-accent-primary))]">Safe Transfer</span>
            </div>
            <input type="text" value={transferFrom} onChange={(e) => setTransferFrom(e.target.value)}
              placeholder="From (0x...)"
              className="w-full px-3 py-2 bg-[hsl(var(--color-bg-base))] border border-[hsl(var(--color-border-default)/0.5)] rounded-lg text-xs text-[hsl(var(--color-text-primary))] placeholder-[hsl(var(--color-text-muted))] focus:outline-none" />
            <input type="text" value={transferTo} onChange={(e) => setTransferTo(e.target.value)}
              placeholder="To (0x...)"
              className="w-full px-3 py-2 bg-[hsl(var(--color-bg-base))] border border-[hsl(var(--color-border-default)/0.5)] rounded-lg text-xs text-[hsl(var(--color-text-primary))] placeholder-[hsl(var(--color-text-muted))] focus:outline-none" />
            <input type="number" value={transferTokenId} onChange={(e) => setTransferTokenId(e.target.value)}
              placeholder="Token ID"
              className="w-full px-3 py-2 bg-[hsl(var(--color-bg-base))] border border-[hsl(var(--color-border-default)/0.5)] rounded-lg text-xs text-[hsl(var(--color-text-primary))] placeholder-[hsl(var(--color-text-muted))] focus:outline-none" />
            <button onClick={handleTransfer} disabled={txStatus.status === 'pending'}
              className="w-full py-2 bg-[hsl(var(--color-accent-primary))] hover:bg-[hsl(var(--color-accent-primary)/0.9)] text-black rounded-lg text-[10px] font-medium disabled:opacity-50 transition-colors">
              Transfer NFT
            </button>
          </div>

          {/* Approve */}
          <div className="p-3 rounded-lg bg-[hsl(var(--color-bg-base)/0.5)] border border-[hsl(var(--color-border-default)/0.3)] space-y-2">
            <div className="flex items-center gap-1.5">
              <Shield className="w-3 h-3 text-[hsl(var(--color-info))]" />
              <span className="text-[10px] font-medium text-[hsl(var(--color-info))]">Approve Token</span>
            </div>
            <input type="text" value={approveAddress} onChange={(e) => setApproveAddress(e.target.value)}
              placeholder="Approved Address (0x...)"
              className="w-full px-3 py-2 bg-[hsl(var(--color-bg-base))] border border-[hsl(var(--color-border-default)/0.5)] rounded-lg text-xs text-[hsl(var(--color-text-primary))] placeholder-[hsl(var(--color-text-muted))] focus:outline-none" />
            <input type="number" value={approveTokenId} onChange={(e) => setApproveTokenId(e.target.value)}
              placeholder="Token ID"
              className="w-full px-3 py-2 bg-[hsl(var(--color-bg-base))] border border-[hsl(var(--color-border-default)/0.5)] rounded-lg text-xs text-[hsl(var(--color-text-primary))] placeholder-[hsl(var(--color-text-muted))] focus:outline-none" />
            <button onClick={handleApprove} disabled={txStatus.status === 'pending'}
              className="w-full py-2 bg-[hsl(var(--color-accent-primary))] hover:bg-[hsl(var(--color-accent-primary)/0.9)] text-black rounded-lg text-[10px] font-medium disabled:opacity-50 transition-colors">
              Approve
            </button>
          </div>

          {/* Set Approval For All */}
          <div className="p-3 rounded-lg bg-[hsl(var(--color-bg-base)/0.5)] border border-[hsl(var(--color-border-default)/0.3)] space-y-2">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3 h-3 text-[hsl(var(--color-info))]" />
              <span className="text-[10px] font-medium text-[hsl(var(--color-info))]">Set Approval For All</span>
            </div>
            <input type="text" value={operatorAddress} onChange={(e) => setOperatorAddress(e.target.value)}
              placeholder="Operator (0x...)"
              className="w-full px-3 py-2 bg-[hsl(var(--color-bg-base))] border border-[hsl(var(--color-border-default)/0.5)] rounded-lg text-xs text-[hsl(var(--color-text-primary))] placeholder-[hsl(var(--color-text-muted))] focus:outline-none" />
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={operatorApproved} onChange={(e) => setOperatorApproved(e.target.checked)}
                className="w-3.5 h-3.5 rounded bg-[hsl(var(--color-bg-base))] border-[hsl(var(--color-border-default))] accent-[hsl(var(--color-info))]" />
              <span className="text-[10px] text-[hsl(var(--color-text-muted))]">Grant Approval</span>
            </label>
            <button onClick={handleSetApprovalForAll} disabled={txStatus.status === 'pending'}
              className="w-full py-2 bg-[hsl(var(--color-accent-primary))] hover:bg-[hsl(var(--color-accent-primary)/0.9)] text-black rounded-lg text-[10px] font-medium disabled:opacity-50 transition-colors">
              {operatorApproved ? 'Grant' : 'Revoke'} Access
            </button>
          </div>

          {/* Burn */}
          <div className="p-3 rounded-lg bg-[hsl(var(--color-bg-base)/0.5)] border border-[hsl(var(--color-border-default)/0.3)] space-y-2">
            <div className="flex items-center gap-1.5">
              <Flame className="w-3 h-3 text-[hsl(var(--color-warning))]" />
              <span className="text-[10px] font-medium text-[hsl(var(--color-warning))]">Burn NFT</span>
            </div>
            <input type="number" value={burnTokenId} onChange={(e) => setBurnTokenId(e.target.value)}
              placeholder="Token ID"
              className="w-full px-3 py-2 bg-[hsl(var(--color-bg-base))] border border-[hsl(var(--color-border-default)/0.5)] rounded-lg text-xs text-[hsl(var(--color-text-primary))] placeholder-[hsl(var(--color-text-muted))] focus:outline-none" />
            <button onClick={handleBurn} disabled={txStatus.status === 'pending'}
              className="w-full py-2 bg-[hsl(var(--color-accent-primary))] hover:bg-[hsl(var(--color-accent-primary)/0.9)] text-black rounded-lg text-[10px] font-medium disabled:opacity-50 transition-colors">
              Burn
            </button>
          </div>
        </div>
      )}

      {/* Read Operations */}
      {isConnected && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <User className="w-3.5 h-3.5 text-[hsl(var(--color-accent-secondary))]" />
            <span className="text-xs font-medium text-[hsl(var(--color-text-primary))]">Read Operations</span>
          </div>

          {/* Owner Of */}
          <div className="p-3 rounded-lg bg-[hsl(var(--color-bg-base)/0.5)] border border-[hsl(var(--color-border-default)/0.3)] space-y-2">
            <span className="text-[10px] font-medium text-[hsl(var(--color-accent-secondary))]">Owner Of</span>
            <input type="number" value={ownerOfTokenId} onChange={(e) => setOwnerOfTokenId(e.target.value)}
              placeholder="Token ID"
              className="w-full px-3 py-2 bg-[hsl(var(--color-bg-base))] border border-[hsl(var(--color-border-default)/0.5)] rounded-lg text-xs text-[hsl(var(--color-text-primary))] placeholder-[hsl(var(--color-text-muted))] focus:outline-none" />
            <button onClick={checkOwnerOf}
              className="w-full py-2 bg-[hsl(var(--color-accent-primary))] hover:bg-[hsl(var(--color-accent-primary)/0.9)] text-black rounded-lg text-[10px] font-medium transition-colors">
              Check Owner
            </button>
            {ownerOfResult && (
              <div className="p-2 bg-[hsl(var(--color-accent-primary)/0.1)] border border-[hsl(var(--color-accent-primary)/0.3)] rounded">
                <p className="text-[9px] text-[hsl(var(--color-accent-primary)/0.8)] mb-0.5">Owner:</p>
                <p className="text-[10px] font-mono text-[hsl(var(--color-text-primary))] break-all">{ownerOfResult}</p>
              </div>
            )}
          </div>

          {/* Balance Of */}
          <div className="p-3 rounded-lg bg-[hsl(var(--color-bg-base)/0.5)] border border-[hsl(var(--color-border-default)/0.3)] space-y-2">
            <span className="text-[10px] font-medium text-[hsl(var(--color-accent-secondary))]">Balance Of</span>
            <input type="text" value={balanceCheckAddress} onChange={(e) => setBalanceCheckAddress(e.target.value)}
              placeholder="Address (0x...)"
              className="w-full px-3 py-2 bg-[hsl(var(--color-bg-base))] border border-[hsl(var(--color-border-default)/0.5)] rounded-lg text-xs text-[hsl(var(--color-text-primary))] placeholder-[hsl(var(--color-text-muted))] focus:outline-none" />
            <button onClick={checkBalance}
              className="w-full py-2 bg-[hsl(var(--color-accent-primary))] hover:bg-[hsl(var(--color-accent-primary)/0.9)] text-black rounded-lg text-[10px] font-medium transition-colors">
              Check Balance
            </button>
            {balanceCheckResult && (
              <div className="p-2 bg-[hsl(var(--color-accent-primary)/0.1)] border border-[hsl(var(--color-accent-primary)/0.3)] rounded">
                <p className="text-[10px] text-[hsl(var(--color-accent-primary)/0.8)]">NFTs owned: <span className="font-medium text-[hsl(var(--color-text-primary))]">{balanceCheckResult}</span></p>
              </div>
            )}
          </div>

          {/* Get Approved */}
          <div className="p-3 rounded-lg bg-[hsl(var(--color-bg-base)/0.5)] border border-[hsl(var(--color-border-default)/0.3)] space-y-2">
            <span className="text-[10px] font-medium text-[hsl(var(--color-info))]">Get Approved</span>
            <input type="number" value={getApprovedTokenId} onChange={(e) => setGetApprovedTokenId(e.target.value)}
              placeholder="Token ID"
              className="w-full px-3 py-2 bg-[hsl(var(--color-bg-base))] border border-[hsl(var(--color-border-default)/0.5)] rounded-lg text-xs text-[hsl(var(--color-text-primary))] placeholder-[hsl(var(--color-text-muted))] focus:outline-none" />
            <button onClick={checkGetApproved}
              className="w-full py-2 bg-[hsl(var(--color-accent-primary))] hover:bg-[hsl(var(--color-accent-primary)/0.9)] text-black rounded-lg text-[10px] font-medium transition-colors">
              Check Approved
            </button>
            {getApprovedResult && (
              <div className="p-2 bg-[hsl(var(--color-accent-primary)/0.1)] border border-[hsl(var(--color-accent-primary)/0.3)] rounded">
                <p className="text-[9px] text-[hsl(var(--color-accent-primary)/0.8)] mb-0.5">Approved:</p>
                <p className="text-[10px] font-mono text-[hsl(var(--color-text-primary))] break-all">{getApprovedResult}</p>
              </div>
            )}
          </div>

          {/* Is Approved For All */}
          <div className="p-3 rounded-lg bg-[hsl(var(--color-bg-base)/0.5)] border border-[hsl(var(--color-border-default)/0.3)] space-y-2">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3 h-3 text-[hsl(var(--color-info))]" />
              <span className="text-[10px] font-medium text-[hsl(var(--color-info))]">Is Approved For All</span>
            </div>
            <input type="text" value={approvalCheckOwner} onChange={(e) => setApprovalCheckOwner(e.target.value)}
              placeholder="Owner (0x...)"
              className="w-full px-3 py-2 bg-[hsl(var(--color-bg-base))] border border-[hsl(var(--color-border-default)/0.5)] rounded-lg text-xs text-[hsl(var(--color-text-primary))] placeholder-[hsl(var(--color-text-muted))] focus:outline-none" />
            <input type="text" value={approvalCheckOperator} onChange={(e) => setApprovalCheckOperator(e.target.value)}
              placeholder="Operator (0x...)"
              className="w-full px-3 py-2 bg-[hsl(var(--color-bg-base))] border border-[hsl(var(--color-border-default)/0.5)] rounded-lg text-xs text-[hsl(var(--color-text-primary))] placeholder-[hsl(var(--color-text-muted))] focus:outline-none" />
            <button onClick={checkApprovalForAll}
              className="w-full py-2 bg-[hsl(var(--color-accent-primary))] hover:bg-[hsl(var(--color-accent-primary)/0.9)] text-black rounded-lg text-[10px] font-medium transition-colors">
              Check Approval
            </button>
            {approvalCheckResult !== null && (
              <div className={cn(
                'p-2 rounded border',
                approvalCheckResult ? 'bg-[hsl(var(--color-success)/0.1)] border-[hsl(var(--color-success)/0.3)]' : 'bg-[hsl(var(--color-error)/0.1)] border-[hsl(var(--color-error)/0.3)]'
              )}>
                <p className={cn('text-[10px] font-medium', approvalCheckResult ? 'text-[hsl(var(--color-success)/0.8)]' : 'text-[hsl(var(--color-error)/0.8)]')}>
                  {approvalCheckResult ? '✓ Operator is approved' : '✗ Operator is not approved'}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
