'use client';

import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import {
  Coins,
  Send,
  ArrowRightLeft,
  Shield,
  Flame,
  RefreshCw,
  Check,
  Wallet,
  AlertCircle,
  ExternalLink,
  Loader2,
  Globe,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAccount, useWalletClient, usePublicClient, useSwitchChain } from 'wagmi';
import { arbitrum, arbitrumSepolia } from 'viem/chains';
import type { Chain } from 'viem';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Image from 'next/image';
import arbitrumLogo from '@/assets/blocks/arbitrum.svg';
import superpositionLogo from '@/assets/blocks/superposition.png';
import robinhoodLogo from '@/assets/blocks/robinhood.png';

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

const robinhoodTestnet: Chain = {
  id: 46630,
  name: 'Robinhood Chain Testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'Ether',
    symbol: 'ETH',
  },
  rpcUrls: {
    default: { http: ['https://rpc.testnet.chain.robinhood.com'] },
  },
  blockExplorers: {
    default: { name: 'Explorer', url: 'https://explorer.testnet.chain.robinhood.com' },
  },
  testnet: true,
};

// ERC20 ABI for the deployed Stylus contract (IStylusToken)
const ERC20_ABI = [
  // ERC20 Standard Interface
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address account) view returns (uint256)",
  "function transfer(address recipient, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function transferFrom(address sender, address recipient, uint256 amount) returns (bool)",
  // StylusToken Specific Functions (from lib.rs)
  "function mint(uint256 value)",
  "function mintTo(address to, uint256 value)",
  "function burn(uint256 value)",
];

// Network-specific default contract addresses (only for networks where contracts are deployed)
const DEFAULT_CONTRACT_ADDRESSES: Record<string, string | undefined> = {
  'arbitrum-sepolia': '0x5af02ab1d47cc700c1ec4578618df15b8c9c565e',
  'arbitrum': undefined, // No default contract deployed on mainnet
  'superposition': undefined, // No default contract deployed on mainnet
  'superposition-testnet': '0x88be27d855cb563bfcb18fa466f67d32d62fd0af',
  // 'robinhood': undefined, // No default contract deployed on mainnet
  'robinhood-testnet': '0x88be27d855cb563bfcb18fa466f67d32d62fd0af',
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
  // 'robinhood': {
  //   name: 'Robinhood Chain',
  //   rpcUrl: 'https://rpc.chain.robinhood.com',
  //   explorerUrl: 'https://explorer.chain.robinhood.com',
  //   chainId: 46630,
  //   chain: robinhoodTestnet,
  // },
  'robinhood-testnet': {
    name: 'Robinhood Chain Testnet',
    rpcUrl: 'https://rpc.testnet.chain.robinhood.com',
    explorerUrl: 'https://explorer.testnet.chain.robinhood.com',
    chainId: 46630,
    chain: robinhoodTestnet,
  },
};

interface ERC20InteractionPanelProps {
  contractAddress?: string;
  network?: 'arbitrum' | 'arbitrum-sepolia' | 'superposition' | 'superposition-testnet' | 'robinhood-testnet';
}

interface TxStatus {
  status: 'idle' | 'pending' | 'success' | 'error';
  message: string;
  hash?: string;
}

