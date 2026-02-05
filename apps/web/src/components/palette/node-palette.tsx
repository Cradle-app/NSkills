'use client';

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
  // Start with all categories collapsed by default
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    () => new Set()
  );
  // Suggestions section collapsed by default to save space
  const [suggestionsExpanded, setSuggestionsExpanded] = useState(false);
  const { isConnected } = useAccount();
  const { isWalletConnected, isFullyAuthenticated } = useAuthGuard();
  const { showAuthModal, openAuthModal, closeAuthModal } = useAuthStore();

  // Build categories from centralized registry
  const categories = useMemo(() => buildCategories(), []);

  // Get suggested plugins based on current canvas nodes
  const { suggestions, hasSuggestions } = useSuggestedPlugins();
  const addNode = useBlueprintStore((state) => state.addNode);

  // Favorites stored in localStorage
  const [favorites, setFavorites] = useState<Set<string>>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('cradle-favorite-nodes');
      return stored ? new Set(JSON.parse(stored)) : new Set();
    }
    return new Set();
  });

  // Persist favorites to localStorage
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

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  };

  const onDragStart = (event: React.DragEvent, nodeType: string) => {
    // Require wallet connection before allowing drag
    // Use isConnected from wagmi for real-time status, fallback to store
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
          plugin.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          plugin.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          plugin.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      ),
    })).filter(category => category.plugins.length > 0 || searchQuery === '');
  }, [categories, searchQuery]);

  return (
    <>
      <aside data-tour="palette" className="h-full border-r border-forge-border/50 bg-gradient-to-b from-forge-surface/80 to-forge-bg/50 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-forge-border/50">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-1.5 rounded-lg bg-accent-cyan/10">
              <Sparkles className="w-4 h-4 text-accent-cyan" />
            </div>
            <h2 className="text-sm font-semibold text-white tracking-wide">Components</h2>
          </div>

          {/* Search */}
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-forge-muted group-focus-within:text-accent-cyan transition-colors" />
            <input
              type="text"
              placeholder="Search components..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2.5 text-sm bg-forge-bg/50 border border-forge-border/50 rounded-xl text-white placeholder:text-forge-muted focus:outline-none focus:border-accent-cyan/50 focus:bg-forge-bg transition-all duration-200"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-forge-muted hover:text-white transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Suggested Section - collapsible to save space */}
        {hasSuggestions && searchQuery === '' && (
          <div className="px-3 pb-2">
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl overflow-hidden"
            >
              {/* Collapsible header */}
              <button
                onClick={() => setSuggestionsExpanded(!suggestionsExpanded)}
                className="w-full flex items-center gap-2 px-3 py-2 hover:bg-forge-elevated/30 rounded-lg transition-colors"
              >
                <motion.div
                  animate={{ rotate: suggestionsExpanded ? 90 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronRight className="w-3.5 h-3.5 text-accent-cyan" />
                </motion.div>
                <Sparkles className="w-4 h-4 text-accent-cyan" />
                <span className="text-xs font-semibold text-accent-cyan">Suggested</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-accent-cyan/10 text-accent-cyan">
                  {suggestions.length}
                </span>
              </button>

              {/* Collapsible content */}
              <AnimatePresence>
                {suggestionsExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="space-y-1.5 px-1 pt-1">
                      {suggestions.slice(0, 5).map((plugin, idx) => {
                        const SuggestedIcon = getIconComponent(plugin.icon);
                        const reasonLabel = {
                          required: 'Required',
                          suggested: 'Recommended',
                          compatible: 'Compatible',
                        };
                        const reasonColor = {
                          required: 'bg-red-500/10 text-red-400 border-red-500/30',
                          suggested: 'bg-accent-cyan/10 text-accent-cyan border-accent-cyan/30',
                          compatible: 'bg-green-500/10 text-green-400 border-green-500/30',
                        };
                        return (
                          <motion.div
                            key={plugin.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.05 }}
                          >
                            <div
                              draggable
                              onDragStart={(e) => onDragStart(e, plugin.id)}
                              className={cn(
                                'p-2 rounded-lg cursor-grab active:cursor-grabbing',
                                'bg-accent-cyan/5 border border-accent-cyan/20',
                                'hover:border-accent-cyan/40 hover:bg-accent-cyan/10',
                                'transition-all duration-200 group'
                              )}
                            >
                              <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-md flex items-center justify-center bg-accent-cyan/10 shrink-0">
                                  <SuggestedIcon className="w-3.5 h-3.5 text-accent-cyan" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-1">
                                    <p className="text-[11px] font-medium text-white truncate">{plugin.name}</p>
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
        )}

        {/* Categories */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {filteredCategories.map((category, categoryIndex) => {
            const CategoryIcon = category.icon;
            return (
              <motion.div
                key={category.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: categoryIndex * 0.05 }}
                className="rounded-xl overflow-hidden"
              >
                {/* Category header */}
                <button
                  onClick={() => toggleCategory(category.id)}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200',
                    'hover:bg-forge-elevated/50',
                    expandedCategories.has(category.id) && 'bg-forge-elevated/30'
                  )}
                >
                  <motion.div
                    animate={{ rotate: expandedCategories.has(category.id) ? 90 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ChevronRight className="w-4 h-4 text-forge-muted" />
                  </motion.div>
                  <div className={cn(
                    'w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-200',
                    expandedCategories.has(category.id)
                      ? `bg-${category.color}/20`
                      : 'bg-forge-elevated/50'
                  )}>
                    <CategoryIcon className={cn(
                      'w-4 h-4 transition-colors duration-200',
                      expandedCategories.has(category.id) ? `text-${category.color}` : 'text-forge-muted'
                    )} />
                  </div>
                  <span className="text-sm font-medium text-white flex-1 text-left">
                    {category.name}
                  </span>
                  <span className={cn(
                    'text-xs font-mono px-2 py-0.5 rounded-full transition-colors duration-200',
                    expandedCategories.has(category.id)
                      ? `bg-${category.color}/20 text-${category.color}`
                      : 'bg-forge-elevated/50 text-forge-muted'
                  )}>
                    {category.plugins.length}
                  </span>
                </button>

                {/* Plugins */}
                <AnimatePresence>
                  {expandedCategories.has(category.id) && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="pl-6 pr-2 pb-2 pt-1 space-y-1.5">
                        {category.plugins.map((plugin, pluginIndex) => {
                          const PluginIcon = getIconComponent(plugin.icon);
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
                                  'p-3 rounded-xl cursor-grab active:cursor-grabbing',
                                  'bg-forge-bg/50 border border-transparent',
                                  'hover:border-forge-border/50 hover:bg-forge-elevated/50',
                                  'hover:shadow-lg hover:shadow-black/20',
                                  'transition-all duration-200',
                                  'group'
                                )}
                              >
                                <div className="flex items-start gap-3">
                                  <div
                                    className={cn(
                                      'w-9 h-9 rounded-lg flex items-center justify-center shrink-0',
                                      'bg-gradient-to-br transition-all duration-200',
                                      `from-${plugin.color}/20 to-${plugin.color}/5`,
                                      'group-hover:from-' + plugin.color + '/30 group-hover:to-' + plugin.color + '/10'
                                    )}
                                  >
                                    <PluginIcon className={cn('w-4.5 h-4.5', `text-${plugin.color}`)} />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-white truncate group-hover:text-accent-cyan transition-colors">
                                      {plugin.name}
                                    </p>
                                    <p className="text-xs text-forge-muted truncate mt-0.5 leading-relaxed">
                                      {plugin.description}
                                    </p>
                                  </div>
                                  <button
                                    onClick={(e) => toggleFavorite(plugin.id, e)}
                                    className={cn(
                                      'p-1.5 rounded-lg shrink-0 transition-all opacity-0 group-hover:opacity-100',
                                      favorites.has(plugin.id)
                                        ? 'text-amber-400 opacity-100'
                                        : 'text-forge-muted hover:text-amber-400'
                                    )}
                                    title={favorites.has(plugin.id) ? 'Remove from favorites' : 'Add to favorites'}
                                  >
                                    <Star className={cn('w-4 h-4', favorites.has(plugin.id) && 'fill-current')} />
                                  </button>
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
            );
          })}
        </div>

        {/* Footer hint */}
        <div className="p-4 border-t border-forge-border/50 bg-forge-bg/30">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 text-xs text-forge-muted mb-2">
              <div className="w-5 h-5 rounded bg-forge-elevated/50 flex items-center justify-center">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 00-3 0v2a7.5 7.5 0 0015 0v-5a1.5 1.5 0 00-3 0m-6-3V11m0-5.5v-1a1.5 1.5 0 013 0v1m0 0V11m0-5.5a1.5 1.5 0 013 0v3m0 0V11" />
                </svg>
              </div>
              <span>Drag to build your foundation</span>
            </div>
            <p className="text-[10px] text-forge-muted/60">
              Structure first, then vibe ✨
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}
