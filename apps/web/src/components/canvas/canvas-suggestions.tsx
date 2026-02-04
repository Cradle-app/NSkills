'use client';

import { memo, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useReactFlow, useViewport } from 'reactflow';
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
    Fuel,
    DollarSign,
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
const ICON_MAP: Record<string, LucideIcon> = {
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
    Fuel,
    DollarSign,
};

function getIconComponent(iconName: PluginIcon): LucideIcon {
    return ICON_MAP[iconName] || Box;
}

// Suggestion node dimensions (compact version)
const SUGGESTION_NODE_WIDTH = 150;
const SUGGESTION_NODE_HEIGHT = 52;
const NODE_GAP = 20;
const SOURCE_NODE_WIDTH = 180;  // Match ForgeNode width
const SOURCE_NODE_HEIGHT = 80;  // Approximate ForgeNode height

interface Position {
    x: number;
    y: number;
}

interface NodeRect {
    x: number;
    y: number;
    width: number;
    height: number;
}

interface SuggestionGhostNodeProps {
    suggestion: SuggestedPlugin;
    screenPosition: Position;  // Screen coordinates for display
    flowPosition: Position;    // Flow coordinates for node placement
    index: number;
    onAdd: (pluginId: string, flowPosition: Position) => void;
}

/**
 * Ghost node suggestion - appears as a greyscale preview of what the node would look like
 * Positioned using screen coordinates (fixed position relative to canvas container)
 */
const SuggestionGhostNode = memo(function SuggestionGhostNode({
    suggestion,
    screenPosition,
    flowPosition,
    index,
    onAdd,
}: SuggestionGhostNodeProps) {
    const Icon = getIconComponent(suggestion.icon);

    const reasonLabel = {
        required: 'Required',
        suggested: 'Suggested',
        compatible: 'Compatible',
    };

    const handleClick = useCallback((event: React.MouseEvent) => {
        event.stopPropagation();
        // Pass the flow position for node placement
        onAdd(suggestion.id, flowPosition);
    }, [onAdd, suggestion.id, flowPosition]);

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.85 }}
            transition={{
                delay: index * 0.06,
                type: 'spring',
                stiffness: 350,
                damping: 28
            }}
            className="pointer-events-auto absolute group"
            style={{
                left: screenPosition.x,
                top: screenPosition.y,
                width: SUGGESTION_NODE_WIDTH,
            }}
        >

            {/* Ghost node card */}
            <div
                onClick={handleClick}
                className={cn(
                    'relative cursor-pointer rounded-lg border border-dashed backdrop-blur-sm',
                    'border-white/20 bg-forge-surface/25',
                    'transition-all duration-200 ease-out',
                    'hover:border-white/50 hover:border-solid hover:bg-forge-surface/50 hover:scale-[1.03]',
                    'hover:shadow-[0_0_20px_-4px_rgba(255,255,255,0.2)]',
                    // Greyscale filter that removes on hover
                    'grayscale hover:grayscale-0'
                )}
            >
                {/* Gradient overlay - subtle in greyscale */}
                <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-white/5 via-transparent to-transparent opacity-40 group-hover:opacity-60" />

                {/* Top accent line - white/grey by default */}
                <div className="absolute top-0 left-2.5 right-2.5 h-[1px] rounded-full bg-white/20 group-hover:bg-accent-cyan/50 transition-colors duration-200" />

                {/* Node content */}
                <div className="relative p-2">
                    <div className="flex items-center gap-2">
                        {/* Icon container */}
                        <div className={cn(
                            'w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0',
                            'bg-white/5 border border-white/10',
                            'group-hover:bg-white/10 group-hover:border-white/20 transition-all duration-200'
                        )}>
                            <Icon className="w-3.5 h-3.5 text-white/40 group-hover:text-white/80 transition-colors duration-200" />
                        </div>

                        {/* Label and badge */}
                        <div className="flex-1 min-w-0">
                            <p className="text-[11px] font-medium text-white/50 truncate leading-tight group-hover:text-white/90 transition-colors duration-200">
                                {suggestion.name}
                            </p>
                            <span className={cn(
                                'inline-flex text-[8px] px-1 py-0.5 rounded mt-0.5 font-medium',
                                'bg-white/5 text-white/35 border border-white/5',
                                'group-hover:bg-accent-cyan/15 group-hover:text-accent-cyan group-hover:border-accent-cyan/25',
                                'transition-all duration-200'
                            )}>
                                {reasonLabel[suggestion.reason]}
                            </span>
                        </div>

                        {/* Add button - appears on hover */}
                        <div className={cn(
                            'flex items-center justify-center w-5 h-5 rounded-md',
                            'bg-white/5 text-white/25',
                            'opacity-0 group-hover:opacity-100',
                            'group-hover:bg-accent-cyan/20 group-hover:text-accent-cyan',
                            'transition-all duration-200'
                        )}>
                            <Plus className="w-3 h-3" />
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
});

