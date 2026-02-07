'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X,
    Sparkles,
    ArrowRight,
    Search,
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
    Filter,
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
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogBody,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

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
    const [searchQuery, setSearchQuery] = useState('');

    // Filter templates by selected category and search query
    const filteredTemplates = useMemo(() => {
        return TEMPLATES.filter((t) => {
            const matchesCategory = activeCategory === 'all' || t.category === activeCategory;
            const matchesSearch =
                t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                t.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()));
            return matchesCategory && matchesSearch;
        });
    }, [activeCategory, searchQuery]);

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

        // Add core nodes and track IDs + positions
        const nodeIds: string[] = [];
        const nodePositions: { x: number; y: number }[] = [];
        for (const nodeConfig of template.nodes) {
            const node = addNode(nodeConfig.type, nodeConfig.position);
            nodeIds.push(node.id);
            nodePositions.push(nodeConfig.position);
        }

        // Add core edges
        for (const edge of template.edges) {
            addEdge(nodeIds[edge.source], nodeIds[edge.target]);
        }

        // =====================================================================
        // TEMPLATE GHOST NODE POSITIONING - HORIZONTAL ROW AT BOTTOM
        // =====================================================================
        // Strategy: Place ALL template ghost nodes in a HORIZONTAL row at the 
        // bottom of the workflow. This creates visual separation from the main
        // workflow and from node-specific suggestions (which appear on the right).
        // =====================================================================

        const coreNodeCount = template.nodes.length;
        const ghostCount = template.ghostNodes.length;

        if (ghostCount === 0) {
            // No ghost nodes to position
            const ghostIds: string[] = [];
            const allIds = [...nodeIds, ...ghostIds];
            for (const ge of template.ghostEdges) {
                addGhostEdge(allIds[ge.source], allIds[ge.target]);
            }
            setLoading(null);
            onClose();
            return;
        }

        // Layout constants for horizontal bottom row
        const NODE_WIDTH = 200;          // Approximate node width
        const NODE_HEIGHT = 100;         // Approximate node height  
        const HORIZONTAL_SPACING = 240;  // Horizontal space between ghost nodes
        const BOTTOM_GAP = 180;          // Gap below the lowest core node

        // Find the bounds of all core nodes
        const coreXs = nodePositions.map(p => p.x);
        const coreYs = nodePositions.map(p => p.y);
        const minCoreX = Math.min(...coreXs);
        const maxCoreX = Math.max(...coreXs);
        const maxCoreY = Math.max(...coreYs);

        // Calculate the horizontal center of the core nodes
        const coreWidth = maxCoreX - minCoreX + NODE_WIDTH;
        const coreCenterX = minCoreX + coreWidth / 2;

        // Calculate total width needed for ghost nodes row
        const ghostRowWidth = (ghostCount - 1) * HORIZONTAL_SPACING + NODE_WIDTH;

        // Position ghost row below all core nodes, centered horizontally
        const ghostRowY = maxCoreY + NODE_HEIGHT + BOTTOM_GAP;
        const ghostRowStartX = coreCenterX - ghostRowWidth / 2;

        // Add ghost nodes with horizontal row positioning
        const ghostIds: string[] = [];
        for (let i = 0; i < ghostCount; i++) {
            const gn = template.ghostNodes[i];
            const position = {
                x: ghostRowStartX + (i * HORIZONTAL_SPACING),
                y: ghostRowY,
            };
            const ghost = addGhostNode(gn.type, position);
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
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent size="xl" className="flex flex-col h-[85vh] p-0 overflow-hidden border-forge-border/40">
                <DialogHeader className="p-6 border-b border-forge-border/40 bg-forge-bg/30">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent-primary to-accent-secondary p-[1px]">
                                <div className="w-full h-full rounded-[11px] bg-forge-bg flex items-center justify-center">
                                    <Sparkles className="w-6 h-6 text-accent-primary" />
                                </div>
                            </div>
                            <div>
                                <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
                                    Starter Templates
                                </DialogTitle>
                                <DialogDescription className="text-forge-text-secondary mt-1 leading-relaxed">
                                    Choose from {TEMPLATES.length} pre-composed blueprints to jumpstart your project
                                </DialogDescription>
                            </div>
                        </div>
                    </div>
                </DialogHeader>

                <div className="flex-1 flex flex-col overflow-hidden">
                    {/* Toolbar: Categories + Search */}
                    <div className="p-4 bg-forge-bg/20 border-b border-forge-border/30 flex flex-col md:flex-row gap-4 items-center">
                        <div className="flex-1 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none w-full md:w-auto">
                            <div className="flex items-center gap-1.5 p-1 bg-forge-surface/50 rounded-xl border border-forge-border/50">
                                {TEMPLATE_CATEGORIES.map((cat) => {
                                    const isActive = activeCategory === cat.id;
                                    const count = categoryCounts[cat.id] ?? 0;
                                    if (count === 0 && cat.id !== 'all') return null;

                                    return (
                                        <button
                                            key={cat.id}
                                            onClick={() => setActiveCategory(cat.id)}
                                            className={cn(
                                                'relative flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all duration-200',
                                                isActive
                                                    ? 'bg-accent-primary text-black'
                                                    : 'text-forge-text-secondary hover:text-white hover:bg-forge-hover/50',
                                            )}
                                        >
                                            {cat.label}
                                            <span
                                                className={cn(
                                                    'text-[10px] px-1.5 py-0.5 rounded-md',
                                                    isActive
                                                        ? 'bg-black/20 text-black'
                                                        : 'bg-forge-bg/60 text-forge-text-secondary',
                                                )}
                                            >
                                                {count}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="w-full md:w-64">
                            <Input
                                placeholder="Search templates..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                leftIcon={<Search className="w-4 h-4" />}
                                className="bg-forge-surface/50 border-forge-border/50 h-10 rounded-xl focus:ring-accent-primary/20"
                            />
                        </div>
                    </div>

                    {/* Templates Grid */}
                    <DialogBody className="flex-1 overflow-y-auto p-6 scroll-smooth custom-scrollbar">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                            <AnimatePresence mode="popLayout">
                                {filteredTemplates.length > 0 ? (
                                    filteredTemplates.map((template, idx) => {
                                        const Icon = resolveIcon(template.icon);
                                        const isLoading = loading === template.id;
                                        const colorVar = getColorVar(template.colorClass);

                                        return (
                                            <motion.button
                                                key={template.id}
                                                layout
                                                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                                                animate={{
                                                    opacity: 1,
                                                    scale: 1,
                                                    y: 0,
                                                    transition: { delay: idx * 0.05 }
                                                }}
                                                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                                onClick={() => applyTemplate(template)}
                                                disabled={!!loading}
                                                className={cn(
                                                    'group relative flex flex-col p-5 rounded-2xl text-left transition-all duration-300',
                                                    'bg-forge-surface/30 border border-forge-border/40 backdrop-blur-sm',
                                                    'hover:bg-forge-surface/60 hover:border-accent-primary/40 hover:shadow-xl hover:shadow-accent-primary/5 hover:-translate-y-1',
                                                    isLoading && 'opacity-50 pointer-events-none'
                                                )}
                                            >
                                                {/* Card Header: Icon + Blocks count */}
                                                <div className="flex items-start justify-between mb-4">
                                                    <div
                                                        className="w-12 h-12 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110"
                                                        style={{
                                                            backgroundColor: `hsl(${colorVar} / 0.1)`,
                                                            border: `1px solid hsl(${colorVar} / 0.25)`,
                                                            boxShadow: `0 0 20px hsl(${colorVar} / 0.1)`,
                                                        }}
                                                    >
                                                        <Icon
                                                            className="w-6 h-6"
                                                            style={{ color: `hsl(${colorVar})` }}
                                                        />
                                                    </div>
                                                    <Badge variant="outline" className="bg-forge-bg/60 border-forge-border/30 text-[10px] font-mono px-2 py-0.5 rounded-lg text-forge-text-secondary group-hover:text-accent-primary transition-colors">
                                                        {template.nodes.length} BLOCKS
                                                        {template.ghostNodes.length > 0 && ` + ${template.ghostNodes.length}`}
                                                    </Badge>
                                                </div>

                                                {/* Content */}
                                                <div className="flex-1 mb-6">
                                                    <h3 className="text-lg font-bold text-white mb-2 group-hover:text-accent-primary transition-colors">
                                                        {template.name}
                                                    </h3>
                                                    <p className="text-sm text-forge-text-secondary line-clamp-2 leading-relaxed group-hover:text-white transition-colors">
                                                        {template.description}
                                                    </p>
                                                </div>

                                                {/* Footer: Tags + Action */}
                                                <div className="pt-4 border-t border-forge-border/20 flex items-center justify-between">
                                                    <div className="flex flex-wrap gap-1.5 max-w-[70%] text-forge-text-secondary group-hover:text-white transition-colors">
                                                        {template.tags.slice(0, 3).map((tag) => (
                                                            <span
                                                                key={tag}
                                                                className="text-[10px] uppercase tracking-wider font-semibold"
                                                            >
                                                                # {tag}
                                                            </span>
                                                        ))}
                                                    </div>

                                                    <div className="w-8 h-8 rounded-full bg-forge-bg/80 border border-forge-border/40 flex items-center justify-center group-hover:bg-accent-primary group-hover:text-black transition-all duration-300 group-hover:border-transparent">
                                                        <ArrowRight className="w-4 h-4" />
                                                    </div>
                                                </div>

                                                {/* Loading overlay */}
                                                {isLoading && (
                                                    <div className="absolute inset-0 z-10 flex items-center justify-center bg-forge-bg/60 rounded-2xl backdrop-blur-[2px]">
                                                        <div className="flex flex-col items-center gap-3">
                                                            <div className="w-8 h-8 border-2 border-accent-primary/20 border-t-accent-primary rounded-full animate-spin" />
                                                            <span className="text-xs font-medium text-accent-primary">Applying...</span>
                                                        </div>
                                                    </div>
                                                )}
                                            </motion.button>
                                        );
                                    })
                                ) : (
                                    <div className="col-span-full py-20 flex flex-col items-center justify-center text-center">
                                        <div className="w-16 h-16 rounded-2xl bg-forge-surface flex items-center justify-center mb-4 border border-forge-border/50">
                                            <Filter className="w-8 h-8 text-forge-text-secondary" />
                                        </div>
                                        <h3 className="text-xl font-bold text-white mb-2">No templates found</h3>
                                        <p className="text-forge-text-secondary max-w-sm">
                                            We couldn&apos;t find any templates matching your current filters or search query.
                                        </p>
                                        <button
                                            onClick={() => { setActiveCategory('all'); setSearchQuery(''); }}
                                            className="mt-6 text-sm font-medium text-accent-primary hover:underline"
                                        >
                                            Clear all filters
                                        </button>
                                    </div>
                                )}
                            </AnimatePresence>
                        </div>
                    </DialogBody>
                </div>

                {/* Footer Info */}
                <div className="p-4 bg-forge-bg/40 border-t border-forge-border/40">
                    <div className="flex items-center justify-center gap-2 text-xs text-forge-text-secondary">
                        <Sparkles className="w-3.5 h-3.5 text-accent-primary/60" />
                        <span>Selecting a template will replace your current workspace. Shimmer blocks are smart suggestions.</span>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
