'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useReactFlow, type Node } from 'reactflow';
import { cn } from '@/lib/utils';
import { PLUGIN_REGISTRY, CATEGORY_DEFINITIONS } from '@cradle/plugin-config';
import { Box, Zap, Package, Code2, FileText, Settings } from 'lucide-react';

interface NodePreviewTooltipProps {
    node: Node | null;
    position: { x: number; y: number } | null;
}

export function NodePreviewTooltip({ node, position }: NodePreviewTooltipProps) {
    if (!node || !position) return null;

    // Look up plugin from registry
    const plugin = node.type ? PLUGIN_REGISTRY[node.type] : null;
    const category = plugin ? CATEGORY_DEFINITIONS.find(c => c.id === plugin.category) : null;

    const getCategoryIcon = () => {
        if (!category) return Box;
        switch (category.id) {
            case 'contracts': return Code2;
            case 'payments': return Zap;
            case 'agents': return Package;
            case 'app': return FileText;
            default: return Box;
        }
    };

    const CategoryIcon = getCategoryIcon();

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 10 }}
                transition={{ duration: 0.15 }}
                className="fixed z-50 pointer-events-none"
                style={{
                    left: position.x + 20,
                    top: position.y - 10,
                }}
            >
                <div className={cn(
                    'w-64 p-3 rounded-xl shadow-2xl',
                    'bg-forge-surface/95 backdrop-blur-xl',
                    'border border-forge-border/60'
                )}>
                    {/* Header */}
                    <div className="flex items-start gap-3 mb-3">
                        <div className={cn(
                            'w-10 h-10 rounded-lg flex items-center justify-center',
                            'bg-gradient-to-br from-accent-cyan/20 to-accent-purple/20',
                            'border border-forge-border/50'
                        )}>
                            <CategoryIcon className="w-5 h-5 text-accent-cyan" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-semibold text-white truncate">
                                {plugin?.name || node.data?.label || 'Unknown Node'}
                            </h3>
                            <p className="text-xs text-forge-muted">
                                {category?.name || 'Node'}
                            </p>
                        </div>
                    </div>

                    {/* Description */}
                    {plugin?.description && (
                        <p className="text-xs text-forge-text/80 leading-relaxed mb-3">
                            {plugin.description}
                        </p>
                    )}

                    {/* Quick Stats */}
                    <div className="flex items-center gap-3 text-xs text-forge-muted">
                        <div className="flex items-center gap-1">
                            <Settings className="w-3 h-3" />
                            <span>{Object.keys(node.data?.config || {}).length} settings</span>
                        </div>
                        {plugin?.tags && plugin.tags.length > 0 && (
                            <div className="flex items-center gap-1">
                                <span className="text-accent-cyan">#</span>
                                <span>{plugin.tags[0]}</span>
                            </div>
                        )}
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}

// Hook to manage node preview state
export function useNodePreview() {
    const [previewNode, setPreviewNode] = useState<Node | null>(null);
    const [previewPosition, setPreviewPosition] = useState<{ x: number; y: number } | null>(null);
    const { getNode } = useReactFlow();

    const showPreview = useCallback((nodeId: string, event: React.MouseEvent) => {
        const node = getNode(nodeId);
        if (node) {
            setPreviewNode(node);
            setPreviewPosition({ x: event.clientX, y: event.clientY });
        }
    }, [getNode]);

    const hidePreview = useCallback(() => {
        setPreviewNode(null);
        setPreviewPosition(null);
    }, []);

    const updatePosition = useCallback((event: React.MouseEvent) => {
        if (previewNode) {
            setPreviewPosition({ x: event.clientX, y: event.clientY });
        }
    }, [previewNode]);

    return {
        previewNode,
        previewPosition,
        showPreview,
        hidePreview,
        updatePosition,
    };
}
