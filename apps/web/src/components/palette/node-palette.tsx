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
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    () => new Set()
  );
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

        {/* Suggested Section */}
        {hasSuggestions && searchQuery === '' && (
          <div className="px-3 py-2 border-b border-[hsl(var(--color-border-subtle))]">
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
        )}

        {/* Categories */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
          {filteredCategories.map((category, categoryIndex) => {
            const CategoryIcon = category.icon;
            const isExpanded = expandedCategories.has(category.id);

            return (
              <motion.div
                key={category.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: categoryIndex * 0.03 }}
                className="rounded-lg overflow-hidden"
              >
                {/* Category header */}
                <button
                  onClick={() => toggleCategory(category.id)}
                  className={cn(
                    'w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg transition-all duration-150',
                    'hover:bg-[hsl(var(--color-bg-hover))]',
                    isExpanded && 'bg-[hsl(var(--color-bg-muted))]'
                  )}
                >
                  <motion.div
                    animate={{ rotate: isExpanded ? 90 : 0 }}
                    transition={{ duration: 0.15 }}
                  >
                    <ChevronRight className="w-3.5 h-3.5 text-[hsl(var(--color-text-muted))]" />
                  </motion.div>
                  <div className={cn(
                    'w-7 h-7 rounded-lg flex items-center justify-center transition-colors duration-150',
                    isExpanded
                      ? 'bg-[hsl(var(--color-accent-primary)/0.12)]'
                      : 'bg-[hsl(var(--color-bg-elevated))]'
                  )}>
                    <CategoryIcon className={cn(
                      'w-4 h-4 transition-colors duration-150',
                      isExpanded
                        ? 'text-[hsl(var(--color-accent-primary))]'
                        : 'text-[hsl(var(--color-text-muted))]'
                    )} />
                  </div>
                  <span className="text-sm font-medium text-[hsl(var(--color-text-primary))] flex-1 text-left">
                    {category.name}
                  </span>
                  <span className={cn(
                    'text-xs font-mono px-2 py-0.5 rounded-full transition-colors duration-150',
                    isExpanded
                      ? 'bg-[hsl(var(--color-accent-primary)/0.12)] text-[hsl(var(--color-accent-primary))]'
                      : 'bg-[hsl(var(--color-bg-elevated))] text-[hsl(var(--color-text-muted))]'
                  )}>
                    {category.plugins.length}
                  </span>
                </button>

                {/* Plugin Items */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.15 }}
                      className="overflow-hidden"
                    >
                      <div className="pl-5 pr-2 pb-2 pt-1 space-y-1">
                        {category.plugins.map((plugin, pluginIndex) => {
                          const PluginIcon = getIconComponent(plugin.icon);
                          return (
                            <motion.div
                              key={plugin.id}
                              initial={{ opacity: 0, x: -8 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: pluginIndex * 0.02 }}
                            >
                              <div
                                draggable
                                onDragStart={(e) => onDragStart(e, plugin.id)}
                                className={cn(
                                  'p-3 rounded-lg cursor-grab active:cursor-grabbing',
                                  'bg-[hsl(var(--color-bg-base)/0.5)] border border-transparent',
                                  'hover:border-[hsl(var(--color-border-default))] hover:bg-[hsl(var(--color-bg-muted))]',
                                  'hover:shadow-md',
                                  'transition-all duration-150',
                                  'group'
                                )}
                              >
                                <div className="flex items-start gap-3">
                                  <div
                                    className={cn(
                                      'w-9 h-9 rounded-lg flex items-center justify-center shrink-0',
                                      'bg-[hsl(var(--color-bg-muted))] border border-[hsl(var(--color-border-subtle))]',
                                      'group-hover:bg-[hsl(var(--color-accent-primary)/0.1)] group-hover:border-[hsl(var(--color-accent-primary)/0.25)]',
                                      'transition-all duration-150'
                                    )}
                                  >
                                    <PluginIcon className={cn(
                                      'w-4 h-4',
                                      'text-[hsl(var(--color-text-muted))] group-hover:text-[hsl(var(--color-accent-primary))]',
                                      'transition-colors duration-150'
                                    )} />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-[hsl(var(--color-text-primary))] truncate group-hover:text-[hsl(var(--color-accent-primary))] transition-colors">
                                      {plugin.name}
                                    </p>
                                    <p className="text-xs text-[hsl(var(--color-text-muted))] truncate mt-0.5 leading-relaxed">
                                      {plugin.description}
                                    </p>
                                  </div>
                                  <button
                                    onClick={(e) => toggleFavorite(plugin.id, e)}
                                    className={cn(
                                      'p-1.5 rounded-lg shrink-0 transition-all opacity-0 group-hover:opacity-100',
                                      favorites.has(plugin.id)
                                        ? 'text-[hsl(var(--color-warning))] opacity-100'
                                        : 'text-[hsl(var(--color-text-muted))] hover:text-[hsl(var(--color-warning))]'
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
