'use client';

import { memo } from 'react';
import { Handle, Position, type NodeProps } from 'reactflow';
import { motion } from 'framer-motion';
import {
  Box, CreditCard, Bot, Layout, ShieldCheck, Trash2,
  Lock, Key, Wallet, Globe, ArrowLeftRight, Database,
  HardDrive, Layers, TrendingUp, Zap, Sparkles, Search,
  DollarSign, Fuel, Send
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useBlueprintStore } from '@/store/blueprint';
import { nodeTypeToLabel, nodeTypeToColor } from '@/lib/utils';

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
  // Telegram
  'telegram-notifications': Send,
  'telegram-commands': Send,
  'telegram-wallet-link': Send,
  'telegram-ai-agent': Send,
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

/**
 * Node color mapping - Modern, refined palette
 * Each category has consistent, muted colors with enhanced selection states
 */
type NodeColorScheme = {
  bgGradient: string;
  iconBg: string;
  border: string;
  borderHover: string;
  borderSelected: string;
  text: string;
  glow: string;
  accentBar: string;
  handleActive: string;
};

const colorMap: Record<string, NodeColorScheme> = {
  'node-contracts': {
    bgGradient: 'from-[hsl(200_55%_50%/0.08)] via-transparent to-transparent',
    iconBg: 'bg-[hsl(200_55%_50%/0.12)]',
    border: 'border-[hsl(200_55%_50%/0.18)]',
    borderHover: 'hover:border-[hsl(200_55%_50%/0.35)]',
    borderSelected: 'border-[hsl(200_55%_50%/0.55)]',
    text: 'text-[hsl(200_55%_55%)]',
    glow: 'shadow-[0_0_20px_-4px_hsl(200_55%_50%/0.3),_0_0_6px_-1px_hsl(200_55%_50%/0.2)]',
    accentBar: 'bg-gradient-to-r from-[hsl(200_55%_50%/0.6)] via-[hsl(200_55%_50%/0.3)] to-transparent',
    handleActive: '!border-[hsl(200_55%_50%/0.6)]',
  },
  'node-payments': {
    bgGradient: 'from-[hsl(38_60%_50%/0.08)] via-transparent to-transparent',
    iconBg: 'bg-[hsl(38_60%_50%/0.12)]',
    border: 'border-[hsl(38_60%_50%/0.18)]',
    borderHover: 'hover:border-[hsl(38_60%_50%/0.35)]',
    borderSelected: 'border-[hsl(38_60%_50%/0.55)]',
    text: 'text-[hsl(38_60%_55%)]',
    glow: 'shadow-[0_0_20px_-4px_hsl(38_60%_50%/0.3),_0_0_6px_-1px_hsl(38_60%_50%/0.2)]',
    accentBar: 'bg-gradient-to-r from-[hsl(38_60%_50%/0.6)] via-[hsl(38_60%_50%/0.3)] to-transparent',
    handleActive: '!border-[hsl(38_60%_50%/0.6)]',
  },
  'node-agents': {
    bgGradient: 'from-[hsl(285_45%_52%/0.08)] via-transparent to-transparent',
    iconBg: 'bg-[hsl(285_45%_52%/0.12)]',
    border: 'border-[hsl(285_45%_52%/0.18)]',
    borderHover: 'hover:border-[hsl(285_45%_52%/0.35)]',
    borderSelected: 'border-[hsl(285_45%_52%/0.55)]',
    text: 'text-[hsl(285_45%_55%)]',
    glow: 'shadow-[0_0_20px_-4px_hsl(285_45%_52%/0.3),_0_0_6px_-1px_hsl(285_45%_52%/0.2)]',
    accentBar: 'bg-gradient-to-r from-[hsl(285_45%_52%/0.6)] via-[hsl(285_45%_52%/0.3)] to-transparent',
    handleActive: '!border-[hsl(285_45%_52%/0.6)]',
  },
  'node-app': {
    bgGradient: 'from-[hsl(152_45%_45%/0.08)] via-transparent to-transparent',
    iconBg: 'bg-[hsl(152_45%_45%/0.12)]',
    border: 'border-[hsl(152_45%_45%/0.18)]',
    borderHover: 'hover:border-[hsl(152_45%_45%/0.35)]',
    borderSelected: 'border-[hsl(152_45%_45%/0.55)]',
    text: 'text-[hsl(152_45%_50%)]',
    glow: 'shadow-[0_0_20px_-4px_hsl(152_45%_45%/0.3),_0_0_6px_-1px_hsl(152_45%_45%/0.2)]',
    accentBar: 'bg-gradient-to-r from-[hsl(152_45%_45%/0.6)] via-[hsl(152_45%_45%/0.3)] to-transparent',
    handleActive: '!border-[hsl(152_45%_45%/0.6)]',
  },
  'node-quality': {
    bgGradient: 'from-[hsl(0_50%_52%/0.08)] via-transparent to-transparent',
    iconBg: 'bg-[hsl(0_50%_52%/0.12)]',
    border: 'border-[hsl(0_50%_52%/0.18)]',
    borderHover: 'hover:border-[hsl(0_50%_52%/0.35)]',
    borderSelected: 'border-[hsl(0_50%_52%/0.55)]',
    text: 'text-[hsl(0_50%_55%)]',
    glow: 'shadow-[0_0_20px_-4px_hsl(0_50%_52%/0.3),_0_0_6px_-1px_hsl(0_50%_52%/0.2)]',
    accentBar: 'bg-gradient-to-r from-[hsl(0_50%_52%/0.6)] via-[hsl(0_50%_52%/0.3)] to-transparent',
    handleActive: '!border-[hsl(0_50%_52%/0.6)]',
  },
  'node-intelligence': {
    bgGradient: 'from-[hsl(255_45%_55%/0.08)] via-transparent to-transparent',
    iconBg: 'bg-[hsl(255_45%_55%/0.12)]',
    border: 'border-[hsl(255_45%_55%/0.18)]',
    borderHover: 'hover:border-[hsl(255_45%_55%/0.35)]',
    borderSelected: 'border-[hsl(255_45%_55%/0.55)]',
    text: 'text-[hsl(255_45%_58%)]',
    glow: 'shadow-[0_0_20px_-4px_hsl(255_45%_55%/0.3),_0_0_6px_-1px_hsl(255_45%_55%/0.2)]',
    accentBar: 'bg-gradient-to-r from-[hsl(255_45%_55%/0.6)] via-[hsl(255_45%_55%/0.3)] to-transparent',
    handleActive: '!border-[hsl(255_45%_55%/0.6)]',
  },
  'node-telegram': {
    bgGradient: 'from-[hsl(200_70%_45%/0.08)] via-transparent to-transparent',
    iconBg: 'bg-[hsl(200_70%_45%/0.12)]',
    border: 'border-[hsl(200_70%_45%/0.18)]',
    borderHover: 'hover:border-[hsl(200_70%_45%/0.35)]',
    borderSelected: 'border-[hsl(200_70%_45%/0.55)]',
    text: 'text-[hsl(200_70%_48%)]',
    glow: 'shadow-[0_0_20px_-4px_hsl(200_70%_45%/0.3),_0_0_6px_-1px_hsl(200_70%_45%/0.2)]',
    accentBar: 'bg-gradient-to-r from-[hsl(200_70%_45%/0.6)] via-[hsl(200_70%_45%/0.3)] to-transparent',
    handleActive: '!border-[hsl(200_70%_45%/0.6)]',
  },
  // Fallback for legacy types
  'accent-purple': {
    bgGradient: 'from-[hsl(255_45%_55%/0.08)] via-transparent to-transparent',
    iconBg: 'bg-[hsl(255_45%_55%/0.12)]',
    border: 'border-[hsl(255_45%_55%/0.18)]',
    borderHover: 'hover:border-[hsl(255_45%_55%/0.35)]',
    borderSelected: 'border-[hsl(255_45%_55%/0.55)]',
    text: 'text-[hsl(255_45%_58%)]',
    glow: 'shadow-[0_0_20px_-4px_hsl(255_45%_55%/0.3),_0_0_6px_-1px_hsl(255_45%_55%/0.2)]',
    accentBar: 'bg-gradient-to-r from-[hsl(255_45%_55%/0.6)] via-[hsl(255_45%_55%/0.3)] to-transparent',
    handleActive: '!border-[hsl(255_45%_55%/0.6)]',
  },
  'accent-cyan': {
    bgGradient: 'from-[hsl(18_76%_55%/0.08)] via-transparent to-transparent',
    iconBg: 'bg-[hsl(18_76%_55%/0.12)]',
    border: 'border-[hsl(18_76%_55%/0.18)]',
    borderHover: 'hover:border-[hsl(18_76%_55%/0.35)]',
    borderSelected: 'border-[hsl(18_76%_55%/0.55)]',
    text: 'text-[hsl(18_76%_58%)]',
    glow: 'shadow-[0_0_20px_-4px_hsl(18_76%_55%/0.3),_0_0_6px_-1px_hsl(18_76%_55%/0.2)]',
    accentBar: 'bg-gradient-to-r from-[hsl(18_76%_55%/0.6)] via-[hsl(18_76%_55%/0.3)] to-transparent',
    handleActive: '!border-[hsl(18_76%_55%/0.6)]',
  },
};