/**
 * Check if two rectangles overlap
 */
function rectsOverlap(a: NodeRect, b: NodeRect, padding: number = 10): boolean {
    return !(
        a.x + a.width + padding < b.x ||
        b.x + b.width + padding < a.x ||
        a.y + a.height + padding < b.y ||
        b.y + b.height + padding < a.y
    );
}

/**
 * Direction for placing suggestions
 */
type PlacementDirection = 'top' | 'right' | 'bottom' | 'left';

/**
 * Calculate space available in each direction around the source node
 */
function findBestPlacementDirection(
    sourcePosition: Position,
    existingNodes: Array<{ position: Position }>,
    suggestionCount: number
): PlacementDirection {
    const sourceRect: NodeRect = {
        x: sourcePosition.x,
        y: sourcePosition.y,
        width: SOURCE_NODE_WIDTH,
        height: SOURCE_NODE_HEIGHT,
    };

    // Calculate the total space needed for suggestions
    const totalWidth = suggestionCount * SUGGESTION_NODE_WIDTH + (suggestionCount - 1) * (NODE_GAP / 2);
    const totalHeight = SUGGESTION_NODE_HEIGHT;
    const spacing = NODE_GAP + 15;

    // Check each direction for available space
    const directions: PlacementDirection[] = ['top', 'right', 'bottom', 'left'];
    const directionScores: Record<PlacementDirection, number> = {
        top: 100,
        right: 80,
        bottom: 60,
        left: 40,
    };

    for (const node of existingNodes) {
        const nodeRect: NodeRect = {
            x: node.position.x,
            y: node.position.y,
            width: SOURCE_NODE_WIDTH,
            height: SOURCE_NODE_HEIGHT,
        };

        // Skip the source node itself
        if (nodeRect.x === sourceRect.x && nodeRect.y === sourceRect.y) continue;

        // Check if node blocks each direction
        // Top
        if (nodeRect.y < sourceRect.y - spacing &&
            nodeRect.y + nodeRect.height > sourceRect.y - totalHeight - spacing * 2 &&
            nodeRect.x < sourceRect.x + sourceRect.width + totalWidth / 2 &&
            nodeRect.x + nodeRect.width > sourceRect.x - totalWidth / 2) {
            directionScores.top -= 30;
        }

        // Right
        if (nodeRect.x > sourceRect.x + sourceRect.width - spacing &&
            nodeRect.x < sourceRect.x + sourceRect.width + totalWidth + spacing * 2 &&
            nodeRect.y < sourceRect.y + sourceRect.height &&
            nodeRect.y + nodeRect.height > sourceRect.y - totalHeight) {
            directionScores.right -= 30;
        }

        // Bottom
        if (nodeRect.y > sourceRect.y + sourceRect.height - spacing &&
            nodeRect.y < sourceRect.y + sourceRect.height + totalHeight + spacing * 2 &&
            nodeRect.x < sourceRect.x + sourceRect.width + totalWidth / 2 &&
            nodeRect.x + nodeRect.width > sourceRect.x - totalWidth / 2) {
            directionScores.bottom -= 30;
        }

        // Left
        if (nodeRect.x < sourceRect.x + spacing &&
            nodeRect.x + nodeRect.width > sourceRect.x - totalWidth - spacing * 2 &&
            nodeRect.y < sourceRect.y + sourceRect.height &&
            nodeRect.y + nodeRect.height > sourceRect.y - totalHeight) {
            directionScores.left -= 30;
        }
    }

    // Return direction with highest score
    return directions.reduce((best, dir) =>
        directionScores[dir] > directionScores[best] ? dir : best
        , 'top');
}

