'use client';

import Image from 'next/image';
import { useState, useMemo, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Box,
  CreditCard,
  Bot,
  Layout,
  ShieldCheck,
  Search,
  Wallet,
  Globe,
  Database,
  HardDrive,
  Layers,
  Lock,
  Link,
  ArrowLeftRight,
  Key,
  Sparkles,
  X,
  TrendingUp,
  Zap,
  Coins,
  Star,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAccount } from 'wagmi';
import { useAuthGuard } from '@/components/auth/auth-guard';
import { useAuthStore } from '@/store/auth';
import {
  CATEGORY_DEFINITIONS,
  PLUGIN_REGISTRY,
  getPluginsByCategory,
  type PluginIcon,
  type PluginRegistryEntry,
} from '@cradle/plugin-config';
import { useSuggestedPlugins } from '@/hooks/use-suggested-plugins';
import { useBlueprintStore } from '@/store/blueprint';
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
import WalletLogoSvg from '@/assets/blocks/Wallet.svg';
import WalletLogoPng from '@/assets/blocks/Wallet.png';
import SuperpositionLogo from '@/assets/blocks/superposition.png';
import DuneLogo from '@/assets/blocks/dune.png';
import AixbtLogo from '@/assets/blocks/aixbt.png';
import TelegramLogo from '@/assets/blocks/Telegram.jpg';
import IpfsLogo from '@/assets/blocks/Ipfs.svg';
import PaymentLogo from '@/assets/blocks/payment.png';
import ArbitrumLogo from '@/assets/blocks/arbitrum.svg';
import NextjsLogo from '@/assets/blocks/Nextjs.png';


/**
 * Centralized logo asset mapping
 * Maps logoAsset filenames (from plugin registry) to actual imported assets
 */
const LOGO_ASSETS: Record<string, any> = {
  // Protocol logos
  'Aave.svg': AaveLogo,
  'Compound.svg': CompoundLogo,
  'Chainlink.svg': ChainlinkLogo,
  'Pyth.svg': PythLogo,
  'Uniswap.svg': UniswapLogo,
  // Contract logos
  'CS_logo.png': CSLogo,
  'auditware.png': AuditwareLogo,
  'stylus.svg': StylusLogo,
  // Agent logos
  'Ostium.svg': OstiumLogo,
  'MaxxitLogo.png': MaxxitLogo,
  'AIbot.png': AIbotLogo,
  'Wallet.svg': WalletLogoSvg,
  'Wallet.png': WalletLogoPng,
  // Superposition logos
  'superposition.png': SuperpositionLogo,
  // Dune logos
  'dune.png': DuneLogo,
  // Intelligence logos
  'aixbt.png': AixbtLogo,
  // Telegram logos
  'Telegram.jpg': TelegramLogo,
  // Application logos
  'Ipfs.svg': IpfsLogo,
  'payment.png': PaymentLogo,
  'arbitrum.svg': ArbitrumLogo,
  'Nextjs.png': NextjsLogo,
};

/**
 * Get logo asset from plugin's logoAsset field
 */
function getLogoAsset(logoAsset?: string): any | null {
  if (!logoAsset) return null;
  return LOGO_ASSETS[logoAsset] || null;
}


/**
 * Map icon names to Lucide components
 */
const ICON_MAP: Record<PluginIcon, LucideIcon> = {
  Box,
  CreditCard,
  Bot,
  Layout,
  ShieldCheck,
  Wallet,
  Globe,
  Database,
  HardDrive,
  Layers,
  Lock,
  Link,
  ArrowLeftRight,
  Key,
  Sparkles,
  TrendingUp,
  Zap,
  Coins,
  Search,
};

/**
 * Get Lucide icon component from icon name
 */
function getIconComponent(iconName: PluginIcon): LucideIcon {
  return ICON_MAP[iconName] || Box;
}

interface NodeCategory {
  id: string;
  name: string;
  icon: LucideIcon;
  color: string;
  plugins: PluginRegistryEntry[];
}

/**
 * Build categories from centralized registry
 */
