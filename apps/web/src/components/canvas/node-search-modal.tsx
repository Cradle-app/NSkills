'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Box, ArrowRight } from 'lucide-react';
import { useReactFlow } from 'reactflow';
import { cn } from '@/lib/utils';
import { useBlueprintStore } from '@/store/blueprint';

interface NodeSearchModalProps {
    open: boolean;
    onClose: () => void;
}

export function NodeSearchModal({ open, onClose }: NodeSearchModalProps) {
    const [query, setQuery] = useState('');
    const { blueprint, selectNode } = useBlueprintStore();
    const { fitView, setCenter } = useReactFlow();

    // Filter nodes based on search query
    const filteredNodes = useMemo(() => {
        if (!query.trim()) return blueprint.nodes;

        const lowerQuery = query.toLowerCase();
        return blueprint.nodes.filter(node => {
            const name = (node.config?.name as string) || node.type;
            return (
                name.toLowerCase().includes(lowerQuery) ||
                node.type.toLowerCase().includes(lowerQuery) ||
                node.id.toLowerCase().includes(lowerQuery)
            );
        });
    }, [blueprint.nodes, query]);

    const handleSelectNode = useCallback((nodeId: string) => {
        const node = blueprint.nodes.find(n => n.id === nodeId);
        if (node) {
            selectNode(nodeId);
            // Center view on the node
            setCenter(node.position.x + 100, node.position.y + 50, { zoom: 1, duration: 300 });
        }
        onClose();
    }, [blueprint.nodes, selectNode, setCenter, onClose]);

    // Reset query when modal opens
    useEffect(() => {
        if (open) {
            setQuery('');
        }
    }, [open]);

    // Close on escape
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };
        if (open) {
            window.addEventListener('keydown', handleKeyDown);
        }
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [open, onClose]);

    return (
        <AnimatePresence>
            {open && (
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
                        initial={{ opacity: 0, scale: 0.95, y: -20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -20 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 400 }}
                        className="fixed left-1/2 top-24 -translate-x-1/2 z-50 w-full max-w-md"
                    >
                        <div className="bg-gradient-to-b from-forge-surface to-forge-bg border border-forge-border/60 rounded-2xl shadow-2xl overflow-hidden">
                            {/* Search input */}
                            <div className="flex items-center gap-3 p-4 border-b border-forge-border/50">
                                <Search className="w-5 h-5 text-forge-muted shrink-0" />
                                <input
                                    type="text"
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    placeholder="Search nodes on canvas..."
                                    className="flex-1 bg-transparent text-white placeholder:text-forge-muted/50 outline-none text-sm"
                                    autoFocus
                                />
                                <button
                                    onClick={onClose}
                                    className="p-1 rounded hover:bg-forge-elevated/50 text-forge-muted hover:text-white transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            {/* Results */}
                            <div className="max-h-[300px] overflow-y-auto p-2">
                                {filteredNodes.length === 0 ? (
                                    <div className="py-8 text-center text-forge-muted text-sm">
                                        {blueprint.nodes.length === 0 ? 'No nodes on canvas' : 'No matching nodes'}
                                    </div>
                                ) : (
                                    <div className="space-y-1">
                                        {filteredNodes.map((node) => {
                                            const name = (node.config?.name as string) || node.type;

                                            return (
                                                <button
                                                    key={node.id}
                                                    onClick={() => handleSelectNode(node.id)}
                                                    className={cn(
                                                        'w-full flex items-center gap-3 p-3 rounded-lg text-left',
                                                        'bg-forge-elevated/30 hover:bg-forge-elevated/50 border border-transparent hover:border-accent-cyan/30',
                                                        'transition-all duration-150'
                                                    )}
                                                >
                                                    <div className="p-1.5 rounded-lg bg-accent-cyan/10 border border-accent-cyan/20">
                                                        <Box className="w-4 h-4 text-accent-cyan" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-medium text-white truncate">{name}</p>
                                                        <p className="text-[10px] text-forge-muted truncate">{node.type}</p>
                                                    </div>
                                                    <ArrowRight className="w-4 h-4 text-forge-muted" />
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            {/* Footer hint */}
                            <div className="p-3 border-t border-forge-border/50 bg-forge-bg/30">
                                <div className="flex items-center justify-between text-[10px] text-forge-muted">
                                    <span>{filteredNodes.length} node{filteredNodes.length !== 1 ? 's' : ''}</span>
                                    <span>Press ↵ to select • Esc to close</span>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}

// Hook for global Cmd+K shortcut
export function useNodeSearchModal() {
    const [isOpen, setIsOpen] = useState(false);

    const open = useCallback(() => setIsOpen(true), []);
    const close = useCallback(() => setIsOpen(false), []);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Don't trigger if typing in an input
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
                return;
            }

            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setIsOpen(true);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    return { isOpen, open, close };
}
