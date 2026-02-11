'use client';

import { useEffect, useRef, useMemo } from 'react';
import { useBlueprintStore } from '@/store/blueprint';
import { useContextualSuggestions } from '@/hooks/use-suggested-plugins';

// Dimensions matching ForgeNode.tsx
const GHOST_NODE_WIDTH = 200;
const GHOST_NODE_HEIGHT = 80;
const NODE_GAP = 40;
const SOURCE_NODE_WIDTH = 200;
const SOURCE_NODE_HEIGHT = 80;

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
    const totalWidth = suggestionCount * GHOST_NODE_WIDTH + (suggestionCount - 1) * (NODE_GAP / 2);
    const totalHeight = GHOST_NODE_HEIGHT;
    const spacing = NODE_GAP + 15;

    // Check each direction for available space
    const directions: PlacementDirection[] = ['top', 'right', 'bottom', 'left'];
    const directionScores: Record<PlacementDirection, number> = {
        right: 100, // Prefer right
        bottom: 80,
        top: 60,
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
            directionScores.top -= 50;
        }

        // Right
        if (nodeRect.x > sourceRect.x + sourceRect.width - spacing &&
            nodeRect.x < sourceRect.x + sourceRect.width + totalWidth + spacing * 2 &&
            nodeRect.y < sourceRect.y + sourceRect.height &&
            nodeRect.y + nodeRect.height > sourceRect.y - totalHeight) {
            directionScores.right -= 50;
        }

        // Bottom
        if (nodeRect.y > sourceRect.y + sourceRect.height - spacing &&
            nodeRect.y < sourceRect.y + sourceRect.height + totalHeight + spacing * 2 &&
            nodeRect.x < sourceRect.x + sourceRect.width + totalWidth / 2 &&
            nodeRect.x + nodeRect.width > sourceRect.x - totalWidth / 2) {
            directionScores.bottom -= 50;
        }

        // Left
        if (nodeRect.x < sourceRect.x + spacing &&
            nodeRect.x + nodeRect.width > sourceRect.x - totalWidth - spacing * 2 &&
            nodeRect.y < sourceRect.y + sourceRect.height &&
            nodeRect.y + nodeRect.height > sourceRect.y - totalHeight) {
            directionScores.left -= 50;
        }
    }

    // Return direction with highest score
    return directions.reduce((best, dir) =>
        directionScores[dir] > directionScores[best] ? dir : best
        , 'right');
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
    const compactGap = NODE_GAP;
    const distanceFromNode = NODE_GAP + 60; // Extra distance to give ghost nodes some "air"

    // Source node bounds
    const sourceCenterX = sourcePosition.x + SOURCE_NODE_WIDTH / 2;
    const sourceCenterY = sourcePosition.y + SOURCE_NODE_HEIGHT / 2;

    // Calculate positions based on direction
    for (let i = 0; i < suggestionCount; i++) {
        let x: number, y: number;
        const offsetFromCenter = i - (suggestionCount - 1) / 2;

        switch (direction) {
            case 'top': {
                const totalWidth = suggestionCount * GHOST_NODE_WIDTH + (suggestionCount - 1) * compactGap;
                x = sourceCenterX - totalWidth / 2 + i * (GHOST_NODE_WIDTH + compactGap);
                y = sourcePosition.y - GHOST_NODE_HEIGHT - distanceFromNode;
                y += Math.abs(offsetFromCenter) * 15;
                break;
            }
            case 'right': {
                x = sourcePosition.x + SOURCE_NODE_WIDTH + distanceFromNode;
                const totalHeight = suggestionCount * GHOST_NODE_HEIGHT + (suggestionCount - 1) * compactGap;
                y = sourceCenterY - totalHeight / 2 + i * (GHOST_NODE_HEIGHT + compactGap);
                x += Math.abs(offsetFromCenter) * 15;
                break;
            }
            case 'bottom': {
                const totalWidth = suggestionCount * GHOST_NODE_WIDTH + (suggestionCount - 1) * compactGap;
                x = sourceCenterX - totalWidth / 2 + i * (GHOST_NODE_WIDTH + compactGap);
                y = sourcePosition.y + SOURCE_NODE_HEIGHT + distanceFromNode;
                y += Math.abs(offsetFromCenter) * 15;
                break;
            }
            case 'left': {
                x = sourcePosition.x - GHOST_NODE_WIDTH - distanceFromNode;
                const totalHeight = suggestionCount * GHOST_NODE_HEIGHT + (suggestionCount - 1) * compactGap;
                y = sourceCenterY - totalHeight / 2 + i * (GHOST_NODE_HEIGHT + compactGap);
                x -= Math.abs(offsetFromCenter) * 15;
                break;
            }
        }

        results.push({ position: { x, y } });
    }

    return results;
}

