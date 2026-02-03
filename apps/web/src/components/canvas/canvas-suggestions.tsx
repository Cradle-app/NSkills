'use client';

import { memo, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAccount } from 'wagmi';
import {
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
    Plus,
    Link2,
    type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useBlueprintStore } from '@/store/blueprint';
import { useAuthStore } from '@/store/auth';
import { useContextualSuggestions, type SuggestedPlugin } from '@/hooks/use-suggested-plugins';
import type { PluginIcon } from '@cradle/plugin-config';

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

function getIconComponent(iconName: PluginIcon): LucideIcon {
    return ICON_MAP[iconName] || Box;
}

interface SuggestionCardProps {
    suggestion: SuggestedPlugin;
    index: number;
    onAdd: (pluginId: string) => void;
}

/**
 * Individual suggestion card that appears on canvas
 */
const SuggestionCard = memo(function SuggestionCard({
    suggestion,
    index,
    onAdd,
}: SuggestionCardProps) {
    const Icon = getIconComponent(suggestion.icon);

    const reasonLabel = {
        required: 'Required',
        suggested: 'Recommended',
        compatible: 'Works with',
    };

    const reasonStyles = {
        required: 'border-red-500/40 bg-red-500/10',
        suggested: 'border-accent-cyan/40 bg-accent-cyan/10',
        compatible: 'border-green-500/40 bg-green-500/10',
    };

    const badgeStyles = {
        required: 'bg-red-500/20 text-red-400 border-red-500/30',
        suggested: 'bg-accent-cyan/20 text-accent-cyan border-accent-cyan/30',
        compatible: 'bg-green-500/20 text-green-400 border-green-500/30',
    };

    const handleClick = useCallback(() => {
        onAdd(suggestion.id);
    }, [onAdd, suggestion.id]);

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9, x: -10 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.9, x: 10 }}
            transition={{ delay: index * 0.05, type: 'spring', stiffness: 400, damping: 30 }}
            className="pointer-events-auto"
        >
            <div
                onClick={handleClick}
                className={cn(
                    'group cursor-pointer rounded-lg border-2 border-dashed p-2 backdrop-blur-sm',
                    'w-[140px] hover:scale-105 hover:border-solid',
                    reasonStyles[suggestion.reason]
                )}
            >
                {/* Add indicator */}
                <div className="absolute -right-1.5 -top-1.5 z-10 opacity-0 group-hover:opacity-100">
                    <div className="flex h-4 w-4 items-center justify-center rounded-full bg-accent-cyan text-white shadow-md">
                        <Link2 className="h-2.5 w-2.5" />
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {/* Icon */}
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-white/5">
                        <Icon className="h-3 w-3 text-white/80" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                        <span className="text-[10px] font-medium text-white truncate block">
                            {suggestion.name}
                        </span>
                        <span
                            className={cn(
                                'inline-flex text-[7px] px-1 rounded border font-medium',
                                badgeStyles[suggestion.reason]
                            )}
                        >
                            {reasonLabel[suggestion.reason]}
                        </span>
                    </div>
                </div>
            </div>
        </motion.div>
    );
});

// Card dimensions
const CARD_HEIGHT = 50;
const CARD_GAP = 8;

/**
 * Container for all canvas-based suggestions
 * Shows suggestion cards in a fixed position relative to the source node
 */
export function CanvasSuggestions() {
    const { suggestions, hasSuggestions, sourceNodeId, sourceNodePosition } = useContextualSuggestions();
    const nodes = useBlueprintStore((state) => state.blueprint.nodes);
    const addNode = useBlueprintStore((state) => state.addNode);
    const addEdge = useBlueprintStore((state) => state.addEdge);

    // Auth checks - must match blueprint-canvas.tsx behavior
    const { isConnected } = useAccount();
    const { isWalletConnected, openAuthModal } = useAuthStore();

    // Get only top 3 suggestions
    const visibleSuggestions = useMemo(() => {
        return suggestions.slice(0, 3);
    }, [suggestions]);

    // Handle adding node AND auto-connecting to source - with auth check!
    const handleAdd = useCallback(
        (pluginId: string) => {
            // Auth check - same as blueprint-canvas.tsx onDrop
            const walletConnected = isConnected || isWalletConnected;
            if (!walletConnected) {
                openAuthModal();
                return;
            }

            // Position to the right of the source node
            const position = sourceNodePosition
                ? { x: sourceNodePosition.x + 250, y: sourceNodePosition.y }
                : { x: 300, y: 200 };

            const newNode = addNode(pluginId, position);

            // Auto-connect to source node
            if (newNode && sourceNodeId) {
                addEdge(sourceNodeId, newNode.id);
            }
        },
        [addNode, addEdge, sourceNodeId, sourceNodePosition, isConnected, isWalletConnected, openAuthModal]
    );

    if (!hasSuggestions || !sourceNodePosition) return null;

    // Position the suggestion panel to the right of the source node
    const panelX = sourceNodePosition.x + 220;
    const panelY = sourceNodePosition.y;

    return (
        <div className="pointer-events-none absolute inset-0 z-20">
            {/* Suggestion panel positioned near source node */}
            <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                style={{
                    position: 'absolute',
                    left: panelX,
                    top: panelY,
                }}
                className="flex flex-col gap-2"
            >
                {/* Header */}
                <div className="flex items-center gap-1.5 text-[9px] text-accent-cyan/80 pointer-events-none mb-1">
                    <Sparkles className="h-3 w-3" />
                    <span className="font-medium">Suggestions</span>
                </div>

                {/* Cards */}
                <AnimatePresence mode="popLayout">
                    {visibleSuggestions.map((suggestion, idx) => (
                        <SuggestionCard
                            key={suggestion.id}
                            suggestion={suggestion}
                            index={idx}
                            onAdd={handleAdd}
                        />
                    ))}
                </AnimatePresence>
            </motion.div>
        </div>
    );
}
