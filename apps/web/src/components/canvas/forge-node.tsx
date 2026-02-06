'use client';

import { memo } from 'react';
import Image from 'next/image';
import { Handle, Position, type NodeProps } from 'reactflow';
import {
  Box, CreditCard, Bot, Layout, ShieldCheck, Trash2,
  Lock, Key, Wallet, Globe, ArrowLeftRight, Database,
  HardDrive, Layers, TrendingUp, Zap, Sparkles, Search,
  DollarSign, Fuel
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useBlueprintStore } from '@/store/blueprint';
import { nodeTypeToLabel, nodeTypeToColor } from '@/lib/utils';

import AaveLogo from '@/assets/blocks/Aave.svg';
import CompoundLogo from '@/assets/blocks/Compound.svg';
import ChainlinkLogo from '@/assets/blocks/Chainlink.svg';
import PythLogo from '@/assets/blocks/Pyth.svg';
import UniswapLogo from '@/assets/blocks/Uniswap.svg';
import CSLogo from '@/assets/blocks/CS_logo.png';
import AuditwareLogo from '@/assets/blocks/auditware.png';
import StylusLogo from '@/assets/blocks/stylus.svg';
import OstiumLogo from '@/assets/blocks/Ostium.svg';
import MaxxitLogo from '@/assets/blocks/MaxxitLogo.png';
import AIbotLogo from '@/assets/blocks/AIbot.png';
import WalletLogo from '@/assets/blocks/Wallet.svg';
import SuperpositionLogo from '@/assets/blocks/superposition.png';
import DuneLogo from '@/assets/blocks/dune.png';

/** Node types with custom logos (matches palette) */
const NODE_LOGO_MAP: Record<string, { src: typeof AaveLogo; alt: string }> = {
  'aave-lending': { src: AaveLogo, alt: 'Aave' },
  'compound-lending': { src: CompoundLogo, alt: 'Compound' },
  'chainlink-price-feed': { src: ChainlinkLogo, alt: 'Chainlink' },
  'pyth-oracle': { src: PythLogo, alt: 'Pyth' },
  'uniswap-swap': { src: UniswapLogo, alt: 'Uniswap' },
  'smartcache-caching': { src: CSLogo, alt: 'SmartCache' },
  'auditware-analyzing': { src: AuditwareLogo, alt: 'Auditware' },
  'erc20-stylus': { src: StylusLogo, alt: 'Stylus' },
  'erc721-stylus': { src: StylusLogo, alt: 'Stylus' },
  'erc1155-stylus': { src: StylusLogo, alt: 'Stylus' },
  'stylus-contract': { src: StylusLogo, alt: 'Stylus' },
  'stylus-zk-contract': { src: StylusLogo, alt: 'Stylus' },
  'stylus-rust-contract': { src: StylusLogo, alt: 'Stylus' },
  'ostium-trading': { src: OstiumLogo, alt: 'Ostium' },
  'maxxit': { src: MaxxitLogo, alt: 'Maxxit' },
  'erc8004-agent-runtime': { src: AIbotLogo, alt: 'AIbot' },
  'onchain-activity': { src: WalletLogo, alt: 'Wallet' },
};

const iconMap: Record<string, typeof Box> = {
  'stylus-contract': Box,
  'stylus-zk-contract': Lock,
  'stylus-rust-contract': Box,
  'smartcache-caching': Database,
  'auditware-analyzing': ShieldCheck,
  'x402-paywall-api': CreditCard,
  'erc8004-agent-runtime': Bot,
  'repo-quality-gates': ShieldCheck,
  'frontend-scaffold': Layout,
  'sdk-generator': Layout,
  'eip7702-smart-eoa': Key,
  'wallet-auth': Wallet,
  'rpc-provider': Globe,
  'arbitrum-bridge': ArrowLeftRight,
  'chain-data': Database,
  'ipfs-storage': HardDrive,
  'chain-abstraction': Layers,
  'zk-primitives': Lock,
  'ostium-trading': TrendingUp,
  'maxxit': Bot,
  'aixbt-momentum': TrendingUp,
  'aixbt-signals': Zap,
  'aixbt-indigo': Sparkles,
  'aixbt-observer': Search,
  // Dune Analytics
  'dune-execute-sql': Database,
  'dune-token-price': DollarSign,
  'dune-wallet-balances': Wallet,
  'dune-dex-volume': TrendingUp,
  'dune-nft-floor': Sparkles,
  'dune-address-labels': Key,
  'dune-transaction-history': Database,
  'dune-gas-price': Fuel,
  'dune-protocol-tvl': Lock,
};