/**
 * CanvasSuggestions logic component.
 * It watches for contextual suggestions and populates the store's ghost system.
 * This ensures suggestions are rendered as part of the React Flow canvas.
 */
export function CanvasSuggestions() {
    const { suggestions, hasSuggestions, sourceNodeId, sourceNodePosition } = useContextualSuggestions();
    const {
        blueprint,
        ghostNodes,
        clearGhostSuggestions,
        addGhostNode,
        addGhostEdge
    } = useBlueprintStore();

    // Persistent references to avoid flickering and catch changes
    const lastSourceNodeIdRef = useRef<string | null>(null);
    const lastSuggestionsRef = useRef<string>('');

    useEffect(() => {
        // ===================================================================
        // IMPORTANT: Disable auto-suggestions if template ghosts exist
        // ===================================================================
        // If the blueprint was loaded with template-defined ghost nodes
        // (nodes without isSuggestion: true), we should NOT add contextual
        // suggestions on top. This ensures templates display only their
        // curated ghost nodes without interference from auto-suggestions.
        // ===================================================================

        const hasTemplateGhosts = ghostNodes.some(n => !n.data?.isSuggestion);

        // If template has its own ghost nodes, skip auto-suggestions
        if (hasTemplateGhosts) {
            return;
        }

        // We only want to update ghost nodes when the source node changes
        // OR when the set of suggestions (ids) changes for the same node.
        const suggestionsKey = suggestions.map(s => s.id).join(',');

        const shouldUpdate =
            sourceNodeId !== lastSourceNodeIdRef.current ||
            suggestionsKey !== lastSuggestionsRef.current;

        if (shouldUpdate) {
            lastSourceNodeIdRef.current = sourceNodeId;
            lastSuggestionsRef.current = suggestionsKey;

            // Clear only existing ghost suggestions, leaving template ghosts intact
            clearGhostSuggestions();

            // If we have a source and suggestions, populate the ghost system
            if (hasSuggestions && sourceNodeId && sourceNodePosition) {
                // Get only top 3 suggestions to avoid cluttering human-readable flow
                const visibleSuggestions = suggestions.slice(0, 3);

                // =====================================================================
                // AUTO-SUGGESTION POSITIONING - VERTICAL COLUMN ON RIGHT
                // =====================================================================
                // Strategy: Place auto-suggestions in a vertical column on the far 
                // right side of the canvas. This creates visual separation from:
                // - Core workflow nodes (left/center)
                // - Template ghost nodes (horizontal row at bottom)
                // =====================================================================

                const NODE_WIDTH = 200;
                const VERTICAL_SPACING = 120;  // Space between suggestion nodes
                const RIGHT_MARGIN = 300;      // Distance from rightmost node

                // Find the rightmost position considering all nodes AND template ghosts
                const allNodePositions = [
                    ...blueprint.nodes.map(n => n.position),
                    ...ghostNodes.filter(g => !g.data?.isSuggestion).map(g => g.position),
                ];

                const maxX = allNodePositions.length > 0
                    ? Math.max(...allNodePositions.map(p => p.x)) + NODE_WIDTH
                    : 0;

                // Position column to the right of everything
                const suggestionColumnX = maxX + RIGHT_MARGIN;

                // Center vertically around the selected node
                const totalHeight = (visibleSuggestions.length - 1) * VERTICAL_SPACING;
                const startY = sourceNodePosition.y - totalHeight / 2;

                // Add to store in a vertical column
                visibleSuggestions.forEach((suggestion, idx) => {
                    const position = {
                        x: suggestionColumnX,
                        y: startY + (idx * VERTICAL_SPACING),
                    };

                    // Pass the suggestion reason directly in the data object
                    const ghostNode = addGhostNode(suggestion.id, position, {
                        suggestionReason: suggestion.reason,
                        isGhost: true, // Explicitly mark as ghost in data too for consistency
                        isSuggestion: true // Mark as suggestion so it can be cleared independently
                    });

                    if (sourceNodeId) {
                        addGhostEdge(sourceNodeId, ghostNode.id);
                    }
                });
            }
        }
    }, [
        sourceNodeId,
        suggestions,
        hasSuggestions,
        sourceNodePosition,
        blueprint.nodes.length,
        ghostNodes,
        addGhostNode,
        addGhostEdge,
        clearGhostSuggestions
    ]);

    return null;
}
