'use client';

import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { 
  Layers, 
  Send, 
  Shield, 
  Flame, 
  RefreshCw, 
  Check,
  Wallet,
  Package,
  AlertCircle,
  ExternalLink,
  Loader2,
  BarChart3,
  CheckCircle2,
  Sparkles,
  ArrowRightLeft
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAccount, useWalletClient, usePublicClient } from 'wagmi';
import { arbitrum, arbitrumSepolia } from 'wagmi/chains';

// ERC1155 ABI for OpenZeppelin Stylus contracts
// const ERC1155_ABI = [
//   "function balanceOf(address account, uint256 id) view returns (uint256)",
//   "function balanceOfBatch(address[] accounts, uint256[] ids) view returns (uint256[])",
//   "function setApprovalForAll(address operator, bool approved)",
//   "function isApprovedForAll(address account, address operator) view returns (bool)",
//   "function safeTransferFrom(address from, address to, uint256 id, uint256 value, bytes data)",
//   "function safeBatchTransferFrom(address from, address to, uint256[] ids, uint256[] values, bytes data)",
//   "function burn(address account, uint256 tokenId, uint256 value)",
//   "function burnBatch(address account, uint256[] tokenIds, uint256[] values)",
//   "function totalSupply(uint256 id) view returns (uint256)",
//   "function totalSupply() view returns (uint256)",
//   "function exists(uint256 id) view returns (bool)",
//   "function supportsInterface(bytes4 interfaceId) view returns (bool)",
//   // StylusToken Specific Functions (from lib.rs)
//   "function mint(uint256 id, uint256 value)",
//   "function mintTo(address to, uint256 id, uint256 value)",
// ];

const ERC1155_ABI = [
  "function balanceOf(address account, uint256 id) external view returns (uint256)",

  "function balanceOfBatch(address[] memory accounts, uint256[] memory ids) external view returns (uint256[] memory)",

  "function setApprovalForAll(address operator, bool approved) external;",

  "function isApprovedForAll(address account, address operator) external view returns (bool);",

  "function safeTransferFrom(address from, address to, uint256 id, uint256 value, uint8[] memory data) external;",

  "function safeBatchTransferFrom(address from, address to, uint256[] memory ids, uint256[] memory values, uint8[] memory data) external;",
];

interface ERC1155InteractionPanelProps {
  contractAddress?: string;
  rpcUrl?: string;
  network?: 'arbitrum' | 'arbitrum-sepolia';
}

interface TxStatus {
  status: 'idle' | 'pending' | 'success' | 'error';
  message: string;
  hash?: string;
}

