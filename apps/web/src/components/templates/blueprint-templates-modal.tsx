'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X,
    Sparkles,
    ArrowRight,
    Layout,
    Layers,
    ShieldCheck,
    Wrench,
    TrendingUp,
    Coins,
    ArrowLeftRight,
    Image,
    Bot,
    Brain,
    CandlestickChart,
    MessageSquare,
    BarChart3,
    Activity,
    Rocket,
    Zap,
    CreditCard,
    KeyRound,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useBlueprintStore } from '@/store/blueprint';
import {
    TEMPLATES,
    TEMPLATE_CATEGORIES,
    type Template,
    type TemplateCategory,
} from '@/data/templates';

// ---------------------------------------------------------------------------
// Icon mapping — maps the string icon name in template data to a Lucide component
// ---------------------------------------------------------------------------

const ICON_MAP: Record<string, LucideIcon> = {
    Layout,
    Layers,
    ShieldCheck,
    Wrench,
    TrendingUp,
    Coins,
    ArrowLeftRight,
    Image,
    Bot,
    Brain,
    CandlestickChart,
    MessageSquare,
    BarChart3,
    Activity,
    Rocket,
    Zap,
    CreditCard,
    KeyRound,
};

function resolveIcon(name: string): LucideIcon {
    return ICON_MAP[name] ?? Layout;
}

// ---------------------------------------------------------------------------
// Color helper
// ---------------------------------------------------------------------------