function ForgeNodeComponent({ id, data, selected }: NodeProps) {
  const { selectedNodeId, removeNode } = useBlueprintStore();
  const nodeType = data.nodeType as string;
  const colorClass = nodeTypeToColor(nodeType);
  const colors = colorMap[colorClass] || colorMap['node-contracts'];
  const Icon = iconMap[nodeType] || Box;
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
    <motion.div
      initial={false}
      animate={{
        scale: isSelected ? 1.02 : 1,
        y: isSelected ? -2 : 0,
      }}
      transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        'group relative w-[200px] rounded-xl border-[1.5px]',
        'bg-[hsl(var(--color-bg-muted))]',
        'transition-all duration-200 ease-out',
        isSelected ? colors.borderSelected : colors.border,
        isSelected && colors.glow,
        !isSelected && colors.borderHover,
        !isSelected && 'hover:shadow-md'
      )}
    >
      {/* Gradient overlay - stronger when selected */}
      <div className={cn(
        'absolute inset-0 rounded-xl bg-gradient-to-br transition-opacity duration-200',
        colors.bgGradient,
        isSelected ? 'opacity-100' : 'opacity-60'
      )} />

      {/* Top accent bar - animated on selection */}
      <motion.div
        initial={false}
        animate={{
          scaleX: isSelected ? 1 : 0.6,
          opacity: isSelected ? 1 : 0.5,
        }}
        transition={{ duration: 0.2 }}
        className={cn(
          'absolute top-0 left-4 right-4 h-[2px] rounded-full origin-left',
          colors.accentBar
        )}
      />

      {/* Input handle */}
      <Handle
        type="target"
        position={Position.Left}
        className={cn(
          '!w-3.5 !h-3.5 !-left-[7px] !border-2 !rounded-full',
          '!bg-[hsl(var(--color-bg-elevated))]',
          '!border-[hsl(var(--color-border-default))]',
          'hover:!border-[hsl(var(--color-border-strong))]',
          'hover:!scale-110',
          'transition-all duration-150',
          isSelected && colors.handleActive
        )}
      />

      {/* Node content */}
      <div className="relative p-3">
        <div className="flex items-start gap-2.5">
          {/* Icon container - enhanced for selected state */}
          <motion.div
            initial={false}
            animate={{
              scale: isSelected ? 1.05 : 1,
            }}
            transition={{ duration: 0.15 }}
            className={cn(
              'w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0',
              colors.iconBg,
              'border border-[hsl(var(--color-border-subtle))]',
              'transition-all duration-200',
              isSelected && 'border-transparent'
            )}
          >
            <Icon className={cn('w-4.5 h-4.5', colors.text)} />
          </motion.div>

          {/* Label section */}
          <div className="flex-1 min-w-0 pt-0.5">
            <p className={cn(
              'text-[13px] font-semibold truncate leading-tight',
              'text-[hsl(var(--color-text-primary))]',
              'transition-colors duration-200'
            )}>
              {data.label || data.contractName || data.agentName || nodeTypeToLabel(nodeType)}
            </p>
            <p className={cn(
              'text-[10px] truncate mt-1 font-medium tracking-wide',
              colors.text,
              isSelected ? 'opacity-90' : 'opacity-65'
            )}>
              {nodeTypeToLabel(nodeType)}
            </p>
          </div>

          {/* Delete button */}
          <button
            onClick={handleDelete}
            className={cn(
              'p-1.5 rounded-md transition-all duration-150',
              'text-[hsl(var(--color-text-muted))]',
              'hover:bg-[hsl(var(--color-error)/0.12)] hover:text-[hsl(var(--color-error))]',
              'opacity-0 group-hover:opacity-100 -mt-0.5',
              isSelected && 'opacity-80'
            )}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Tags - only show if there's relevant data */}
        {hasExtraInfo && (
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {nodeType === 'stylus-contract' && (data.contractName || data.contractInstructions) && (
              <span className={cn(
                'text-[9px] px-2 py-0.5 rounded-md font-mono tracking-wide truncate max-w-[120px]',
                'bg-[hsl(var(--color-bg-base)/0.6)] border border-[hsl(var(--color-border-subtle))]',
                colors.text
              )} title={data.contractInstructions as string}>
                {String(data.contractName || 'Stylus')}
              </span>
            )}

            {nodeType === 'x402-paywall-api' && data.currency && (
              <span className={cn(
                'text-[9px] px-2 py-0.5 rounded-md font-mono uppercase tracking-wider',
                'bg-[hsl(var(--color-bg-base)/0.6)] border border-[hsl(var(--color-border-subtle))]',
                colors.text
              )}>
                {data.currency}
              </span>
            )}

            {nodeType === 'erc8004-agent-runtime' && data.modelProvider && (
              <span className={cn(
                'text-[9px] px-2 py-0.5 rounded-md font-mono tracking-wide',
                'bg-[hsl(var(--color-bg-base)/0.6)] border border-[hsl(var(--color-border-subtle))]',
                colors.text
              )}>
                {data.modelProvider}
              </span>
            )}

            {nodeType === 'ostium-trading' && (
              <span className={cn(
                'text-[9px] px-2 py-0.5 rounded-md font-mono uppercase tracking-wider',
                'bg-[hsl(var(--color-bg-base)/0.6)] border border-[hsl(var(--color-border-subtle))]',
                colors.text
              )}>
                {data.network || 'arbitrum'}
              </span>
            )}

            {nodeType === 'maxxit' && (
              <span className={cn(
                'text-[9px] px-2 py-0.5 rounded-md font-mono uppercase tracking-wider',
                'bg-[hsl(var(--color-bg-base)/0.6)] border border-[hsl(var(--color-border-subtle))]',
                data.setupComplete || data.linkedStatus === 'LINKED'
                  ? 'text-[hsl(var(--color-success))]'
                  : colors.text
              )}>
                {data.setupComplete || data.linkedStatus === 'LINKED'
                  ? 'LINKED'
                  : data.linkedStatus || 'NOT LINKED'}
              </span>
            )}
          </div>
        )}

        {/* Node ID badge */}
        <div className="mt-2 flex items-center justify-between">
          <span className={cn(
            'text-[9px] px-1.5 py-0.5 rounded-md font-mono',
            'text-[hsl(var(--color-text-disabled))]',
            'bg-[hsl(var(--color-bg-base)/0.4)]'
          )}>
            {id.slice(0, 8)}
          </span>
        </div>
      </div>

      {/* Output handle */}
      <Handle
        type="source"
        position={Position.Right}
        className={cn(
          '!w-3.5 !h-3.5 !-right-[7px] !border-2 !rounded-full',
          '!bg-[hsl(var(--color-bg-elevated))]',
          '!border-[hsl(var(--color-border-default))]',
          'hover:!border-[hsl(var(--color-border-strong))]',
          'hover:!scale-110',
          'transition-all duration-150',
          isSelected && colors.handleActive
        )}
      />

      {/* Selection ring - subtle outer glow indicator */}
      {isSelected && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.15 }}
          className={cn(
            'absolute -inset-1 rounded-[16px] pointer-events-none',
            'border border-[hsl(var(--color-border-focus)/0.3)]'
          )}
        />
      )}
    </motion.div>
  );
}

export const ForgeNode = memo(ForgeNodeComponent);