function buildCategories(): NodeCategory[] {
  return CATEGORY_DEFINITIONS.map((cat) => ({
    id: cat.id,
    name: cat.name,
    icon: getIconComponent(cat.icon),
    color: cat.color,
    plugins: getPluginsByCategory(cat.id),
  }));
}

export function NodePalette() {
  const [searchQuery, setSearchQuery] = useState('');
  const { isConnected } = useAccount();
  const { isWalletConnected, isFullyAuthenticated } = useAuthGuard();
  const { showAuthModal, openAuthModal, closeAuthModal } = useAuthStore();

  const categories = useMemo(() => buildCategories(), []);
  const { suggestions, hasSuggestions } = useSuggestedPlugins();
  const addNode = useBlueprintStore((state) => state.addNode);

  const [favorites, setFavorites] = useState<Set<string>>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('cradle-favorite-nodes');
      return stored ? new Set(JSON.parse(stored)) : new Set();
    }
    return new Set();
  });

  useEffect(() => {
    localStorage.setItem('cradle-favorite-nodes', JSON.stringify([...favorites]));
  }, [favorites]);

  const toggleFavorite = useCallback((pluginId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setFavorites(prev => {
      const next = new Set(prev);
      if (next.has(pluginId)) {
        next.delete(pluginId);
      } else {
        next.add(pluginId);
      }
      return next;
    });
  }, []);

  const onDragStart = (event: React.DragEvent, nodeType: string) => {
    const walletConnected = isConnected || isWalletConnected;
    if (!walletConnected) {
      event.preventDefault();
      openAuthModal();
      return;
    }
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  /* filteredCategories logic simplified */
  const filteredCategories = useMemo(() => {
    return categories.map(category => ({
      ...category,
      plugins: category.plugins.filter(
        plugin =>
          plugin.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          plugin.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          plugin.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      ),
    })).filter(category => category.plugins.length > 0 || searchQuery === '');
  }, [categories, searchQuery]);

  const contractsCategory = useMemo(
    () => filteredCategories.find((c) => c.id === 'contracts'),
    [filteredCategories]
  );

  const protocolsCategory = useMemo(
    () => filteredCategories.find((c) => c.id === 'protocols'),
    [filteredCategories]
  );

  const otherCategories = useMemo(
    () => filteredCategories.filter((c) => c.id !== 'contracts' && c.id !== 'protocols'),
    [filteredCategories]
  );


  return (
    <>
      <aside
        data-tour="palette"
        className="h-full border-r border-[hsl(var(--color-border-default))] bg-[hsl(var(--color-bg-subtle))] flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="p-4 border-b border-[hsl(var(--color-border-default))]">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="p-1.5 rounded-lg bg-[hsl(var(--color-accent-primary)/0.1)]">
              <Sparkles className="w-4 h-4 text-[hsl(var(--color-accent-primary))]" />
            </div>
            <h2 className="text-sm font-semibold text-[hsl(var(--color-text-primary))] tracking-wide">
              Components
            </h2>
          </div>

          {/* Search */}
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[hsl(var(--color-text-muted))] group-focus-within:text-[hsl(var(--color-accent-primary))] transition-colors" />
            <input
              type="text"
              placeholder="Search components..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={cn(
                "w-full pl-9 pr-8 py-2.5 text-sm",
                "bg-[hsl(var(--color-bg-base))] border border-[hsl(var(--color-border-default))]",
                "rounded-lg text-[hsl(var(--color-text-primary))]",
                "placeholder:text-[hsl(var(--color-text-muted))]",
                "focus:outline-none focus:border-[hsl(var(--color-accent-primary))]",
                "focus:ring-2 focus:ring-[hsl(var(--color-accent-primary)/0.15)]",
                "transition-all duration-150"
              )}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[hsl(var(--color-text-muted))] hover:text-[hsl(var(--color-text-primary))] transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {/* Contracts category first */}
          {contractsCategory && (
            <div className="space-y-2 mt-2">
              <div
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl',
                  'bg-forge-elevated/20'
                )}
              >
                <span className="text-sm font-medium text-white flex-1 text-left">
                  {contractsCategory.name}
                </span>
                <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-forge-elevated/60 text-forge-muted">
                  {contractsCategory.plugins.length}
                </span>
              </div>

              <div className="pb-2 pt-1">
                <div className="grid grid-cols-2 gap-2">
                  {contractsCategory.plugins.map((plugin, pluginIndex) => {
                    const PluginIcon = getIconComponent(plugin.icon);
                    const logoAsset = getLogoAsset(plugin.logoAsset);
                    return (
                      <motion.div
                        key={plugin.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: pluginIndex * 0.03 }}
                      >
                        <div
                          draggable
                          onDragStart={(e) => onDragStart(e, plugin.id)}
                          className={cn(
                            'group relative flex items-start gap-2 px-3 py-2 rounded-xl',
                            'bg-forge-bg/60 border border-forge-border/40',
                            'hover:border-accent-cyan/60 hover:bg-forge-elevated/70',
                            'cursor-grab active:cursor-grabbing transition-all duration-200'
                          )}
                        >
                          <div className="relative w-8 h-8 rounded-md overflow-hidden bg-black/20 shrink-0 flex items-center justify-center">
                            {logoAsset ? (
                              <Image
                                src={logoAsset}
                                alt={plugin.name}
                                fill
                                className="object-contain"
                                unoptimized
                              />
                            ) : (
                              <PluginIcon
                                className={cn('w-4 h-4 shrink-0', `text-${plugin.color}`)}
                              />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-white line-clamp-2 leading-tight">
                              {plugin.name}
                            </p>
                            {/* <p className="text-[10px] text-forge-muted truncate">
                              {plugin.description}
                            </p> */}
                          </div>
                          <button
                            onClick={(e) => toggleFavorite(plugin.id, e)}
                            className={cn(
                              'p-1 rounded shrink-0 transition-all opacity-0 group-hover:opacity-100',
                              favorites.has(plugin.id)
                                ? 'text-amber-400 opacity-100'
                                : 'text-forge-muted hover:text-amber-400'
                            )}
                            title={favorites.has(plugin.id) ? 'Remove from favorites' : 'Add to favorites'}
                          >
                            <Star className={cn('w-3.5 h-3.5', favorites.has(plugin.id) && 'fill-current')} />
                          </button>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}


          {/* Protocol plugins second */}
          {protocolsCategory && protocolsCategory.plugins.length > 0 && (
            <div className="space-y-3 mt-6">
              <div
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl',
                  'bg-forge-elevated/20'
                )}
              >
                <span className="text-sm font-medium text-white flex-1 text-left">
                  Protocol Plugins
                </span>
                <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-forge-elevated/60 text-forge-muted">
                  {protocolsCategory.plugins.length}
                </span>
              </div>

              <div className="pb-2 pt-1">
                <div className="grid grid-cols-2 gap-2">
                  {protocolsCategory.plugins.map((plugin, pluginIndex) => {
                    const PluginIcon = getIconComponent(plugin.icon);
                    const logoAsset = getLogoAsset(plugin.logoAsset);
                    return (
                      <motion.div
                        key={plugin.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: pluginIndex * 0.03 }}
                      >
                        <div
                          draggable
                          onDragStart={(e) => onDragStart(e, plugin.id)}
                          className={cn(
                            'group relative flex items-start gap-2 px-3 py-2 rounded-xl',
                            'bg-forge-bg/60 border border-forge-border/40',
                            'hover:border-accent-cyan/60 hover:bg-forge-elevated/70',
                            'cursor-grab active:cursor-grabbing transition-all duration-200'
                          )}
                        >
                          <div className="relative w-8 h-8 rounded-md overflow-hidden bg-black/20">
                            {logoAsset ? (
                              <Image
                                src={logoAsset}
                                alt={plugin.name}
                                fill
                                className="object-contain"
                                unoptimized
                              />
                            ) : (
                              <PluginIcon className={cn('w-4 h-4', `text-${plugin.color}`)} />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-white line-clamp-2 leading-tight">
                              {plugin.name}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}


          {/* Remaining categories */}
          <div className="space-y-4 mt-6">
            {otherCategories.map((category, categoryIndex) => {
              const CategoryIcon = category.icon;
              return (
                <motion.div
                  key={category.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: categoryIndex * 0.05 }}
                  className="rounded-xl overflow-hidden"
                >
                  {/* Category header (always expanded, not clickable) */}
                  <div
                    className={cn(
                      'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl',
                      'bg-forge-elevated/20'
                    )}
                  >
                    <span className="text-sm font-medium text-white flex-1 text-left">
                      {category.name}
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-[hsl(var(--color-bg-elevated))] text-[hsl(var(--color-text-disabled))] border border-[hsl(var(--color-border-subtle))]">
                      {category.plugins.length}
                    </span>
                  </div>

                  {/* Plugins (always visible) - 2 per row */}
                  <div className="pb-2 pt-1">
                    <div className="grid grid-cols-2 gap-2">
                      {category.plugins.map((plugin, pluginIndex) => {
                        const PluginIcon = getIconComponent(plugin.icon);
                        const logoAsset = getLogoAsset(plugin.logoAsset);
                        return (
                          <motion.div
                            key={plugin.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: pluginIndex * 0.03 }}
                          >
                            <div
                              draggable
                              onDragStart={(e) => onDragStart(e, plugin.id)}
                              className={cn(
                                'group relative flex items-start gap-2 px-3 py-2 rounded-xl',
                                'bg-forge-bg/60 border border-forge-border/40',
                                'hover:border-accent-cyan/60 hover:bg-forge-elevated/70',
                                'cursor-grab active:cursor-grabbing transition-all duration-200'
                              )}
                            >
                              <div
                                className={cn(
                                  'relative w-8 h-8 rounded-md flex items-center justify-center shrink-0 overflow-hidden',
                                  logoAsset ? 'bg-black/20' : 'bg-gradient-to-br transition-all duration-200',
                                  !logoAsset && `from-${plugin.color}/20 to-${plugin.color}/5`
                                )}
                              >
                                {logoAsset ? (
                                  <Image src={logoAsset} alt={plugin.name} fill className="object-contain" unoptimized />
                                ) : (
                                  <PluginIcon className={cn('w-4 h-4', `text-${plugin.color}`)} />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium text-white line-clamp-2 leading-tight">
                                  {plugin.name}
                                </p>
                                {/* <p className="text-[10px] text-forge-muted truncate">
                                  {plugin.description}
                                </p> */}
                              </div>
                              <button
                                onClick={(e) => toggleFavorite(plugin.id, e)}
                                className={cn(
                                  'p-1 rounded shrink-0 transition-all opacity-0 group-hover:opacity-100',
                                  favorites.has(plugin.id)
                                    ? 'text-amber-400 opacity-100'
                                    : 'text-forge-muted hover:text-amber-400'
                                )}
                                title={favorites.has(plugin.id) ? 'Remove from favorites' : 'Add to favorites'}
                              >
                                <Star className={cn('w-3.5 h-3.5', favorites.has(plugin.id) && 'fill-current')} />
                              </button>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Footer hint */}
        <div className="p-4 border-t border-[hsl(var(--color-border-default))] bg-[hsl(var(--color-bg-base)/0.5)]">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 text-xs text-[hsl(var(--color-text-muted))] mb-1.5">
              <div className="w-5 h-5 rounded bg-[hsl(var(--color-bg-elevated))] flex items-center justify-center">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 00-3 0v2a7.5 7.5 0 0015 0v-5a1.5 1.5 0 00-3 0m-6-3V11m0-5.5v-1a1.5 1.5 0 013 0v1m0 0V11m0-5.5a1.5 1.5 0 013 0v3m0 0V11" />
                </svg>
              </div>
              <span>Drag to compose your blueprint</span>
            </div>
            <p className="text-[10px] text-[hsl(var(--color-text-disabled))]">
              Connect blocks, configure, then build
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}