export function ERC1155InteractionPanel({
  contractAddress: initialAddress = "0xf5dfa3cc48b885fe7154e9877e6f2a805f723f29",
  rpcUrl: initialRpcUrl = '',
  network = 'arbitrum-sepolia',
}: ERC1155InteractionPanelProps) {
  const [contractAddress, setContractAddress] = useState(initialAddress);
  const [rpcUrl, setRpcUrl] = useState(initialRpcUrl || (network === 'arbitrum' ? 'https://arb1.arbitrum.io/rpc' : 'https://sepolia-rollup.arbitrum.io/rpc'));
  const [isConnected, setIsConnected] = useState(false);

  // Wagmi hooks for wallet connection
  const { address: userAddress, isConnected: walletConnected } = useAccount();
  const chainId = network === 'arbitrum' ? arbitrum.id : arbitrumSepolia.id;
  const publicClient = usePublicClient({ chainId });
  const { data: walletClient } = useWalletClient({ chainId });

  // Token info
  const [totalSupplyAll, setTotalSupplyAll] = useState<string | null>(null);
  const [userBalances, setUserBalances] = useState<Map<string, string>>(new Map());

  // Form inputs - Single Transfer
  const [transferFrom, setTransferFrom] = useState('');
  const [transferTo, setTransferTo] = useState('');
  const [transferTokenId, setTransferTokenId] = useState('');
  const [transferAmount, setTransferAmount] = useState('');
  
  // Form inputs - Batch Transfer
  const [batchTransferFrom, setBatchTransferFrom] = useState('');
  const [batchTransferTo, setBatchTransferTo] = useState('');
  const [batchTokenIds, setBatchTokenIds] = useState('');
  const [batchAmounts, setBatchAmounts] = useState('');

  // Form inputs - Approval
  const [operatorAddress, setOperatorAddress] = useState('');
  const [operatorApproved, setOperatorApproved] = useState(true);

  // Form inputs - Burn
  const [burnAccount, setBurnAccount] = useState('');
  const [burnTokenId, setBurnTokenId] = useState('');
  const [burnAmount, setBurnAmount] = useState('');

  // Form inputs - Mint
  const [mintTokenId, setMintTokenId] = useState('');
  const [mintAmount, setMintAmount] = useState('');
  const [mintToAddress, setMintToAddress] = useState('');
  const [mintToTokenId, setMintToTokenId] = useState('');
  const [mintToAmount, setMintToAmount] = useState('');

  // Read operations
  const [balanceCheckAddress, setBalanceCheckAddress] = useState('');
  const [balanceCheckTokenId, setBalanceCheckTokenId] = useState('');
  const [balanceCheckResult, setBalanceCheckResult] = useState<string | null>(null);
  
  const [totalSupplyTokenId, setTotalSupplyTokenId] = useState('');
  const [totalSupplyResult, setTotalSupplyResult] = useState<string | null>(null);
  
  const [existsTokenId, setExistsTokenId] = useState('');
  const [existsResult, setExistsResult] = useState<boolean | null>(null);

  const [approvalCheckOwner, setApprovalCheckOwner] = useState('');
  const [approvalCheckOperator, setApprovalCheckOperator] = useState('');
  const [approvalCheckResult, setApprovalCheckResult] = useState<boolean | null>(null);

  // Transaction status
  const [txStatus, setTxStatus] = useState<TxStatus>({ status: 'idle', message: '' });

  const explorerUrl = network === 'arbitrum' ? 'https://arbiscan.io' : 'https://sepolia.arbiscan.io';

  const getReadContract = useCallback(() => {
    if (!contractAddress || !rpcUrl) return null;
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    return new ethers.Contract(contractAddress, ERC1155_ABI, provider);
  }, [contractAddress, rpcUrl]);

  const getWriteContract = useCallback(async () => {
    if (!contractAddress || !walletClient) return null;
    const provider = new ethers.BrowserProvider(walletClient as any);
    const signer = await provider.getSigner();
    return new ethers.Contract(contractAddress, ERC1155_ABI, signer);
  }, [contractAddress, walletClient]);

  const fetchTokenInfo = useCallback(async () => {
    const contract = getReadContract();
    if (!contract) return;

    try {
      try {
        const supply = await contract['totalSupply()']();
        setTotalSupplyAll(supply.toString());
      } catch {
        setTotalSupplyAll('N/A');
      }
      
      // Fetch user balances for common token IDs (0-10)
      if (userAddress) {
        const balances = new Map<string, string>();
        for (let i = 0; i <= 10; i++) {
          try {
            const balance = await contract.balanceOf(userAddress, i);
            if (balance > 0n) {
              balances.set(i.toString(), balance.toString());
            }
          } catch {
            // Token ID might not exist, skip
          }
        }
        setUserBalances(balances);
      }
      
      setIsConnected(true);
    } catch (error) {
      console.error('Error:', error);
      setIsConnected(false);
    }
  }, [getReadContract, userAddress]);

  useEffect(() => {
    if (contractAddress && rpcUrl) {
      fetchTokenInfo();
    }
  }, [contractAddress, rpcUrl, fetchTokenInfo, userAddress]);

  const handleTransaction = async (
    operation: () => Promise<ethers.TransactionResponse>,
    successMessage: string
  ) => {
    if (txStatus.status === 'pending' || !walletConnected) return;
    try {
      setTxStatus({ status: 'pending', message: 'Confirming...' });
      const tx = await operation();
      setTxStatus({ status: 'pending', message: 'Waiting...', hash: tx.hash });
      await tx.wait();
      setTxStatus({ status: 'success', message: successMessage, hash: tx.hash });
      fetchTokenInfo();
    } catch (error: any) {
      setTxStatus({ status: 'error', message: error.reason || error.message || 'Failed' });
    }
    setTimeout(() => setTxStatus({ status: 'idle', message: '' }), 5000);
  };

  const handleSafeTransfer = async () => {
    const contract = await getWriteContract();
    if (!contract || !transferFrom || !transferTo || !transferTokenId || !transferAmount) return;
    handleTransaction(
      () => contract.safeTransferFrom(transferFrom, transferTo, transferTokenId, transferAmount, '0x'),
      `Transferred ${transferAmount} of ID #${transferTokenId}!`
    );
  };

  const handleBatchTransfer = async () => {
    const contract = await getWriteContract();
    if (!contract || !batchTransferFrom || !batchTransferTo || !batchTokenIds || !batchAmounts) return;
    const ids = batchTokenIds.split(',').map(s => s.trim());
    const amounts = batchAmounts.split(',').map(s => s.trim());
    handleTransaction(
      () => contract.safeBatchTransferFrom(batchTransferFrom, batchTransferTo, ids, amounts, '0x'),
      `Batch transfer completed!`
    );
  };

  const handleSetApprovalForAll = async () => {
    const contract = await getWriteContract();
    if (!contract || !operatorAddress) return;
    handleTransaction(
      () => contract.setApprovalForAll(operatorAddress, operatorApproved),
      `Operator ${operatorApproved ? 'approved' : 'revoked'}!`
    );
  };

  const handleBurn = async () => {
    const contract = await getWriteContract();
    if (!contract || !burnAccount || !burnTokenId || !burnAmount) return;
    handleTransaction(
      () => contract.burn(burnAccount, burnTokenId, burnAmount),
      `Burned ${burnAmount} of ID #${burnTokenId}!`
    );
  };

  const handleMint = async () => {
    const contract = await getWriteContract();
    if (!contract || !mintTokenId || !mintAmount) return;
    handleTransaction(
      () => contract.mint(mintTokenId, mintAmount),
      `Minted ${mintAmount} of ID #${mintTokenId} to yourself!`
    );
  };

  const handleMintTo = async () => {
    const contract = await getWriteContract();
    if (!contract || !mintToAddress || !mintToTokenId || !mintToAmount) return;
    handleTransaction(
      () => contract.mintTo(mintToAddress, mintToTokenId, mintToAmount),
      `Minted ${mintToAmount} of ID #${mintToTokenId}!`
    );
  };

  const checkBalance = async () => {
    const contract = getReadContract();
    if (!contract || !balanceCheckAddress || !balanceCheckTokenId) return;
    try {
      const balance = await contract.balanceOf(balanceCheckAddress, balanceCheckTokenId);
      setBalanceCheckResult(balance.toString());
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const checkTotalSupply = async () => {
    const contract = getReadContract();
    if (!contract || !totalSupplyTokenId) return;
    try {
      const supply = await contract['totalSupply(uint256)'](totalSupplyTokenId);
      setTotalSupplyResult(supply.toString());
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const checkExists = async () => {
    const contract = getReadContract();
    if (!contract || !existsTokenId) return;
    try {
      const exists = await contract.exists(existsTokenId);
      setExistsResult(exists);
    } catch (error) {
      console.error('Error:', error);
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
    <div className="space-y-4">
      {/* Header */}
      <div className="p-3 rounded-lg border border-amber-500/30 bg-gradient-to-r from-amber-500/10 to-transparent">
        <div className="flex items-center gap-2 mb-1">
          <Layers className="w-4 h-4 text-amber-400" />
          <span className="text-sm font-medium text-white">ERC-1155 Multi-Token</span>
        </div>
        <p className="text-[10px] text-forge-muted">Stylus Contract Interaction</p>
      </div>

      {/* Wallet Status */}
      <div className={cn(
        'p-2.5 rounded-lg border',
        walletConnected ? 'border-green-500/30 bg-green-500/5' : 'border-amber-500/30 bg-amber-500/5'
      )}>
        <div className="flex items-center gap-2">
          <Wallet className={cn('w-3.5 h-3.5', walletConnected ? 'text-green-400' : 'text-amber-400')} />
          {walletConnected ? (
            <span className="text-[10px] text-green-300">
              Connected: <code className="text-green-400">{userAddress?.slice(0, 6)}...{userAddress?.slice(-4)}</code>
            </span>
          ) : (
            <span className="text-[10px] text-amber-300">Connect wallet via Wallet Auth node for write ops</span>
          )}
        </div>
      </div>

      {/* Connection */}
      <div className="space-y-2">
        <label className="text-xs text-forge-muted mb-1 block">Contract Address</label>
        <input
          type="text"
          value={contractAddress}
          onChange={(e) => setContractAddress(e.target.value)}
          placeholder="0x..."
          className="w-full px-3 py-2 bg-forge-bg border border-forge-border/50 rounded-lg text-xs text-white placeholder-forge-muted focus:outline-none focus:border-amber-500/50"
        />
      </div>

      <div className="space-y-2">
        <label className="text-xs text-forge-muted mb-1 block">RPC URL</label>
        <input
          type="text"
          value={rpcUrl}
          onChange={(e) => setRpcUrl(e.target.value)}
          placeholder="https://..."
          className="w-full px-3 py-2 bg-forge-bg border border-forge-border/50 rounded-lg text-xs text-white placeholder-forge-muted focus:outline-none focus:border-amber-500/50"
        />
      </div>

      <button
        onClick={fetchTokenInfo}
        className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-medium transition-colors"
      >
        <RefreshCw className="w-3.5 h-3.5" /> Refresh
      </button>

      {/* Transaction Status */}
      {txStatus.status !== 'idle' && (
        <div className={cn(
          'rounded-lg p-2.5 border flex items-start gap-2',
          txStatus.status === 'pending' && 'bg-blue-500/10 border-blue-500/30',
          txStatus.status === 'success' && 'bg-emerald-500/10 border-emerald-500/30',
          txStatus.status === 'error' && 'bg-red-500/10 border-red-500/30'
        )}>
          {txStatus.status === 'pending' && <Loader2 className="w-3.5 h-3.5 text-blue-400 animate-spin shrink-0" />}
          {txStatus.status === 'success' && <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
          {txStatus.status === 'error' && <AlertCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />}
          <div className="flex-1 min-w-0">
            <p className={cn(
              'text-[10px] font-medium truncate',
              txStatus.status === 'pending' && 'text-blue-300',
              txStatus.status === 'success' && 'text-emerald-300',
              txStatus.status === 'error' && 'text-red-300'
            )}>{txStatus.message}</p>
            {txStatus.hash && (
              <a href={`${explorerUrl}/tx/${txStatus.hash}`} target="_blank" rel="noopener noreferrer"
                className="text-[9px] text-forge-muted hover:text-white flex items-center gap-1">
                Explorer <ExternalLink className="w-2.5 h-2.5" />
              </a>
            )}
          </div>
        </div>
      )}

      {/* Token Stats */}
      {isConnected && (
        <div className="space-y-2">
          <div className="flex items-center justify-between p-2.5 rounded-lg bg-forge-bg/50 border border-forge-border/30">
            <div className="flex items-center gap-1.5">
              <BarChart3 className="w-3 h-3 text-amber-400" />
              <span className="text-[10px] text-forge-muted">Total Supply</span>
            </div>
            <span className="text-xs font-medium text-white">{totalSupplyAll || '—'}</span>
          </div>
          {walletConnected && (
            <>
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-forge-bg/50 border border-forge-border/30">
                <div className="flex items-center gap-1.5">
                  <Wallet className="w-3 h-3 text-rose-400" />
                  <span className="text-[10px] text-forge-muted">Wallet</span>
                </div>
                <span className="text-[9px] font-mono text-white truncate max-w-[100px]">{userAddress ? `${userAddress.slice(0, 6)}...${userAddress.slice(-4)}` : '—'}</span>
              </div>
              {userBalances.size > 0 && (
                <div className="p-2.5 rounded-lg bg-forge-bg/50 border border-forge-border/30">
                  <div className="flex items-center gap-1.5 mb-2">
                    <Package className="w-3 h-3 text-teal-400" />
                    <span className="text-[10px] text-forge-muted">Your Balances</span>
                  </div>
                  <div className="space-y-1">
                    {Array.from(userBalances.entries()).map(([tokenId, balance]) => (
                      <div key={tokenId} className="flex items-center justify-between text-[10px]">
                        <span className="text-forge-muted">Token #{tokenId}:</span>
                        <span className="text-white font-medium">{balance}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Write Operations */}
      {isConnected && walletConnected && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Send className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-xs font-medium text-white">Write Operations</span>
          </div>

          {/* Safe Transfer */}
          <div className="p-3 rounded-lg bg-forge-bg/50 border border-forge-border/30 space-y-2">
            <span className="text-[10px] font-medium text-amber-400">Safe Transfer</span>
            <input type="text" value={transferFrom} onChange={(e) => setTransferFrom(e.target.value)}
              placeholder="From (0x...)"
              className="w-full px-2.5 py-1.5 bg-forge-bg border border-forge-border/50 rounded text-xs text-white placeholder-forge-muted focus:outline-none" />
            <input type="text" value={transferTo} onChange={(e) => setTransferTo(e.target.value)}
              placeholder="To (0x...)"
              className="w-full px-2.5 py-1.5 bg-forge-bg border border-forge-border/50 rounded text-xs text-white placeholder-forge-muted focus:outline-none" />
            <input type="number" value={transferTokenId} onChange={(e) => setTransferTokenId(e.target.value)}
              placeholder="Token ID"
              className="w-full px-2.5 py-1.5 bg-forge-bg border border-forge-border/50 rounded text-xs text-white placeholder-forge-muted focus:outline-none" />
            <input type="number" value={transferAmount} onChange={(e) => setTransferAmount(e.target.value)}
              placeholder="Amount"
              className="w-full px-2.5 py-1.5 bg-forge-bg border border-forge-border/50 rounded text-xs text-white placeholder-forge-muted focus:outline-none" />
            <button onClick={handleSafeTransfer} disabled={txStatus.status === 'pending'}
              className="w-full py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded text-[10px] font-medium disabled:opacity-50">
              Transfer
            </button>
          </div>

          {/* Batch Transfer */}
          <div className="p-3 rounded-lg bg-forge-bg/50 border border-forge-border/30 space-y-2">
            <div className="flex items-center gap-1.5">
              <Package className="w-3 h-3 text-rose-400" />
              <span className="text-[10px] font-medium text-rose-400">Batch Transfer</span>
            </div>
            <input type="text" value={batchTransferFrom} onChange={(e) => setBatchTransferFrom(e.target.value)}
              placeholder="From (0x...)"
              className="w-full px-2.5 py-1.5 bg-forge-bg border border-forge-border/50 rounded text-xs text-white placeholder-forge-muted focus:outline-none" />
            <input type="text" value={batchTransferTo} onChange={(e) => setBatchTransferTo(e.target.value)}
              placeholder="To (0x...)"
              className="w-full px-2.5 py-1.5 bg-forge-bg border border-forge-border/50 rounded text-xs text-white placeholder-forge-muted focus:outline-none" />
            <input type="text" value={batchTokenIds} onChange={(e) => setBatchTokenIds(e.target.value)}
              placeholder="Token IDs (1, 2, 3)"
              className="w-full px-2.5 py-1.5 bg-forge-bg border border-forge-border/50 rounded text-xs text-white placeholder-forge-muted focus:outline-none" />
            <input type="text" value={batchAmounts} onChange={(e) => setBatchAmounts(e.target.value)}
              placeholder="Amounts (10, 20, 30)"
              className="w-full px-2.5 py-1.5 bg-forge-bg border border-forge-border/50 rounded text-xs text-white placeholder-forge-muted focus:outline-none" />
            <button onClick={handleBatchTransfer} disabled={txStatus.status === 'pending'}
              className="w-full py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded text-[10px] font-medium disabled:opacity-50">
              Batch Transfer
            </button>
          </div>

          {/* Set Approval For All */}
          <div className="p-3 rounded-lg bg-forge-bg/50 border border-forge-border/30 space-y-2">
            <div className="flex items-center gap-1.5">
              <Shield className="w-3 h-3 text-blue-400" />
              <span className="text-[10px] font-medium text-blue-400">Set Approval For All</span>
            </div>
            <input type="text" value={operatorAddress} onChange={(e) => setOperatorAddress(e.target.value)}
              placeholder="Operator (0x...)"
              className="w-full px-2.5 py-1.5 bg-forge-bg border border-forge-border/50 rounded text-xs text-white placeholder-forge-muted focus:outline-none" />
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={operatorApproved} onChange={(e) => setOperatorApproved(e.target.checked)}
                className="w-3.5 h-3.5 rounded bg-forge-bg border-forge-border" />
              <span className="text-[10px] text-forge-muted">Grant Approval</span>
            </label>
            <button onClick={handleSetApprovalForAll} disabled={txStatus.status === 'pending'}
              className="w-full py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded text-[10px] font-medium disabled:opacity-50">
              {operatorApproved ? 'Grant' : 'Revoke'} Access
            </button>
          </div>

          {/* Mint (to self) */}
          <div className="p-3 rounded-lg bg-forge-bg/50 border border-forge-border/30 space-y-2">
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-violet-400" />
              <span className="text-[10px] font-medium text-violet-400">Mint (to yourself)</span>
            </div>
            <input type="number" value={mintTokenId} onChange={(e) => setMintTokenId(e.target.value)}
              placeholder="Token ID"
              className="w-full px-2.5 py-1.5 bg-forge-bg border border-forge-border/50 rounded text-xs text-white placeholder-forge-muted focus:outline-none" />
            <input type="number" value={mintAmount} onChange={(e) => setMintAmount(e.target.value)}
              placeholder="Amount"
              className="w-full px-2.5 py-1.5 bg-forge-bg border border-forge-border/50 rounded text-xs text-white placeholder-forge-muted focus:outline-none" />
            <button onClick={handleMint} disabled={txStatus.status === 'pending'}
              className="w-full py-1.5 bg-violet-600 hover:bg-violet-500 text-white rounded text-[10px] font-medium disabled:opacity-50">
              Mint
            </button>
          </div>

          {/* Mint To */}
          <div className="p-3 rounded-lg bg-forge-bg/50 border border-forge-border/30 space-y-2">
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-fuchsia-400" />
              <span className="text-[10px] font-medium text-fuchsia-400">Mint To Address</span>
            </div>
            <input type="text" value={mintToAddress} onChange={(e) => setMintToAddress(e.target.value)}
              placeholder="To Address (0x...)"
              className="w-full px-2.5 py-1.5 bg-forge-bg border border-forge-border/50 rounded text-xs text-white placeholder-forge-muted focus:outline-none" />
            <input type="number" value={mintToTokenId} onChange={(e) => setMintToTokenId(e.target.value)}
              placeholder="Token ID"
              className="w-full px-2.5 py-1.5 bg-forge-bg border border-forge-border/50 rounded text-xs text-white placeholder-forge-muted focus:outline-none" />
            <input type="number" value={mintToAmount} onChange={(e) => setMintToAmount(e.target.value)}
              placeholder="Amount"
              className="w-full px-2.5 py-1.5 bg-forge-bg border border-forge-border/50 rounded text-xs text-white placeholder-forge-muted focus:outline-none" />
            <button onClick={handleMintTo} disabled={txStatus.status === 'pending'}
              className="w-full py-1.5 bg-fuchsia-600 hover:bg-fuchsia-500 text-white rounded text-[10px] font-medium disabled:opacity-50">
              Mint To
            </button>
          </div>

          {/* Burn */}
          <div className="p-3 rounded-lg bg-forge-bg/50 border border-forge-border/30 space-y-2">
            <div className="flex items-center gap-1.5">
              <Flame className="w-3 h-3 text-orange-400" />
              <span className="text-[10px] font-medium text-orange-400">Burn Tokens</span>
            </div>
            <input type="text" value={burnAccount} onChange={(e) => setBurnAccount(e.target.value)}
              placeholder="Account (0x...)"
              className="w-full px-2.5 py-1.5 bg-forge-bg border border-forge-border/50 rounded text-xs text-white placeholder-forge-muted focus:outline-none" />
            <input type="number" value={burnTokenId} onChange={(e) => setBurnTokenId(e.target.value)}
              placeholder="Token ID"
              className="w-full px-2.5 py-1.5 bg-forge-bg border border-forge-border/50 rounded text-xs text-white placeholder-forge-muted focus:outline-none" />
            <input type="number" value={burnAmount} onChange={(e) => setBurnAmount(e.target.value)}
              placeholder="Amount"
              className="w-full px-2.5 py-1.5 bg-forge-bg border border-forge-border/50 rounded text-xs text-white placeholder-forge-muted focus:outline-none" />
            <button onClick={handleBurn} disabled={txStatus.status === 'pending'}
              className="w-full py-1.5 bg-orange-600 hover:bg-orange-500 text-white rounded text-[10px] font-medium disabled:opacity-50">
              Burn
            </button>
          </div>
        </div>
      )}

      {/* Read Operations */}
      {isConnected && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <ArrowRightLeft className="w-3.5 h-3.5 text-purple-400" />
            <span className="text-xs font-medium text-white">Read Operations</span>
          </div>

          {/* Balance Of */}
          <div className="p-3 rounded-lg bg-forge-bg/50 border border-forge-border/30 space-y-2">
            <span className="text-[10px] font-medium text-amber-400">Balance Of</span>
            <input type="text" value={balanceCheckAddress} onChange={(e) => setBalanceCheckAddress(e.target.value)}
              placeholder="Account (0x...)"
              className="w-full px-2.5 py-1.5 bg-forge-bg border border-forge-border/50 rounded text-xs text-white placeholder-forge-muted focus:outline-none" />
            <input type="number" value={balanceCheckTokenId} onChange={(e) => setBalanceCheckTokenId(e.target.value)}
              placeholder="Token ID"
              className="w-full px-2.5 py-1.5 bg-forge-bg border border-forge-border/50 rounded text-xs text-white placeholder-forge-muted focus:outline-none" />
            <button onClick={checkBalance}
              className="w-full py-1.5 bg-amber-600/50 hover:bg-amber-600 text-white rounded text-[10px] font-medium">
              Check Balance
            </button>
            {balanceCheckResult !== null && (
              <div className="p-2 bg-amber-500/10 border border-amber-500/30 rounded">
                <p className="text-[10px] text-amber-300">Balance: <span className="font-medium text-white">{balanceCheckResult}</span></p>
              </div>
            )}
          </div>

          {/* Total Supply */}
          <div className="p-3 rounded-lg bg-forge-bg/50 border border-forge-border/30 space-y-2">
            <span className="text-[10px] font-medium text-rose-400">Total Supply</span>
            <input type="number" value={totalSupplyTokenId} onChange={(e) => setTotalSupplyTokenId(e.target.value)}
              placeholder="Token ID"
              className="w-full px-2.5 py-1.5 bg-forge-bg border border-forge-border/50 rounded text-xs text-white placeholder-forge-muted focus:outline-none" />
            <button onClick={checkTotalSupply}
              className="w-full py-1.5 bg-rose-600/50 hover:bg-rose-600 text-white rounded text-[10px] font-medium">
              Check Supply
            </button>
            {totalSupplyResult !== null && (
              <div className="p-2 bg-rose-500/10 border border-rose-500/30 rounded">
                <p className="text-[10px] text-rose-300">Supply: <span className="font-medium text-white">{totalSupplyResult}</span></p>
              </div>
            )}
          </div>

          {/* Exists */}
          <div className="p-3 rounded-lg bg-forge-bg/50 border border-forge-border/30 space-y-2">
            <span className="text-[10px] font-medium text-cyan-400">Token Exists</span>
            <input type="number" value={existsTokenId} onChange={(e) => setExistsTokenId(e.target.value)}
              placeholder="Token ID"
              className="w-full px-2.5 py-1.5 bg-forge-bg border border-forge-border/50 rounded text-xs text-white placeholder-forge-muted focus:outline-none" />
            <button onClick={checkExists}
              className="w-full py-1.5 bg-cyan-600/50 hover:bg-cyan-600 text-white rounded text-[10px] font-medium">
              Check Exists
            </button>
            {existsResult !== null && (
              <div className={cn(
                'p-2 rounded border',
                existsResult ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-red-500/10 border-red-500/30'
              )}>
                <p className={cn('text-[10px] font-medium', existsResult ? 'text-emerald-300' : 'text-red-300')}>
                  {existsResult ? '✓ Token exists' : '✗ Token does not exist'}
                </p>
              </div>
            )}
          </div>

          {/* Is Approved For All */}
          <div className="p-3 rounded-lg bg-forge-bg/50 border border-forge-border/30 space-y-2">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3 h-3 text-blue-400" />
              <span className="text-[10px] font-medium text-blue-400">Is Approved For All</span>
            </div>
            <input type="text" value={approvalCheckOwner} onChange={(e) => setApprovalCheckOwner(e.target.value)}
              placeholder="Account (0x...)"
              className="w-full px-2.5 py-1.5 bg-forge-bg border border-forge-border/50 rounded text-xs text-white placeholder-forge-muted focus:outline-none" />
            <input type="text" value={approvalCheckOperator} onChange={(e) => setApprovalCheckOperator(e.target.value)}
              placeholder="Operator (0x...)"
              className="w-full px-2.5 py-1.5 bg-forge-bg border border-forge-border/50 rounded text-xs text-white placeholder-forge-muted focus:outline-none" />
            <button onClick={checkApprovalForAll}
              className="w-full py-1.5 bg-blue-600/50 hover:bg-blue-600 text-white rounded text-[10px] font-medium">
              Check Approval
            </button>
            {approvalCheckResult !== null && (
              <div className={cn(
                'p-2 rounded border',
                approvalCheckResult ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-red-500/10 border-red-500/30'
              )}>
                <p className={cn('text-[10px] font-medium', approvalCheckResult ? 'text-emerald-300' : 'text-red-300')}>
                  {approvalCheckResult ? '✓ Operator approved' : '✗ Operator not approved'}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
