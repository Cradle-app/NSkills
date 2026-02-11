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
import { useAuthGuard } from '@/components/auth/auth-guard';
import { createPortal } from 'react-dom';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

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
    const { checkFullAuth } = useAuthGuard();
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
            const node = addNode(nodeConfig.type, nodeConfig.position, nodeConfig.config);
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
            const ghost = addGhostNode(gn.type, position, { config: gn.config });
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

    if (typeof document === 'undefined') return null;

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 z-modal-backdrop bg-black/70 backdrop-blur-sm"
                    />

                    {/* Modal Container */}
                    <div className="fixed inset-0 z-modal flex items-center justify-center p-4 pointer-events-none">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="w-full max-w-6xl h-[85vh] flex flex-col pointer-events-auto bg-[#0a0b0e] border border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden shadow-black/80 relative"
                        >
                            {/* Background Effects */}
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-accent-primary/5 via-transparent to-transparent opacity-50" />
                            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150" />
                            {/* Custom Header */}
                            <div className="relative p-8 pb-4 z-10">
                                <button
                                    onClick={onClose}
                                    className="absolute right-8 top-8 p-2 rounded-full text-white/40 hover:text-white hover:bg-white/10 transition-all duration-300"
                                >
                                    <X className="w-6 h-6" />
                                </button>

                                <div className="flex flex-col gap-2">
                                    <h2 className="text-4xl font-bold text-white tracking-tight">
                                        Starter Templates
                                    </h2>
                                    <p className="text-white/50 text-lg font-light max-w-2xl">
                                        Select a neural foundation for your next project. All templates are optimized for the Cradle engine.
                                    </p>
                                </div>
                            </div>

                            <div className="flex-1 flex flex-col overflow-hidden relative z-10">
                                {/* Toolbar: Search + Category Dropdown */}
                                <div className="px-8 py-6 flex flex-col md:flex-row gap-4 items-center justify-between pointer-events-auto">
                                    <div className="w-full md:w-72 relative group">
                                        <div className="absolute -inset-0.5 bg-gradient-to-r from-accent-primary/50 to-accent-secondary/50 rounded-xl blur opacity-20 group-hover:opacity-40 transition duration-500" />
                                        <Input
                                            placeholder="Search templates..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            leftIcon={<Search className="w-4 h-4 text-accent-primary" />}
                                            className="bg-black/50 border-white/10 h-12 rounded-xl focus:ring-accent-primary/20 text-md placeholder:text-white/30 relative z-10"
                                        />
                                    </div>

                                    <div className="w-full md:w-64 relative group">
                                        <div className="absolute -inset-0.5 bg-gradient-to-r from-forge-border to-white/20 rounded-xl blur opacity-20 group-hover:opacity-30 transition duration-500" />
                                        <Select
                                            value={activeCategory}
                                            onValueChange={(val) => setActiveCategory(val as TemplateCategory | 'all')}
                                        >
                                            <SelectTrigger className="h-12 bg-black/50 border-white/10 rounded-xl text-white/90 relative z-10">
                                                <div className="flex items-center gap-2">
                                                    <Filter className="w-4 h-4 text-accent-cyan" />
                                                    <span className="font-medium">
                                                        {activeCategory === 'all'
                                                            ? 'All Categories'
                                                            : TEMPLATE_CATEGORIES.find(c => c.id === activeCategory)?.label}
                                                    </span>
                                                </div>
                                            </SelectTrigger>
                                            <SelectContent className="bg-[#0f1115] border-white/10 text-white">
                                                {/* <SelectItem value="all" className="focus:bg-white/5 focus:text-accent-primary">
                                                    <div className="flex items-center justify-between w-full min-w-[120px]">
                                                        <span>All Categories</span>
                                                        <span className="text-xs font-mono text-white/40">{categoryCounts['all']}</span>
                                                    </div>
                                                </SelectItem> */}
                                                {TEMPLATE_CATEGORIES.map((cat) => (
                                                    <SelectItem
                                                        key={cat.id}
                                                        value={cat.id}
                                                        className="focus:bg-white/5 focus:text-accent-primary"
                                                    >
                                                        <div className="flex items-center justify-between w-full min-w-[120px]">
                                                            <span>{cat.label}</span>
                                                            <span className="text-xs font-mono text-white/40">
                                                                {categoryCounts[cat.id] || 0}
                                                            </span>
                                                        </div>
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                {/* Templates Grid */}
                                <div className="flex-1 overflow-y-auto p-8 scroll-smooth custom-scrollbar">
                                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
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
                                                                // transition: { delay: idx * 0.05 }
                                                            }}
                                                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                                            onClick={() => checkFullAuth(() => applyTemplate(template))}
                                                            disabled={!!loading}
                                                            className={cn(
                                                                'group relative flex flex-col p-6 rounded-[2rem] text-left transition-all duration-500',
                                                                'bg-[#0f1115]/80 border border-white/5 backdrop-blur-xl',
                                                                'hover:border-accent-primary/40 hover:bg-[#1a1d24] hover:-translate-y-2 hover:shadow-[0_20px_40px_-10px_rgba(0,0,0,0.5)]',
                                                                isLoading && 'opacity-50 pointer-events-none'
                                                            )}
                                                        >
                                                            {/* Hover Glow Effect */}
                                                            <div className="absolute inset-0 rounded-[2rem] opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                                                            {/* Card Header: Icon + Blocks count */}
                                                            <div className="relative z-10 flex items-start justify-between mb-8">
                                                                <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shadow-inner">
                                                                    <Icon className="w-6 h-6 text-white/70 group-hover:text-white transition-colors" />
                                                                </div>
                                                                <Badge variant="outline" className="bg-black/30 border-white/10 text-[10px] font-mono tracking-wider px-3 py-1.5 rounded-full text-white/50 group-hover:text-white group-hover:border-accent-primary/30 transition-all">
                                                                    {template.nodes.length} BLOCKS
                                                                    {template.ghostNodes.length > 0 && ` + SUGGESTIONS`}
                                                                </Badge>
                                                            </div>

                                                            {/* Content */}
                                                            <div className="flex-1 mb-8">
                                                                <h3 className="text-xl font-bold text-white mb-2.5 group-hover:text-accent-primary transition-colors">
                                                                    {template.name}
                                                                </h3>
                                                                <p className="text-[15px] text-forge-text-secondary line-clamp-2 leading-relaxed group-hover:text-white/90 transition-colors">
                                                                    {template.description}
                                                                </p>
                                                            </div>

                                                            {/* Footer: Tags + Action */}
                                                            <div className="pt-6 border-t border-forge-border/20 flex items-center justify-between gap-2">
                                                                <div className="flex flex-wrap gap-2 text-forge-text-secondary group-hover:text-white transition-colors">
                                                                    {template.tags.slice(0, 3).map((tag) => (
                                                                        <span
                                                                            key={tag}
                                                                            className="text-[11px] uppercase tracking-widest font-bold opacity-60"
                                                                        >
                                                                            # {tag}
                                                                        </span>
                                                                    ))}
                                                                </div>

                                                                <div className="rounded-2xl bg-forge-bg/80 border border-forge-border/40 flex items-center justify-center group-hover:bg-accent-primary group-hover:after:opacity-100 transition-all duration-300 group-hover:border-transparent group-hover:text-black">
                                                                    <ArrowRight className="w-5 h-5 m-3" />
                                                                </div>
                                                            </div>

                                                            {/* Loading overlay */}
                                                            {isLoading && (
                                                                <div className="absolute inset-0 z-10 flex items-center justify-center bg-forge-bg/80 rounded-[1.75rem] backdrop-blur-md">
                                                                    <div className="flex flex-col items-center gap-4">
                                                                        <div className="w-10 h-10 border-[3px] border-accent-primary/20 border-t-accent-primary rounded-full animate-spin shadow-lg shadow-accent-primary/20" />
                                                                        <span className="text-sm font-bold text-accent-primary tracking-widest uppercase">Initializing...</span>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </motion.button>
                                                    );
                                                })
                                            ) : (
                                                <div className="col-span-full py-32 flex flex-col items-center justify-center text-center">
                                                    <div className="w-20 h-20 rounded-[2rem] bg-forge-surface flex items-center justify-center mb-6 border border-forge-border/50 shadow-xl">
                                                        <Filter className="w-10 h-10 text-forge-text-secondary opacity-50" />
                                                    </div>
                                                    <h3 className="text-2xl font-bold text-white mb-3">No matching templates</h3>
                                                    <p className="text-forge-text-secondary max-w-sm text-lg">
                                                        Try adjusting your filters or search query to find the right start for your flow.
                                                    </p>
                                                    <button
                                                        onClick={() => { setActiveCategory('all'); setSearchQuery(''); }}
                                                        className="mt-8 px-6 py-2.5 rounded-xl bg-accent-primary/10 border border-accent-primary/20 text-sm font-bold text-accent-primary hover:bg-accent-primary/20 transition-all"
                                                    >
                                                        Clear all filters
                                                    </button>
                                                </div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </div>
                            </div>

                            {/* Footer Info */}
                            <div className="px-8 py-5 bg-forge-bg/60 border-t border-forge-border/40 backdrop-blur-md">
                                <div className="flex items-center justify-center gap-3 text-sm text-forge-text-secondary font-medium">
                                    <Sparkles className="w-4 h-4 text-accent-primary" />
                                    <span>Selecting a template will replace your current workspace. Shimmer blocks are smart suggestions.</span>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>,
        document.body
    );
}