function getColorVar(colorClass: string): string {
    const colorMap: Record<string, string> = {
        'accent-primary': 'var(--color-accent-primary)',
        'accent-secondary': 'var(--color-accent-secondary)',
        'success': 'var(--color-success)',
        'warning': 'var(--color-warning)',
        'info': 'var(--color-info)',
        'error': 'var(--color-error)',
    };
    return colorMap[colorClass] || colorMap['accent-primary'];
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface BlueprintTemplatesModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function BlueprintTemplatesModal({ isOpen, onClose }: BlueprintTemplatesModalProps) {
    const { addNode, addEdge, resetBlueprint, addGhostNode, addGhostEdge } = useBlueprintStore();
    const [loading, setLoading] = useState<string | null>(null);
    const [activeCategory, setActiveCategory] = useState<TemplateCategory | 'all'>('all');

    // Filter templates by selected category
    const filteredTemplates = useMemo(
        () =>
            activeCategory === 'all'
                ? TEMPLATES
                : TEMPLATES.filter((t) => t.category === activeCategory),
        [activeCategory],
    );

    // Count templates per category for badges
    const categoryCounts = useMemo(() => {
        const counts: Record<string, number> = { all: TEMPLATES.length };
        for (const t of TEMPLATES) {
            counts[t.category] = (counts[t.category] ?? 0) + 1;
        }
        return counts;
    }, []);

    const applyTemplate = async (template: Template) => {
        setLoading(template.id);

        // Reset current canvas (also clears ghost nodes)
        resetBlueprint();

        // Small delay for animation
        await new Promise((r) => setTimeout(r, 200));

        // Add core nodes and track IDs
        const nodeIds: string[] = [];
        for (const nodeConfig of template.nodes) {
            const node = addNode(nodeConfig.type, nodeConfig.position);
            nodeIds.push(node.id);
        }

        // Add core edges
        for (const edge of template.edges) {
            addEdge(nodeIds[edge.source], nodeIds[edge.target]);
        }

        // Add ghost nodes
        const ghostIds: string[] = [];
        for (const gn of template.ghostNodes) {
            const ghost = addGhostNode(gn.type, gn.position);
            ghostIds.push(ghost.id);
        }

        // Add ghost edges (indices reference combined [...nodes, ...ghostNodes])
        const allIds = [...nodeIds, ...ghostIds];
        for (const ge of template.ghostEdges) {
            addGhostEdge(allIds[ge.source], allIds[ge.target]);
        }

        setLoading(null);
        onClose();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 400 }}
                        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-4xl"
                    >
                        <div className="bg-gradient-to-b from-[hsl(var(--color-bg-elevated))] to-[hsl(var(--color-bg-base))] border border-[hsl(var(--color-border-default)/0.6)] rounded-2xl shadow-2xl overflow-hidden">
                            {/* Header */}
                            <div className="flex items-center justify-between p-4 border-b border-[hsl(var(--color-border-default)/0.5)]">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-[hsl(var(--color-accent-primary)/0.1)]">
                                        <Sparkles className="w-5 h-5 text-[hsl(var(--color-accent-primary))]" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-semibold text-[hsl(var(--color-text-primary))]">
                                            Starter Templates
                                        </h2>
                                        <p className="text-xs text-[hsl(var(--color-text-muted))]">
                                            Pre-composed blueprints across {TEMPLATES.length} real-world use cases
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="p-2 rounded-lg hover:bg-[hsl(var(--color-bg-elevated)/0.5)] text-[hsl(var(--color-text-muted))] hover:text-[hsl(var(--color-text-primary))] transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Category filter tabs */}
                            <div className="px-4 pt-3 pb-1 flex gap-1.5 overflow-x-auto scrollbar-none">
                                {TEMPLATE_CATEGORIES.map((cat) => {
                                    const isActive = activeCategory === cat.id;
                                    const count = categoryCounts[cat.id] ?? 0;

                                    // Hide categories with zero templates
                                    if (count === 0 && cat.id !== 'all') return null;

                                    return (
                                        <button
                                            key={cat.id}
                                            onClick={() => setActiveCategory(cat.id)}
                                            className={cn(
                                                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all duration-150',
                                                isActive
                                                    ? 'bg-[hsl(var(--color-accent-primary)/0.15)] text-[hsl(var(--color-accent-primary))] border border-[hsl(var(--color-accent-primary)/0.3)]'
                                                    : 'bg-[hsl(var(--color-bg-elevated)/0.3)] text-[hsl(var(--color-text-muted))] border border-transparent hover:bg-[hsl(var(--color-bg-elevated)/0.6)] hover:text-[hsl(var(--color-text-primary))]',
                                            )}
                                        >
                                            {cat.label}
                                            <span
                                                className={cn(
                                                    'text-[10px] px-1.5 py-0.5 rounded-full',
                                                    isActive
                                                        ? 'bg-[hsl(var(--color-accent-primary)/0.2)] text-[hsl(var(--color-accent-primary))]'
                                                        : 'bg-[hsl(var(--color-bg-base)/0.5)] text-[hsl(var(--color-text-muted))]',
                                                )}
                                            >
                                                {count}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Templates grid */}
                            <div className="p-4 grid grid-cols-3 gap-3 max-h-[500px] overflow-y-auto">
                                {filteredTemplates.map((template) => {
                                    const Icon = resolveIcon(template.icon);
                                    const isLoading = loading === template.id;
                                    const colorVar = getColorVar(template.colorClass);

                                    return (
                                        <motion.button
                                            key={template.id}
                                            onClick={() => applyTemplate(template)}
                                            disabled={!!loading}
                                            className={cn(
                                                'group relative p-4 rounded-xl text-left',
                                                'bg-[hsl(var(--color-bg-elevated)/0.3)] border border-[hsl(var(--color-border-default)/0.5)]',
                                                'hover:bg-[hsl(var(--color-bg-elevated)/0.5)] hover:border-[hsl(var(--color-text-primary)/0.2)]',
                                                'transition-all duration-200',
                                                isLoading && 'opacity-50 pointer-events-none',
                                            )}
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                        >
                                            {/* Icon */}
                                            <div
                                                className="w-10 h-10 rounded-lg flex items-center justify-center mb-3"
                                                style={{
                                                    backgroundColor: `hsl(${colorVar} / 0.1)`,
                                                    borderWidth: '1px',
                                                    borderColor: `hsl(${colorVar} / 0.2)`,
                                                }}
                                            >
                                                <Icon
                                                    className="w-5 h-5"
                                                    style={{ color: `hsl(${colorVar})` }}
                                                />
                                            </div>

                                            {/* Content */}
                                            <h3 className="font-medium text-[hsl(var(--color-text-primary))] mb-1 group-hover:text-[hsl(var(--color-accent-primary))] transition-colors">
                                                {template.name}
                                            </h3>
                                            <p className="text-xs text-[hsl(var(--color-text-muted))] line-clamp-2 mb-3">
                                                {template.description}
                                            </p>

                                            {/* Tags + block count */}
                                            <div className="flex flex-wrap gap-1">
                                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-[hsl(var(--color-accent-primary)/0.1)] text-[hsl(var(--color-accent-primary))] font-medium">
                                                    {template.nodes.length} blocks
                                                    {template.ghostNodes.length > 0 && (
                                                        <span className="opacity-60"> +{template.ghostNodes.length}</span>
                                                    )}
                                                </span>
                                                {template.tags.map((tag) => (
                                                    <span
                                                        key={tag}
                                                        className="text-[10px] px-1.5 py-0.5 rounded bg-[hsl(var(--color-bg-base)/0.5)] text-[hsl(var(--color-text-muted))]"
                                                    >
                                                        {tag}
                                                    </span>
                                                ))}
                                            </div>

                                            {/* Arrow indicator */}
                                            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <ArrowRight className="w-4 h-4 text-[hsl(var(--color-accent-primary))]" />
                                            </div>

                                            {/* Loading state */}
                                            {isLoading && (
                                                <div className="absolute inset-0 flex items-center justify-center bg-[hsl(var(--color-bg-base)/0.5)] rounded-xl">
                                                    <div className="w-6 h-6 border-2 border-[hsl(var(--color-accent-primary)/0.3)] border-t-[hsl(var(--color-accent-primary))] rounded-full animate-spin" />
                                                </div>
                                            )}
                                        </motion.button>
                                    );
                                })}
                            </div>

                            {/* Footer */}
                            <div className="p-4 border-t border-[hsl(var(--color-border-default)/0.5)] bg-[hsl(var(--color-bg-base)/0.3)]">
                                <p className="text-xs text-[hsl(var(--color-text-muted))] text-center">
                                    Selecting a template replaces the current canvas. Shimmer blocks are optional suggestions you can activate later.
                                </p>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