export function ERC20InteractionPanel({
  contractAddress: initialAddress,
  network: initialNetwork = 'arbitrum-sepolia',
}: ERC20InteractionPanelProps) {
  const [selectedNetwork, setSelectedNetwork] = useState<'arbitrum' | 'arbitrum-sepolia' | 'superposition' | 'superposition-testnet' | 'robinhood-testnet'>(initialNetwork);
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

  // Token info
  const [tokenName, setTokenName] = useState<string | null>(null);
  const [tokenSymbol, setTokenSymbol] = useState<string | null>(null);
  const [decimals, setDecimals] = useState<number>(18);
  const [totalSupply, setTotalSupply] = useState<string | null>(null);
  const [userBalance, setUserBalance] = useState<string | null>(null);

  // Form inputs - Write operations
  const [transferTo, setTransferTo] = useState('');
  const [transferAmount, setTransferAmount] = useState('');
  const [approveSpender, setApproveSpender] = useState('');
  const [approveAmount, setApproveAmount] = useState('');
  const [mintAmount, setMintAmount] = useState('');
  const [mintToAddress, setMintToAddress] = useState('');
  const [mintToAmount, setMintToAmount] = useState('');
  const [burnAmount, setBurnAmount] = useState('');

  // Form inputs - Read operations
  const [allowanceOwner, setAllowanceOwner] = useState('');
  const [allowanceSpender, setAllowanceSpender] = useState('');
  const [allowanceResult, setAllowanceResult] = useState<string | null>(null);
  const [balanceCheckAddress, setBalanceCheckAddress] = useState('');
  const [balanceCheckResult, setBalanceCheckResult] = useState<string | null>(null);

  // Transaction status
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
    // Create a fresh provider with the current RPC URL
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    return new ethers.Contract(contractAddress, ERC20_ABI, provider);
  }, [contractAddress, rpcUrl, selectedNetwork]);

  const getWriteContract = useCallback(async () => {
    console.log('[ERC20] getWriteContract called', { contractAddress, walletConnected, currentChainId: currentChain?.id, targetChainId: networkConfig.chainId });

    if (!contractAddress) {
      console.error('[ERC20] No contract address');
      throw new Error('No contract address specified');
    }

    if (!walletConnected) {
      console.error('[ERC20] Wallet not connected');
      throw new Error('Please connect your wallet first');
    }

    // Check if ethereum provider exists
    const ethereum = (window as any).ethereum;
    if (!ethereum) {
      console.error('[ERC20] No ethereum provider found');
      throw new Error('No wallet detected. Please install MetaMask.');
    }

    // Switch chain if necessary
    const targetChainIdHex = `0x${networkConfig.chainId.toString(16)}`;
    console.log('[ERC20] Current chain:', currentChain?.id, 'Target chain:', networkConfig.chainId);

    if (currentChain?.id !== networkConfig.chainId) {
      console.log('[ERC20] Switching chain to', networkConfig.name);
      try {
        await ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: targetChainIdHex }],
        });
        console.log('[ERC20] Chain switched successfully');
      } catch (switchError: any) {
        console.log('[ERC20] Switch error:', switchError.code, switchError.message);
        if (switchError.code === 4902 || switchError.message?.includes('Unrecognized chain') || switchError.message?.includes('wallet_addEthereumChain')) {
          console.log('[ERC20] Chain not found, adding chain...');
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
            console.log('[ERC20] Chain added successfully');
          } catch (addError: any) {
            console.error('[ERC20] Failed to add chain:', addError);
            throw new Error(`Failed to add ${networkConfig.name} to wallet: ${addError.message}`);
          }
        } else if (switchError.code === 4001) {
          throw new Error('User rejected chain switch');
        } else {
          throw switchError;
        }
      }
    }

    console.log('[ERC20] Creating provider and signer...');
    const provider = new ethers.BrowserProvider(ethereum);
    const signer = await provider.getSigner();
    console.log('[ERC20] Signer address:', await signer.getAddress());

    const contract = new ethers.Contract(contractAddress, ERC20_ABI, signer);
    console.log('[ERC20] Contract created at:', contractAddress);
    return contract;
  }, [contractAddress, walletConnected, currentChain?.id, networkConfig]);

  // Helper to parse RPC/contract errors into user-friendly messages
  const parseContractError = useCallback((error: any): string => {
    const errorMessage = error?.message || error?.reason || String(error);

    if (errorMessage.includes('BAD_DATA') || errorMessage.includes('could not decode result data')) {
      return `Contract not found or not deployed on ${networkConfig.name}. The contract may only exist on a different network.`;
    }
    if (errorMessage.includes('call revert exception')) {
      return `Contract call failed. The contract may not support this function or is not properly deployed on ${networkConfig.name}.`;
    }
    if (errorMessage.includes('network') || errorMessage.includes('connection')) {
      return `Network connection error. Please check your connection and try again.`;
    }
    if (errorMessage.includes('execution reverted')) {
      return `Transaction reverted: ${error?.reason || 'Unknown reason'}`;
    }

    return `Error: ${error?.reason || error?.shortMessage || errorMessage.slice(0, 100)}`;
  }, [networkConfig.name]);

  const fetchTokenInfo = useCallback(async () => {
    const contract = getReadContract();
    if (!contract) return;

    setContractError(null);

    try {
      const [name, symbol, dec, supply] = await Promise.all([
        contract.name().catch(() => null),
        contract.symbol().catch(() => null),
        contract.decimals().catch(() => 18),
        contract.totalSupply().catch(() => 0),
      ]);

      // Check if we got valid data - if all are null/default, contract may not exist
      if (name === null && symbol === null) {
        setContractError(`Unable to read contract data. The contract may not be deployed on ${networkConfig.name}.`);
        setIsConnected(false);
        return;
      }

      setTokenName(name);
      setTokenSymbol(symbol);
      setDecimals(Number(dec));
      setTotalSupply(ethers.formatUnits(supply, dec));

      if (userAddress) {
        try {
          const balance = await contract.balanceOf(userAddress);
          setUserBalance(ethers.formatUnits(balance, dec));
        } catch (balanceError: any) {
          console.error('Error fetching balance:', balanceError);
          setContractError(parseContractError(balanceError));
        }
      }
      setIsConnected(true);
    } catch (error: any) {
      console.error('Error fetching token info:', error);
      setContractError(parseContractError(error));
      setIsConnected(false);
    }
  }, [getReadContract, userAddress, networkConfig.name, parseContractError]);

  useEffect(() => {
    if (contractAddress && rpcUrl) {
      fetchTokenInfo();
    }
  }, [contractAddress, rpcUrl, fetchTokenInfo, userAddress]);

  const handleTransaction = async (
    operation: () => Promise<ethers.TransactionResponse>,
    successMessage: string
  ) => {
    console.log('[ERC20] handleTransaction called, walletConnected:', walletConnected, 'txStatus:', txStatus.status);

    if (txStatus.status === 'pending') {
      console.log('[ERC20] Transaction already pending, skipping');
      return;
    }

    if (!walletConnected) {
      console.log('[ERC20] Wallet not connected');
      setTxStatus({ status: 'error', message: 'Please connect your wallet first' });
      setTimeout(() => setTxStatus({ status: 'idle', message: '' }), 5000);
      return;
    }

    try {
      setTxStatus({ status: 'pending', message: 'Confirming...' });
      console.log('[ERC20] Executing operation...');
      const tx = await operation();
      console.log('[ERC20] Transaction submitted:', tx.hash);
      setTxStatus({ status: 'pending', message: 'Waiting for confirmation...', hash: tx.hash });
      await tx.wait();
      console.log('[ERC20] Transaction confirmed');
      setTxStatus({ status: 'success', message: successMessage, hash: tx.hash });
      fetchTokenInfo();
    } catch (error: any) {
      console.error('[ERC20] Transaction error:', error);
      const errorMsg = error.reason || error.message || error.shortMessage || 'Transaction failed';
      setTxStatus({ status: 'error', message: errorMsg });
    }
    setTimeout(() => setTxStatus({ status: 'idle', message: '' }), 5000);
  };

  const handleTransfer = async () => {
    console.log('[ERC20] handleTransfer called');
    try {
      const contract = await getWriteContract();
      if (!contract || !transferTo || !transferAmount) return;
      handleTransaction(
        () => contract.transfer(transferTo, ethers.parseUnits(transferAmount, decimals)),
        `Transferred ${transferAmount} ${tokenSymbol || 'tokens'}!`
      );
    } catch (error: any) {
      console.error('[ERC20] handleTransfer error:', error);
      setTxStatus({ status: 'error', message: error.message || 'Failed to prepare transaction' });
      setTimeout(() => setTxStatus({ status: 'idle', message: '' }), 5000);
    }
  };

  const handleApprove = async () => {
    console.log('[ERC20] handleApprove called');
    try {
      const contract = await getWriteContract();
      if (!contract || !approveSpender || !approveAmount) return;
      handleTransaction(
        () => contract.approve(approveSpender, ethers.parseUnits(approveAmount, decimals)),
        `Approved ${approveAmount} ${tokenSymbol || 'tokens'}!`
      );
    } catch (error: any) {
      console.error('[ERC20] handleApprove error:', error);
      setTxStatus({ status: 'error', message: error.message || 'Failed to prepare transaction' });
      setTimeout(() => setTxStatus({ status: 'idle', message: '' }), 5000);
    }
  };

  const handleMint = async () => {
    console.log('[ERC20] handleMint called');
    try {
      const contract = await getWriteContract();
      if (!contract || !mintAmount) return;
      handleTransaction(
        () => contract.mint(ethers.parseUnits(mintAmount, decimals)),
        `Minted ${mintAmount} ${tokenSymbol || 'tokens'} to yourself!`
      );
    } catch (error: any) {
      console.error('[ERC20] handleMint error:', error);
      setTxStatus({ status: 'error', message: error.message || 'Failed to prepare transaction' });
      setTimeout(() => setTxStatus({ status: 'idle', message: '' }), 5000);
    }
  };

  const handleMintTo = async () => {
    console.log('[ERC20] handleMintTo called');
    try {
      const contract = await getWriteContract();
      if (!contract || !mintToAddress || !mintToAmount) return;
      handleTransaction(
        () => contract.mintTo(mintToAddress, ethers.parseUnits(mintToAmount, decimals)),
        `Minted ${mintToAmount} ${tokenSymbol || 'tokens'}!`
      );
    } catch (error: any) {
      console.error('[ERC20] handleMintTo error:', error);
      setTxStatus({ status: 'error', message: error.message || 'Failed to prepare transaction' });
      setTimeout(() => setTxStatus({ status: 'idle', message: '' }), 5000);
    }
  };

  const handleBurn = async () => {
    console.log('[ERC20] handleBurn called');
    try {
      const contract = await getWriteContract();
      if (!contract || !burnAmount) return;
      handleTransaction(
        () => contract.burn(ethers.parseUnits(burnAmount, decimals)),
        `Burned ${burnAmount} ${tokenSymbol || 'tokens'}!`
      );
    } catch (error: any) {
      console.error('[ERC20] handleBurn error:', error);
      setTxStatus({ status: 'error', message: error.message || 'Failed to prepare transaction' });
      setTimeout(() => setTxStatus({ status: 'idle', message: '' }), 5000);
    }
  };

  const checkAllowance = async () => {
    const contract = getReadContract();
    if (!contract || !allowanceOwner || !allowanceSpender) return;
    try {
      const allowance = await contract.allowance(allowanceOwner, allowanceSpender);
      setAllowanceResult(ethers.formatUnits(allowance, decimals));
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const checkBalance = async () => {
    const contract = getReadContract();
    if (!contract || !balanceCheckAddress) return;
    try {
      const balance = await contract.balanceOf(balanceCheckAddress);
      setBalanceCheckResult(ethers.formatUnits(balance, decimals));
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return (
    <div className="space-y-4 p-3">
      {/* Header */}
      <div className="p-3 rounded-lg border border-[hsl(var(--color-accent-primary)/0.3)] bg-gradient-to-r from-[hsl(var(--color-accent-primary)/0.1)] to-transparent">
        <div className="flex items-center gap-2 mb-1">
          <Coins className="w-4 h-4 text-[hsl(var(--color-accent-primary))]" />
          <span className="text-sm font-medium text-[hsl(var(--color-text-primary))]">
            {tokenName || 'ERC-20'} {tokenSymbol ? `(${tokenSymbol})` : 'Token'}
          </span>
        </div>
        <p className="text-[10px] text-[hsl(var(--color-text-muted))]">Stylus Contract Interaction</p>
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
        <Select value={selectedNetwork} onValueChange={(value) => setSelectedNetwork(value as typeof selectedNetwork)}>
          <SelectTrigger className="w-full">
            <SelectValue>
              <div className="flex items-center gap-2">
                <Image 
                  src={selectedNetwork.includes('arbitrum') ? arbitrumLogo : selectedNetwork.includes('superposition') ? superpositionLogo : robinhoodLogo} 
                  alt="" 
                  width={16} 
                  height={16} 
                  className="rounded"
                />
                <span>{NETWORKS[selectedNetwork].name}</span>
                {NETWORKS[selectedNetwork].chain.testnet && (
                  <span className="text-[8px] px-1.5 py-0.5 bg-[hsl(var(--color-warning)/0.2)] text-[hsl(var(--color-warning))] rounded">Testnet</span>
                )}
              </div>
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {(['arbitrum', 'arbitrum-sepolia', 'superposition', 'superposition-testnet', 'robinhood-testnet'] as const).map((net) => (
              <SelectItem key={net} value={net}>
                <div className="flex items-center gap-2">
                  <Image 
                    src={net.includes('arbitrum') ? arbitrumLogo : net.includes('superposition') ? superpositionLogo : robinhoodLogo} 
                    alt="" 
                    width={16} 
                    height={16} 
                    className="rounded"
                  />
                  <span>{NETWORKS[net].name}</span>
                  {NETWORKS[net].chain.testnet && (
                    <span className="text-[8px] px-1.5 py-0.5 bg-[hsl(var(--color-warning)/0.2)] text-[hsl(var(--color-warning))] rounded">Testnet</span>
                  )}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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
        onClick={fetchTokenInfo}
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

      {/* Token Stats */}
      {isConnected && (
        <div className="space-y-2">
          <div className="flex items-center justify-between p-2.5 rounded-lg bg-[hsl(var(--color-bg-base)/0.5)] border border-[hsl(var(--color-border-default)/0.3)]">
            <div className="flex items-center gap-1.5">
              <Coins className="w-3 h-3 text-[hsl(var(--color-accent-primary))]" />
              <span className="text-[10px] text-[hsl(var(--color-text-muted))]">Total Supply</span>
            </div>
            <span className="text-xs font-medium text-[hsl(var(--color-text-primary))]">{totalSupply ? Number(totalSupply).toLocaleString() : '—'}</span>
          </div>
          {walletConnected && (
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-[hsl(var(--color-bg-base)/0.5)] border border-[hsl(var(--color-border-default)/0.3)]">
              <div className="flex items-center gap-1.5">
                <Wallet className="w-3 h-3 text-[hsl(var(--color-accent-primary))]" />
                <span className="text-[10px] text-[hsl(var(--color-text-muted))]">Your Balance</span>
              </div>
              <span className="text-xs font-medium text-[hsl(var(--color-text-primary))]">{userBalance ? Number(userBalance).toLocaleString() : '—'}</span>
            </div>
          )}
        </div>
      )}

      {/* Write Operations */}
      {isConnected && walletConnected && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Send className="w-3.5 h-3.5 text-[hsl(var(--color-success))]" />
            <span className="text-xs font-medium text-[hsl(var(--color-text-primary))]">Write Operations</span>
          </div>

          {/* Transfer */}
          <div className="p-3 rounded-lg bg-[hsl(var(--color-bg-base)/0.5)] border border-[hsl(var(--color-border-default)/0.3)] space-y-2">
            <span className="text-[10px] font-medium text-[hsl(var(--color-accent-primary))]">Transfer</span>
            <input type="text" value={transferTo} onChange={(e) => setTransferTo(e.target.value)}
              placeholder="Recipient (0x...)"
              className="w-full px-3 py-2 bg-[hsl(var(--color-bg-base))] border border-[hsl(var(--color-border-default)/0.5)] rounded-lg text-xs text-[hsl(var(--color-text-primary))] placeholder-[hsl(var(--color-text-muted))] focus:outline-none" />
            <input type="number" value={transferAmount} onChange={(e) => setTransferAmount(e.target.value)}
              placeholder="Amount"
              className="w-full px-3 py-2 bg-[hsl(var(--color-bg-base))] border border-[hsl(var(--color-border-default)/0.5)] rounded-lg text-xs text-[hsl(var(--color-text-primary))] placeholder-[hsl(var(--color-text-muted))] focus:outline-none" />
            <button onClick={handleTransfer} disabled={txStatus.status === 'pending'}
              className="w-full py-2 bg-[hsl(var(--color-accent-primary))] hover:bg-[hsl(var(--color-accent-primary)/0.9)] text-black rounded-lg text-[10px] font-medium disabled:opacity-50 transition-colors">
              Transfer
            </button>
          </div>

          {/* Approve */}
          <div className="p-3 rounded-lg bg-[hsl(var(--color-bg-base)/0.5)] border border-[hsl(var(--color-border-default)/0.3)] space-y-2">
            <div className="flex items-center gap-1.5 text-[hsl(var(--color-accent-primary))]">
              <Shield className="w-3 h-3 text-[hsl(var(--color-accent-primary))]" />
              <span className="text-[10px] font-medium text-[hsl(var(--color-accent-primary))]">Approve Spender</span>
            </div>
            <input type="text" value={approveSpender} onChange={(e) => setApproveSpender(e.target.value)}
              placeholder="Spender (0x...)"
              className="w-full px-3 py-2 bg-[hsl(var(--color-bg-base))] border border-[hsl(var(--color-border-default)/0.5)] rounded-lg text-xs text-[hsl(var(--color-text-primary))] placeholder-[hsl(var(--color-text-muted))] focus:outline-none" />
            <input type="number" value={approveAmount} onChange={(e) => setApproveAmount(e.target.value)}
              placeholder="Amount"
              className="w-full px-3 py-2 bg-[hsl(var(--color-bg-base))] border border-[hsl(var(--color-border-default)/0.5)] rounded-lg text-xs text-[hsl(var(--color-text-primary))] placeholder-[hsl(var(--color-text-muted))] focus:outline-none" />
            <button onClick={handleApprove} disabled={txStatus.status === 'pending'}
              className="w-full py-2 bg-[hsl(var(--color-accent-primary))] hover:bg-[hsl(var(--color-info)/0.9)] text-black rounded-lg text-[10px] font-medium disabled:opacity-50 transition-colors">
              Approve
            </button>
          </div>

          {/* Mint (to self) */}
          <div className="p-3 rounded-lg bg-[hsl(var(--color-bg-base)/0.5)] border border-[hsl(var(--color-border-default)/0.3)] space-y-2">
            <div className="flex items-center gap-1.5 text-[hsl(var(--color-accent-primary))]">
              <Coins className="w-3 h-3 text-[hsl(var(--color-accent-primary))]" />
              <span className="text-[10px] font-medium text-[hsl(var(--color-accent-primary))]">Mint (to yourself)</span>
            </div>
            <input type="number" value={mintAmount} onChange={(e) => setMintAmount(e.target.value)}
              placeholder="Amount"
              className="w-full px-3 py-2 bg-[hsl(var(--color-bg-base))] border border-[hsl(var(--color-border-default)/0.5)] rounded-lg text-xs text-[hsl(var(--color-text-primary))] placeholder-[hsl(var(--color-text-muted))] focus:outline-none" />
            <button onClick={handleMint} disabled={txStatus.status === 'pending'}
              className="w-full py-2 bg-[hsl(var(--color-accent-primary))] hover:bg-[hsl(var(--color-accent-primary)/0.9)] text-black rounded-lg text-[10px] font-medium disabled:opacity-50 transition-colors">
              Mint
            </button>
          </div>

          {/* Mint To */}
          <div className="p-3 rounded-lg bg-[hsl(var(--color-bg-base)/0.5)] border border-[hsl(var(--color-border-default)/0.3)] space-y-2">
            <div className="flex items-center gap-1.5">
              <Coins className="w-3 h-3 text-[hsl(var(--color-accent-primary))]" />
              <span className="text-[10px] font-medium text-[hsl(var(--color-accent-primary))]">Mint To Address</span>
            </div>
            <input type="text" value={mintToAddress} onChange={(e) => setMintToAddress(e.target.value)}
              placeholder="To Address (0x...)"
              className="w-full px-3 py-2 bg-[hsl(var(--color-bg-base))] border border-[hsl(var(--color-border-default)/0.5)] rounded-lg text-xs text-[hsl(var(--color-text-primary))] placeholder-[hsl(var(--color-text-muted))] focus:outline-none" />
            <input type="number" value={mintToAmount} onChange={(e) => setMintToAmount(e.target.value)}
              placeholder="Amount"
              className="w-full px-3 py-2 bg-[hsl(var(--color-bg-base))] border border-[hsl(var(--color-border-default)/0.5)] rounded-lg text-xs text-[hsl(var(--color-text-primary))] placeholder-[hsl(var(--color-text-muted))] focus:outline-none" />
            <button onClick={handleMintTo} disabled={txStatus.status === 'pending'}
              className="w-full py-2 bg-[hsl(var(--color-accent-primary))] hover:bg-[hsl(var(--color-accent-primary)/0.9)] text-black rounded-lg text-[10px] font-medium disabled:opacity-50 transition-colors">
              Mint To
            </button>
          </div>

          {/* Burn */}
          <div className="p-3 rounded-lg bg-[hsl(var(--color-bg-base)/0.5)] border border-[hsl(var(--color-border-default)/0.3)] space-y-2">
            <div className="flex items-center gap-1.5 text-[hsl(var(--color-accent-primary))]">
              <Flame className="w-3 h-3 text-[hsl(var(--color-accent-primary))]" />
              <span className="text-[10px] font-medium text-[hsl(var(--color-accent-primary))]">Burn Tokens</span>
            </div>
            <input type="number" value={burnAmount} onChange={(e) => setBurnAmount(e.target.value)}
              placeholder="Amount"
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
            <ArrowRightLeft className="w-3.5 h-3.5 text-[hsl(var(--color-accent-secondary))]" />
            <span className="text-xs font-medium text-[hsl(var(--color-text-primary))]">Read Operations</span>
          </div>

          {/* Allowance */}
          <div className="p-3 rounded-lg bg-[hsl(var(--color-bg-base)/0.5)] border border-[hsl(var(--color-border-default)/0.3)] space-y-2">
            <span className="text-[10px] font-medium text-[hsl(var(--color-accent-primary))]">Check Allowance</span>
            <input type="text" value={allowanceOwner} onChange={(e) => setAllowanceOwner(e.target.value)}
              placeholder="Owner (0x...)"
              className="w-full px-3 py-2 bg-[hsl(var(--color-bg-base))] border border-[hsl(var(--color-border-default)/0.5)] rounded-lg text-xs text-[hsl(var(--color-text-primary))] placeholder-[hsl(var(--color-text-muted))] focus:outline-none" />
            <input type="text" value={allowanceSpender} onChange={(e) => setAllowanceSpender(e.target.value)}
              placeholder="Spender (0x...)"
              className="w-full px-3 py-2 bg-[hsl(var(--color-bg-base))] border border-[hsl(var(--color-border-default)/0.5)] rounded-lg text-xs text-[hsl(var(--color-text-primary))] placeholder-[hsl(var(--color-text-muted))] focus:outline-none" />
            <button onClick={checkAllowance}
              className="w-full py-2 bg-[hsl(var(--color-accent-primary)/0.5)] hover:bg-[hsl(var(--color-accent-secondary))] text-black rounded-lg text-[10px] font-medium transition-colors">
              Check Allowance
            </button>
            {allowanceResult && (
              <div className="p-2 bg-[hsl(var(--color-accent-primary)/0.1)] border border-[hsl(var(--color-accent-primary)/0.3)] rounded">
                <p className="text-[10px] text-[hsl(var(--color-accent-primary)/0.8)]">Allowance: <span className="font-medium text-[hsl(var(--color-text-primary))]">{allowanceResult}</span></p>
              </div>
            )}
          </div>

          {/* Balance Of */}
          <div className="p-3 rounded-lg bg-[hsl(var(--color-bg-base)/0.5)] border border-[hsl(var(--color-border-default)/0.3)] space-y-2">
            <span className="text-[10px] font-medium text-[hsl(var(--color-accent-primary))]">Check Balance</span>
            <input type="text" value={balanceCheckAddress} onChange={(e) => setBalanceCheckAddress(e.target.value)}
              placeholder="Address (0x...)"
              className="w-full px-3 py-2 bg-[hsl(var(--color-bg-base))] border border-[hsl(var(--color-border-default)/0.5)] rounded-lg text-xs text-[hsl(var(--color-text-primary))] placeholder-[hsl(var(--color-text-muted))] focus:outline-none" />
            <button onClick={checkBalance}
              className="w-full py-2 bg-[hsl(var(--color-accent-primary)/0.5)] hover:bg-[hsl(var(--color-accent-secondary))] text-black rounded-lg text-[10px] font-medium transition-colors">
              Check Balance
            </button>
            {balanceCheckResult && (
              <div className="p-2 bg-[hsl(var(--color-accent-primary)/0.1)] border border-[hsl(var(--color-accent-primary)/0.3)] rounded">
                <p className="text-[10px] text-[hsl(var(--color-accent-primary)/0.8)]">Balance: <span className="font-medium text-[hsl(var(--color-text-primary))]">{balanceCheckResult}</span></p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
