'use client';

import Image from 'next/image';
import { useState, useMemo, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Box,
  CreditCard,
  Bot,
  Layout,
  ShieldCheck,
  ChevronRight,
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
import WalletLogo from '@/assets/blocks/Wallet.svg';
import SuperpositionLogo from '@/assets/blocks/superposition.png';
import DuneLogo from '@/assets/blocks/dune.png';

const PROTOCOL_PLUGIN_IDS = [
  'aave-lending',
  'compound-lending',
  'chainlink-price-feed',
  'pyth-oracle',
  'uniswap-swap',
] as const;

const PROTOCOL_PLUGIN_ID_SET = new Set<string>(PROTOCOL_PLUGIN_IDS);

type ProtocolPluginId = (typeof PROTOCOL_PLUGIN_IDS)[number];

const PROTOCOL_PLUGIN_LOGOS: Record<ProtocolPluginId, any> = {
  'aave-lending': AaveLogo,
  'compound-lending': CompoundLogo,
  'chainlink-price-feed': ChainlinkLogo,
  'pyth-oracle': PythLogo,
  'uniswap-swap': UniswapLogo,
};

const PROTOCOL_PLUGIN_DISPLAY_NAMES: Record<ProtocolPluginId, string> = {
  'aave-lending': 'aave',
  'compound-lending': 'compound',
  'chainlink-price-feed': 'chainlink',
  'pyth-oracle': 'pyth network',
  'uniswap-swap': 'uniswap',
};

/** Contract plugins with custom logos */
const CONTRACT_PLUGIN_LOGOS: Record<string, { src: any; alt: string }> = {
  'smartcache-caching': { src: CSLogo, alt: 'SmartCache' },
  'auditware-analyzing': { src: AuditwareLogo, alt: 'Auditware' },
  'erc20-stylus': { src: StylusLogo, alt: 'Stylus' },
  'erc721-stylus': { src: StylusLogo, alt: 'Stylus' },
  'erc1155-stylus': { src: StylusLogo, alt: 'Stylus' },
  'stylus-contract': { src: StylusLogo, alt: 'Stylus' },
  'stylus-zk-contract': { src: StylusLogo, alt: 'Stylus' },
  'stylus-rust-contract': { src: StylusLogo, alt: 'Stylus' },
};

/** Agent plugins with custom logos */
const AGENT_PLUGIN_LOGOS: Record<string, { src: any; alt: string }> = {
  'ostium-trading': { src: OstiumLogo, alt: 'Ostium' },
  'maxxit': { src: MaxxitLogo, alt: 'Maxxit' },
  'erc8004-agent-runtime': { src: AIbotLogo, alt: 'AIbot' },
  'onchain-activity': { src: WalletLogo, alt: 'Wallet' },
};

/** Superposition plugins with custom logos */
const SUPERPOSITION_PLUGIN_LOGOS: Record<string, { src: any; alt: string }> = {
  'superposition-network': { src: SuperpositionLogo, alt: 'Superposition' },
  'superposition-bridge': { src: SuperpositionLogo, alt: 'Superposition' },
  'superposition-longtail': { src: SuperpositionLogo, alt: 'Superposition' },
  'superposition-super-assets': { src: SuperpositionLogo, alt: 'Superposition' },
  'superposition-thirdweb': { src: SuperpositionLogo, alt: 'Superposition' },
  'superposition-utility-mining': { src: SuperpositionLogo, alt: 'Superposition' },
  'superposition-faucet': { src: SuperpositionLogo, alt: 'Superposition' },
  'superposition-meow-domains': { src: SuperpositionLogo, alt: 'Superposition' },
};

/** Dune analytics plugins with custom logos */
const DUNE_PLUGIN_LOGOS: Record<string, { src: any; alt: string }> = {
  'dune-execute-sql': { src: DuneLogo, alt: 'Dune' },
  'dune-token-price': { src: DuneLogo, alt: 'Dune' },
  'dune-wallet-balances': { src: DuneLogo, alt: 'Dune' },
  'dune-dex-volume': { src: DuneLogo, alt: 'Dune' },
  'dune-nft-floor': { src: DuneLogo, alt: 'Dune' },
  'dune-address-labels': { src: DuneLogo, alt: 'Dune' },
  'dune-transaction-history': { src: DuneLogo, alt: 'Dune' },
  'dune-gas-price': { src: DuneLogo, alt: 'Dune' },
  'dune-protocol-tvl': { src: DuneLogo, alt: 'Dune' },
};

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
  // Suggestions section collapsed by default to save space
  const [suggestionsExpanded, setSuggestionsExpanded] = useState(false);
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

  const filteredCategories = useMemo(() => {
    return categories.map(category => ({
      ...category,
      plugins: category.plugins.filter(
        plugin =>
          !PROTOCOL_PLUGIN_ID_SET.has(plugin.id) && (
            plugin.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            plugin.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
            plugin.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
          )
      ),
    })).filter(category => category.plugins.length > 0 || searchQuery === '');
  }, [categories, searchQuery]);

  const contractsCategory = useMemo(
    () => filteredCategories.find((c) => c.id === 'contracts'),
    [filteredCategories]
  );

  const otherCategories = useMemo(
    () => filteredCategories.filter((c) => c.id !== 'contracts'),
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

        {/* Suggested Section - collapsible to save space */}
        {/* {hasSuggestions && searchQuery === '' && (
          <div className="px-3 pb-2">
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-lg overflow-hidden"
            >
              <button
                onClick={() => setSuggestionsExpanded(!suggestionsExpanded)}
                className="w-full flex items-center gap-2 px-2.5 py-2 hover:bg-[hsl(var(--color-bg-hover))] rounded-lg transition-colors"
              >
                <motion.div
                  animate={{ rotate: suggestionsExpanded ? 90 : 0 }}
                  transition={{ duration: 0.15 }}
                >
                  <ChevronRight className="w-3.5 h-3.5 text-[hsl(var(--color-accent-primary))]" />
                </motion.div>
                <Sparkles className="w-4 h-4 text-[hsl(var(--color-accent-primary))]" />
                <span className="text-xs font-semibold text-[hsl(var(--color-accent-primary))]">Suggested</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[hsl(var(--color-accent-primary)/0.1)] text-[hsl(var(--color-accent-primary))]">
                  {suggestions.length}
                </span>
              </button>

              <AnimatePresence>
                {suggestionsExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="overflow-hidden"
                  >
                    <div className="space-y-1.5 px-1 pt-1 pb-1">
                      {suggestions.slice(0, 5).map((plugin, idx) => {
                        const SuggestedIcon = getIconComponent(plugin.icon);
                        const reasonLabel = {
                          required: 'Required',
                          suggested: 'Recommended',
                          compatible: 'Compatible',
                        };
                        const reasonColor = {
                          required: 'bg-[hsl(var(--color-error)/0.1)] text-[hsl(var(--color-error))] border-[hsl(var(--color-error)/0.25)]',
                          suggested: 'bg-[hsl(var(--color-accent-primary)/0.1)] text-[hsl(var(--color-accent-primary))] border-[hsl(var(--color-accent-primary)/0.25)]',
                          compatible: 'bg-[hsl(var(--color-success)/0.1)] text-[hsl(var(--color-success))] border-[hsl(var(--color-success)/0.25)]',
                        };
                        return (
                          <motion.div
                            key={plugin.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.04 }}
                          >
                            <div
                              draggable
                              onDragStart={(e) => onDragStart(e, plugin.id)}
                              className={cn(
                                'p-2 rounded-lg cursor-grab active:cursor-grabbing',
                                'bg-[hsl(var(--color-accent-primary)/0.05)] border border-[hsl(var(--color-accent-primary)/0.15)]',
                                'hover:border-[hsl(var(--color-accent-primary)/0.3)] hover:bg-[hsl(var(--color-accent-primary)/0.08)]',
                                'transition-all duration-150 group'
                              )}
                            >
                              <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-md flex items-center justify-center bg-[hsl(var(--color-accent-primary)/0.1)] shrink-0">
                                  <SuggestedIcon className="w-3.5 h-3.5 text-[hsl(var(--color-accent-primary))]" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-1.5">
                                    <p className="text-[11px] font-medium text-[hsl(var(--color-text-primary))] truncate">{plugin.name}</p>
                                    <span className={cn(
                                      'text-[8px] px-1 py-0.5 rounded border shrink-0',
                                      reasonColor[plugin.reason]
                                    )}>
                                      {reasonLabel[plugin.reason]}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>
        )} */}

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
                {/* <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-forge-elevated/60">
                  {(() => {
                    const CategoryIcon = contractsCategory.icon;
                    return <CategoryIcon className="w-4 h-4 text-forge-muted" />;
                  })()}
                </div> */}
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
                    const logoInfo = CONTRACT_PLUGIN_LOGOS[plugin.id];
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
                            'group relative flex items-center gap-2 px-3 py-2 rounded-xl',
                            'bg-forge-bg/60 border border-forge-border/40',
                            'hover:border-accent-cyan/60 hover:bg-forge-elevated/70',
                            'cursor-grab active:cursor-grabbing transition-all duration-200'
                          )}
                        >
                          <div className="relative w-8 h-8 rounded-md overflow-hidden bg-black/20 shrink-0 flex items-center justify-center">
                            {logoInfo ? (
                              <Image
                                src={logoInfo.src}
                                alt={logoInfo.alt}
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
                            <p className="text-xs font-medium text-white truncate">
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
                {PROTOCOL_PLUGIN_IDS.length}
              </span>
            </div>

            <div className="space-y-3 pt-1">
              {/* Row 1: Aave, Compound */}
              <div className="grid grid-cols-2 gap-2">
                {(['aave-lending', 'compound-lending'] as ProtocolPluginId[]).map((id) => {
                  const plugin = PLUGIN_REGISTRY[id];
                  if (!plugin) return null;
                  const logo = PROTOCOL_PLUGIN_LOGOS[id];
                  return (
                    <div
                      key={id}
                      draggable
                      onDragStart={(e) => onDragStart(e, id)}
                      className={cn(
                        'group relative flex items-center gap-2 px-3 py-2 rounded-xl',
                        'bg-forge-bg/60 border border-forge-border/40',
                        'hover:border-accent-cyan/60 hover:bg-forge-elevated/70',
                        'cursor-grab active:cursor-grabbing transition-all duration-200'
                      )}
                    >
                      <div className="relative w-8 h-8 rounded-md overflow-hidden bg-black/20">
                        <Image src={logo} alt={PROTOCOL_PLUGIN_DISPLAY_NAMES[id]} fill className="object-contain" unoptimized />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-white truncate">
                          {PROTOCOL_PLUGIN_DISPLAY_NAMES[id]}
                        </p>
                        {/* <p className="text-[10px] text-forge-muted truncate">
                          {plugin.description}
                        </p> */}
                      </div>
                    </div>
                  );
                })}
              </div>
              {/* Row 2: Chainlink, Pyth */}
              <div className="grid grid-cols-2 gap-2">
                {(['chainlink-price-feed', 'pyth-oracle'] as ProtocolPluginId[]).map((id) => {
                  const plugin = PLUGIN_REGISTRY[id];
                  if (!plugin) return null;
                  const logo = PROTOCOL_PLUGIN_LOGOS[id];
                  return (
                    <div
                      key={id}
                      draggable
                      onDragStart={(e) => onDragStart(e, id)}
                      className={cn(
                        'group relative flex items-center gap-2 px-3 py-2 rounded-xl',
                        'bg-forge-bg/60 border border-forge-border/40',
                        'hover:border-accent-cyan/60 hover:bg-forge-elevated/70',
                        'cursor-grab active:cursor-grabbing transition-all duration-200'
                      )}
                    >
                      <div className="relative w-8 h-8 rounded-md overflow-hidden bg-black/20">
                        <Image src={logo} alt={PROTOCOL_PLUGIN_DISPLAY_NAMES[id]} fill className="object-contain" unoptimized />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-white truncate">
                          {PROTOCOL_PLUGIN_DISPLAY_NAMES[id]}
                        </p>
                        {/* <p className="text-[10px] text-forge-muted truncate">
                          {plugin.description}
                        </p> */}
                      </div>
                    </div>
                  );
                })}
              </div>
              {/* Row 3: Uniswap (single) */}
              <div className="flex">
                {(['uniswap-swap'] as ProtocolPluginId[]).map((id) => {
                  const plugin = PLUGIN_REGISTRY[id];
                  if (!plugin) return null;
                  const logo = PROTOCOL_PLUGIN_LOGOS[id];
                  return (
                    <div
                      key={id}
                      draggable
                      onDragStart={(e) => onDragStart(e, id)}
                      className={cn(
                        'group relative flex items-center gap-2 px-3 py-2 rounded-xl',
                        'bg-forge-bg/60 border border-forge-border/40',
                        'hover:border-accent-cyan/60 hover:bg-forge-elevated/70',
                        'cursor-grab active:cursor-grabbing transition-all duration-200',
                        'w-full'
                      )}
                    >
                      <div className="relative w-8 h-8 rounded-md overflow-hidden bg-black/20">
                        <Image src={logo} alt={PROTOCOL_PLUGIN_DISPLAY_NAMES[id]} fill className="object-contain" unoptimized />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-white truncate">
                          {PROTOCOL_PLUGIN_DISPLAY_NAMES[id]}
                        </p>
                        {/* <p className="text-[10px] text-forge-muted truncate">
                          {plugin.description}
                        </p> */}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

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
                    {/* <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-forge-elevated/60">
                      <CategoryIcon className="w-4 h-4 text-forge-muted" />
                    </div> */}
                    <span className="text-sm font-medium text-white flex-1 text-left">
                      {category.name}
                    </span>
                    <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-forge-elevated/60 text-forge-muted">
                      {category.plugins.length}
                    </span>
                  </div>

                  {/* Plugins (always visible) - 2 per row */}
                  <div className="pb-2 pt-1">
                    <div className="grid grid-cols-2 gap-2">
                      {category.plugins.map((plugin, pluginIndex) => {
                        const PluginIcon = getIconComponent(plugin.icon);
                        const logoInfo =
                          AGENT_PLUGIN_LOGOS[plugin.id] ||
                          SUPERPOSITION_PLUGIN_LOGOS[plugin.id] ||
                          DUNE_PLUGIN_LOGOS[plugin.id];
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
                                'group relative flex items-center gap-2 px-3 py-2 rounded-xl',
                                'bg-forge-bg/60 border border-forge-border/40',
                                'hover:border-accent-cyan/60 hover:bg-forge-elevated/70',
                                'cursor-grab active:cursor-grabbing transition-all duration-200'
                              )}
                            >
                              <div
                                className={cn(
                                  'relative w-8 h-8 rounded-md flex items-center justify-center shrink-0 overflow-hidden',
                                  logoInfo ? 'bg-black/20' : 'bg-gradient-to-br transition-all duration-200',
                                  !logoInfo && `from-${plugin.color}/20 to-${plugin.color}/5`
                                )}
                              >
                                {logoInfo ? (
                                  <Image src={logoInfo.src} alt={logoInfo.alt} fill className="object-contain" unoptimized />
                                ) : (
                                  <PluginIcon className={cn('w-4 h-4', `text-${plugin.color}`)} />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium text-white truncate">
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
              <span>Drag to build your foundation</span>
            </div>
            <p className="text-[10px] text-[hsl(var(--color-text-disabled))]">
              Structure first, then refine ✨
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}