/**
 * Calculate positions for suggestion nodes clustered together near the source node,
 * finding the best available space (top, right, left, or bottom)
 */
function calculateSuggestionPositions(
    sourcePosition: Position,
    existingNodes: Array<{ position: Position }>,
    suggestionCount: number
): Array<{ position: Position }> {
    const results: Array<{ position: Position }> = [];
    if (suggestionCount === 0) return results;

    // Find best direction to place suggestions
    const direction = findBestPlacementDirection(sourcePosition, existingNodes, suggestionCount);

    // Compact spacing for clustering suggestions close together
    const compactGap = NODE_GAP / 2; // Tighter gap between suggestions
    const distanceFromNode = NODE_GAP + 10; // Distance from the main node

    // Source node bounds
    const sourceCenterX = sourcePosition.x + SOURCE_NODE_WIDTH / 2;
    const sourceCenterY = sourcePosition.y + SOURCE_NODE_HEIGHT / 2;

    // Calculate positions based on direction
    for (let i = 0; i < suggestionCount; i++) {
        let x: number, y: number;
        const offsetFromCenter = i - (suggestionCount - 1) / 2;

        switch (direction) {
            case 'top': {
                // Horizontal layout above the node
                const totalWidth = suggestionCount * SUGGESTION_NODE_WIDTH + (suggestionCount - 1) * compactGap;
                x = sourceCenterX - totalWidth / 2 + i * (SUGGESTION_NODE_WIDTH + compactGap);
                y = sourcePosition.y - SUGGESTION_NODE_HEIGHT - distanceFromNode;
                // Slight arc effect - outer ones slightly lower
                y += Math.abs(offsetFromCenter) * 8;
                break;
            }
            case 'right': {
                // Vertical layout to the right of the node
                x = sourcePosition.x + SOURCE_NODE_WIDTH + distanceFromNode;
                const totalHeight = suggestionCount * SUGGESTION_NODE_HEIGHT + (suggestionCount - 1) * compactGap;
                y = sourceCenterY - totalHeight / 2 + i * (SUGGESTION_NODE_HEIGHT + compactGap);
                // Slight arc effect - outer ones slightly to the right
                x += Math.abs(offsetFromCenter) * 8;
                break;
            }
            case 'bottom': {
                // Horizontal layout below the node
                const totalWidth = suggestionCount * SUGGESTION_NODE_WIDTH + (suggestionCount - 1) * compactGap;
                x = sourceCenterX - totalWidth / 2 + i * (SUGGESTION_NODE_WIDTH + compactGap);
                y = sourcePosition.y + SOURCE_NODE_HEIGHT + distanceFromNode;
                // Slight arc effect - outer ones slightly lower
                y += Math.abs(offsetFromCenter) * 8;
                break;
            }
            case 'left': {
                // Vertical layout to the left of the node
                x = sourcePosition.x - SUGGESTION_NODE_WIDTH - distanceFromNode;
                const totalHeight = suggestionCount * SUGGESTION_NODE_HEIGHT + (suggestionCount - 1) * compactGap;
                y = sourceCenterY - totalHeight / 2 + i * (SUGGESTION_NODE_HEIGHT + compactGap);
                // Slight arc effect - outer ones slightly to the left
                x -= Math.abs(offsetFromCenter) * 8;
                break;
            }
        }

        results.push({ position: { x, y } });
    }

    return results;
}