const colorMap: Record<string, {
  bg: string;
  border: string;
  borderSelected: string;
  text: string;
  glow: string;
  accent: string;
}> = {
  'node-contracts': {
    bg: 'from-cyan-500/15 via-cyan-500/5 to-transparent',
    border: 'border-cyan-500/20',
    borderSelected: 'border-cyan-400/60',
    text: 'text-cyan-400',
    glow: 'shadow-[0_0_30px_-5px] shadow-cyan-500/30',
    accent: 'bg-cyan-500',
  },
  'node-payments': {
    bg: 'from-amber-500/15 via-amber-500/5 to-transparent',
    border: 'border-amber-500/20',
    borderSelected: 'border-amber-400/60',
    text: 'text-amber-400',
    glow: 'shadow-[0_0_30px_-5px] shadow-amber-500/30',
    accent: 'bg-amber-500',
  },
  'node-agents': {
    bg: 'from-fuchsia-500/15 via-fuchsia-500/5 to-transparent',
    border: 'border-fuchsia-500/20',
    borderSelected: 'border-fuchsia-400/60',
    text: 'text-fuchsia-400',
    glow: 'shadow-[0_0_30px_-5px] shadow-fuchsia-500/30',
    accent: 'bg-fuchsia-500',
  },
  'node-app': {
    bg: 'from-emerald-500/15 via-emerald-500/5 to-transparent',
    border: 'border-emerald-500/20',
    borderSelected: 'border-emerald-400/60',
    text: 'text-emerald-400',
    glow: 'shadow-[0_0_30px_-5px] shadow-emerald-500/30',
    accent: 'bg-emerald-500',
  },
  'node-quality': {
    bg: 'from-rose-500/15 via-rose-500/5 to-transparent',
    border: 'border-rose-500/20',
    borderSelected: 'border-rose-400/60',
    text: 'text-rose-400',
    glow: 'shadow-[0_0_30px_-5px] shadow-rose-500/30',
    accent: 'bg-rose-500',
  },
  'node-intelligence': {
    bg: 'from-purple-500/15 via-purple-500/5 to-transparent',
    border: 'border-purple-500/20',
    borderSelected: 'border-purple-400/60',
    text: 'text-purple-400',
    glow: 'shadow-[0_0_30_px_-5px] shadow-purple-500/30',
    accent: 'bg-purple-500',
  },
  'accent-purple': {
    bg: 'from-violet-500/15 via-violet-500/5 to-transparent',
    border: 'border-violet-500/20',
    borderSelected: 'border-violet-400/60',
    text: 'text-violet-400',
    glow: 'shadow-[0_0_30px_-5px] shadow-violet-500/30',
    accent: 'bg-violet-500',
  },
  'accent-cyan': {
    bg: 'from-cyan-500/15 via-cyan-500/5 to-transparent',
    border: 'border-cyan-500/20',
    borderSelected: 'border-cyan-400/60',
    text: 'text-cyan-400',
    glow: 'shadow-[0_0_30px_-5px] shadow-cyan-500/30',
    accent: 'bg-cyan-500',
  },
};

