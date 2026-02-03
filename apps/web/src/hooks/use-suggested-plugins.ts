'use client';

import { useMemo } from 'react';
import { useBlueprintStore } from '@/store/blueprint';
import {
    getSuggestedPlugins,
    getCompatiblePlugins,
    getRequiredPlugins,
    type PluginRegistryEntry,
} from '@cradle/plugin-config';

export interface SuggestedPlugin extends PluginRegistryEntry {
    /** Why this plugin is suggested */
    reason: 'compatible' | 'suggested' | 'required';
    /** Plugin IDs that triggered this suggestion */
    sourceNodes: string[];
    /** Source node type for connection */
    sourceNodeType: string;
    /** Priority for sorting (required > suggested > compatible) */
    priority: number;
}

/**
 * Hook to compute suggested plugins based on all canvas nodes.
 * Used for palette suggestions.
 */
export function useSuggestedPlugins(): {
    suggestions: SuggestedPlugin[];
    hasSuggestions: boolean;
} {
    const nodes = useBlueprintStore((state) => state.blueprint.nodes);

    const suggestions = useMemo(() => {
        if (nodes.length === 0) {
            return [];
        }

        // Collect all existing node types (widened to string for comparison with plugin IDs)
        const existingTypes: Set<string> = new Set(nodes.map((n) => n.type));

        // Map to track suggestions and avoid duplicates
        const suggestionMap = new Map<string, SuggestedPlugin>();

        // Process each node to find suggestions
        for (const node of nodes) {
            const nodeType = node.type;

            // Get required plugins (highest priority) - returns PluginRegistryEntry[]
            const requiredPlugins = getRequiredPlugins(nodeType);
            for (const plugin of requiredPlugins) {
                if (!existingTypes.has(plugin.id)) {
                    const existing = suggestionMap.get(plugin.id);
                    if (!existing || existing.priority < 3) {
                        suggestionMap.set(plugin.id, {
                            ...plugin,
                            reason: 'required',
                            sourceNodes: existing?.sourceNodes
                                ? [...existing.sourceNodes, nodeType]
                                : [nodeType],
                            sourceNodeType: nodeType,
                            priority: 3,
                        });
                    } else if (existing) {
                        existing.sourceNodes.push(nodeType);
                    }
                }
            }

            // Get suggested plugins (medium priority) - returns PluginRegistryEntry[]
            const suggestedPlugins = getSuggestedPlugins(nodeType);
            for (const plugin of suggestedPlugins) {
                if (!existingTypes.has(plugin.id)) {
                    if (!suggestionMap.has(plugin.id)) {
                        suggestionMap.set(plugin.id, {
                            ...plugin,
                            reason: 'suggested',
                            sourceNodes: [nodeType],
                            sourceNodeType: nodeType,
                            priority: 2,
                        });
                    } else {
                        const existing = suggestionMap.get(plugin.id);
                        if (existing && existing.priority <= 2) {
                            existing.sourceNodes.push(nodeType);
                        }
                    }
                }
            }

            // Get compatible plugins (lower priority) - returns PluginRegistryEntry[]
            const compatiblePlugins = getCompatiblePlugins(nodeType);
            for (const plugin of compatiblePlugins) {
                if (!existingTypes.has(plugin.id)) {
                    if (!suggestionMap.has(plugin.id)) {
                        suggestionMap.set(plugin.id, {
                            ...plugin,
                            reason: 'compatible',
                            sourceNodes: [nodeType],
                            sourceNodeType: nodeType,
                            priority: 1,
                        });
                    } else {
                        const existing = suggestionMap.get(plugin.id);
                        if (existing && existing.priority <= 1) {
                            existing.sourceNodes.push(nodeType);
                        }
                    }
                }
            }
        }

        // Sort by priority (highest first), then alphabetically
        return Array.from(suggestionMap.values()).sort((a, b) => {
            if (b.priority !== a.priority) {
                return b.priority - a.priority;
            }
            return a.name.localeCompare(b.name);
        });
    }, [nodes]);

    return {
        suggestions,
        hasSuggestions: suggestions.length > 0,
    };
}

/**
 * Hook for context-aware suggestions based on selected node or last added node.
 * Used for canvas-based visual suggestions.
 */
export function useContextualSuggestions(): {
    suggestions: SuggestedPlugin[];
    hasSuggestions: boolean;
    sourceNodeId: string | null;
    sourceNodePosition: { x: number; y: number } | null;
} {
    const nodes = useBlueprintStore((state) => state.blueprint.nodes);
    const selectedNodeId = useBlueprintStore((state) => state.selectedNodeId);

    const result = useMemo(() => {
        if (nodes.length === 0) {
            return {
                suggestions: [],
                sourceNodeId: null,
                sourceNodePosition: null,
            };
        }

        // Determine the source node: selected node, or the last added node
        const sourceNode = selectedNodeId
            ? nodes.find((n) => n.id === selectedNodeId)
            : nodes[nodes.length - 1]; // Last added node

        if (!sourceNode) {
            return {
                suggestions: [],
                sourceNodeId: null,
                sourceNodePosition: null,
            };
        }

        const nodeType = sourceNode.type;

        // Collect all existing node types
        const existingTypes: Set<string> = new Set(nodes.map((n) => n.type));

        // Get suggestions for this specific node
        const suggestionMap = new Map<string, SuggestedPlugin>();

        // Required plugins first
        const requiredPlugins = getRequiredPlugins(nodeType);
        for (const plugin of requiredPlugins) {
            if (!existingTypes.has(plugin.id)) {
                suggestionMap.set(plugin.id, {
                    ...plugin,
                    reason: 'required',
                    sourceNodes: [nodeType],
                    sourceNodeType: nodeType,
                    priority: 3,
                });
            }
        }

        // Suggested plugins
        const suggestedPlugins = getSuggestedPlugins(nodeType);
        for (const plugin of suggestedPlugins) {
            if (!existingTypes.has(plugin.id) && !suggestionMap.has(plugin.id)) {
                suggestionMap.set(plugin.id, {
                    ...plugin,
                    reason: 'suggested',
                    sourceNodes: [nodeType],
                    sourceNodeType: nodeType,
                    priority: 2,
                });
            }
        }

        // Compatible plugins
        const compatiblePlugins = getCompatiblePlugins(nodeType);
        for (const plugin of compatiblePlugins) {
            if (!existingTypes.has(plugin.id) && !suggestionMap.has(plugin.id)) {
                suggestionMap.set(plugin.id, {
                    ...plugin,
                    reason: 'compatible',
                    sourceNodes: [nodeType],
                    sourceNodeType: nodeType,
                    priority: 1,
                });
            }
        }

        // Sort by priority
        const suggestions = Array.from(suggestionMap.values()).sort((a, b) => {
            if (b.priority !== a.priority) {
                return b.priority - a.priority;
            }
            return a.name.localeCompare(b.name);
        });

        return {
            suggestions,
            sourceNodeId: sourceNode.id,
            sourceNodePosition: sourceNode.position,
        };
    }, [nodes, selectedNodeId]);

    return {
        ...result,
        hasSuggestions: result.suggestions.length > 0,
    };
}