/**
 * Convert flow coordinates to screen coordinates
 */
function flowToScreen(flowPos: Position, viewport: { x: number; y: number; zoom: number }): Position {
    return {
        x: flowPos.x * viewport.zoom + viewport.x,
        y: flowPos.y * viewport.zoom + viewport.y,
    };
}

/**
 * Inner component that uses ReactFlow hooks (must be inside ReactFlowProvider)
 */
function CanvasSuggestionsInner() {
    const { suggestions, hasSuggestions, sourceNodeId, sourceNodePosition } = useContextualSuggestions();
    const nodes = useBlueprintStore((state) => state.blueprint.nodes);
    const addNode = useBlueprintStore((state) => state.addNode);
    const addEdge = useBlueprintStore((state) => state.addEdge);

    // Get viewport for coordinate transformation
    const { x: viewportX, y: viewportY, zoom } = useViewport();
    const viewport = { x: viewportX, y: viewportY, zoom };

    // Auth checks - must match blueprint-canvas.tsx behavior
    const { isConnected } = useAccount();
    const { isWalletConnected, openAuthModal } = useAuthStore();

    // Get only top 3 suggestions
    const visibleSuggestions = useMemo(() => {
        return suggestions.slice(0, 3);
    }, [suggestions]);

    // Calculate positions in flow coordinates relative to source node
    const suggestionFlowPositions = useMemo(() => {
        if (!sourceNodePosition) return [];
        return calculateSuggestionPositions(
            sourceNodePosition,
            nodes.map(n => ({ position: n.position })),
            visibleSuggestions.length
        );
    }, [sourceNodePosition, nodes, visibleSuggestions.length]);

    // Convert flow positions to screen positions
    const suggestionScreenPositions = useMemo(() => {
        return suggestionFlowPositions.map(item => ({
            flowPosition: item.position,
            screenPosition: flowToScreen(item.position, viewport),
        }));
    }, [suggestionFlowPositions, viewport]);

    // Handle adding node AND auto-connecting to source - with auth check!
    // Uses the suggestion's flow position for proper placement
    const handleAdd = useCallback(
        (pluginId: string, flowPosition: Position) => {
            // Auth check - openAuthModal now properly checks both wallet AND GitHub session
            const walletConnected = isConnected || isWalletConnected;
            if (!walletConnected) {
                openAuthModal(() => {
                    const newNode = addNode(pluginId, flowPosition);
                    if (newNode && sourceNodeId) {
                        addEdge(sourceNodeId, newNode.id);
                    }
                });
                return;
            }

            // If wallet is connected, let openAuthModal verify full auth (including GitHub session)
            openAuthModal(() => {
                const newNode = addNode(pluginId, flowPosition);
                if (newNode && sourceNodeId) {
                    addEdge(sourceNodeId, newNode.id);
                }
            });
        },
        [addNode, addEdge, sourceNodeId, isConnected, isWalletConnected, openAuthModal]
    );

    if (!hasSuggestions || !sourceNodePosition) return null;

    return (
        <div className="pointer-events-none absolute inset-0 z-10">
            <AnimatePresence mode="popLayout">
                {visibleSuggestions.map((suggestion, idx) => {
                    const posData = suggestionScreenPositions[idx];
                    if (!posData) return null;

                    return (
                        <SuggestionGhostNode
                            key={suggestion.id}
                            suggestion={suggestion}
                            screenPosition={posData.screenPosition}
                            flowPosition={posData.flowPosition}
                            index={idx}
                            onAdd={handleAdd}
                        />
                    );
                })}
            </AnimatePresence>
        </div>
    );
}

/**
 * Container for all canvas-based suggestions
 * Shows ghost nodes floating around the selected node in empty canvas space
 * This component must be rendered inside ReactFlowProvider
 */
export function CanvasSuggestions() {
    return <CanvasSuggestionsInner />;
}