function ForgeNodeComponent({ id, data, selected }: NodeProps) {
  const { selectedNodeId, removeNode } = useBlueprintStore();
  const nodeType = data.nodeType as string;
  const colorClass = nodeTypeToColor(nodeType);
  const colors = colorMap[colorClass] || colorMap['node-contracts'];
  const Icon = iconMap[nodeType] || Box;
  const logoInfo = NODE_LOGO_MAP[nodeType];
  const isSelected = selected || selectedNodeId === id;

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    removeNode(id);
  };

  // Check if there's extra context to show
  const hasExtraInfo = (
    (nodeType === 'stylus-contract' && (data.contractName || data.contractInstructions)) ||
    (nodeType === 'x402-paywall-api' && data.currency) ||
    (nodeType === 'erc8004-agent-runtime' && data.modelProvider) ||
    nodeType === 'ostium-trading' ||
    nodeType === 'maxxit'
  );

  return (
    <div
      className={cn(
        'group relative w-[180px] rounded-xl border backdrop-blur-md',
        'bg-gradient-to-br bg-forge-surface/90',
        'transition-all duration-200 ease-out',
        isSelected ? cn(colors.borderSelected, 'border-2') : cn(colors.border, 'border'),
        isSelected && colors.glow,
        !isSelected && 'hover:scale-[1.01] hover:border-opacity-60'
      )}
    >
      {/* Gradient overlay */}
      <div className={cn(
        'absolute inset-0 rounded-xl bg-gradient-to-br opacity-40',
        colors.bg
      )} />

      {/* Top accent line */}
      <div className={cn(
        'absolute top-0 left-3 right-3 h-[1.5px] rounded-full',
        colors.accent,
        'opacity-50'
      )} />

      {/* Input handle */}
      <Handle
        type="target"
        position={Position.Left}
        className={cn(
          '!w-3 !h-3 !-left-1.5 !border-2 !rounded-full',
          '!bg-forge-bg !border-forge-border',
          'hover:!border-white/50 transition-colors duration-200',
          isSelected && '!border-white/40'
        )}
      />

      {/* Node content */}
      <div className="relative p-2.5">
        <div className="flex items-center gap-2">
          {/* Icon / Logo container */}
          <div
            className={cn(
              'relative w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden',
              'bg-forge-bg/70 border border-white/5',
              'group-hover:border-white/10 transition-colors duration-200'
            )}
          >
            {logoInfo ? (
              <Image
                src={logoInfo.src}
                alt={logoInfo.alt}
                fill
                className="object-contain p-0.5"
                unoptimized
              />
            ) : (
              <Icon className={cn('w-4 h-4', colors.text)} />
            )}
          </div>

          {/* Label */}
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-white truncate leading-tight">
              {data.label || data.contractName || data.agentName || nodeTypeToLabel(nodeType)}
            </p>
            <p className={cn('text-[10px] truncate mt-0.5 font-medium', colors.text, 'opacity-70')}>
              {nodeTypeToLabel(nodeType)}
            </p>
          </div>

          {/* Delete button */}
          <button
            onClick={handleDelete}
            className={cn(
              'p-1 rounded-md text-forge-muted transition-all duration-200',
              'hover:bg-red-500/20 hover:text-red-400',
              'opacity-0 group-hover:opacity-100',
              isSelected && 'opacity-100'
            )}
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>

        {/* Tags - only show if there's relevant data */}
        {hasExtraInfo && (
          <div className="mt-2 flex flex-wrap gap-1">
            {nodeType === 'stylus-contract' && (data.contractName || data.contractInstructions) && (
              <span className={cn(
                'text-[9px] px-1.5 py-0.5 rounded font-mono tracking-wide truncate max-w-[100px]',
                'bg-forge-bg/50 border border-white/5',
                colors.text
              )} title={data.contractInstructions as string}>
                {String(data.contractName || 'Stylus')}
              </span>
            )}

            {nodeType === 'x402-paywall-api' && data.currency && (
              <span className={cn(
                'text-[9px] px-1.5 py-0.5 rounded font-mono uppercase tracking-wide',
                'bg-forge-bg/50 border border-white/5',
                colors.text
              )}>
                {data.currency}
              </span>
            )}

            {nodeType === 'erc8004-agent-runtime' && data.modelProvider && (
              <span className={cn(
                'text-[9px] px-1.5 py-0.5 rounded font-mono tracking-wide',
                'bg-forge-bg/50 border border-white/5',
                colors.text
              )}>
                {data.modelProvider}
              </span>
            )}

            {nodeType === 'ostium-trading' && (
              <span className={cn(
                'text-[9px] px-1.5 py-0.5 rounded font-mono uppercase tracking-wide',
                'bg-forge-bg/50 border border-white/5',
                colors.text
              )}>
                {data.network || 'arbitrum'}
              </span>
            )}

            {nodeType === 'maxxit' && (
              <span className={cn(
                'text-[9px] px-1.5 py-0.5 rounded font-mono uppercase tracking-wide',
                'bg-forge-bg/50 border border-white/5',
                data.setupComplete || data.linkedStatus === 'LINKED'
                  ? 'text-green-400'
                  : colors.text
              )}>
                {data.setupComplete || data.linkedStatus === 'LINKED'
                  ? 'LINKED'
                  : data.linkedStatus || 'NOT LINKED'}
              </span>
            )}
          </div>
        )}

        {/* Subtle ID indicator - now inline and smaller */}
        <div className="mt-1.5 flex items-center">
          <span className="text-[8px] px-1 py-0.5 rounded font-mono text-forge-muted/40 bg-forge-bg/20">
            {id.slice(0, 6)}
          </span>
        </div>
      </div>

      {/* Output handle */}
      <Handle
        type="source"
        position={Position.Right}
        className={cn(
          '!w-3 !h-3 !-right-1.5 !border-2 !rounded-full',
          '!bg-forge-bg !border-forge-border',
          'hover:!border-white/50 transition-colors duration-200',
          isSelected && '!border-white/40'
        )}
      />

      {/* Selection indicator ring - subtle glow effect */}
      {isSelected && (
        <div className={cn(
          'absolute -inset-0.5 rounded-[14px] border pointer-events-none',
          'border-white/15'
        )} />
      )}
    </div>
  );
}

export const ForgeNode = memo(ForgeNodeComponent);

