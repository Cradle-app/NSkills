'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Command, Delete, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, ZoomIn, ZoomOut, Undo2, Redo2, Search, Save, FolderOpen, Keyboard } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Shortcut {
    keys: string[];
    description: string;
    category: string;
}

const SHORTCUTS: Shortcut[] = [
    // Canvas
    { keys: ['Delete'], description: 'Delete selected node', category: 'Canvas' },
    { keys: ['Backspace'], description: 'Delete selected node', category: 'Canvas' },
    { keys: ['Ctrl', 'Z'], description: 'Undo last action', category: 'Canvas' },
    { keys: ['Ctrl', 'Y'], description: 'Redo action', category: 'Canvas' },
    { keys: ['Ctrl', 'Shift', 'Z'], description: 'Redo action', category: 'Canvas' },
    { keys: ['Scroll'], description: 'Zoom in/out', category: 'Canvas' },
    { keys: ['Drag'], description: 'Pan canvas', category: 'Canvas' },

    // Navigation
    { keys: ['Ctrl', 'K'], description: 'Search nodes', category: 'Navigation' },
    { keys: ['?'], description: 'Show keyboard shortcuts', category: 'Navigation' },
    { keys: ['Escape'], description: 'Close panels/modals', category: 'Navigation' },

    // File
    { keys: ['Ctrl', 'S'], description: 'Export blueprint', category: 'File' },
    { keys: ['Ctrl', 'O'], description: 'Import blueprint', category: 'File' },
];

function KeyBadge({ children }: { children: string }) {
    return (
        <span className="inline-flex items-center justify-center min-w-[24px] h-6 px-1.5 rounded bg-forge-bg border border-forge-border text-[11px] font-mono text-white">
            {children === 'Ctrl' ? '⌘/Ctrl' : children}
        </span>
    );
}

interface KeyboardShortcutsModalProps {
    open: boolean;
    onClose: () => void;
}

export function KeyboardShortcutsModal({ open, onClose }: KeyboardShortcutsModalProps) {
    // Group shortcuts by category
    const groupedShortcuts = SHORTCUTS.reduce((acc, shortcut) => {
        if (!acc[shortcut.category]) {
            acc[shortcut.category] = [];
        }
        acc[shortcut.category].push(shortcut);
        return acc;
    }, {} as Record<string, Shortcut[]>);

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
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 400 }}
                        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-lg"
                    >
                        <div className="bg-gradient-to-b from-forge-surface to-forge-bg border border-forge-border/60 rounded-2xl shadow-2xl overflow-hidden">
                            {/* Header */}
                            <div className="flex items-center justify-between p-4 border-b border-forge-border/50">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-accent-purple/10">
                                        <Keyboard className="w-5 h-5 text-accent-purple" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-semibold text-white">Keyboard Shortcuts</h2>
                                        <p className="text-xs text-forge-muted">Press ? anytime to show this panel</p>
                                    </div>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="p-2 rounded-lg hover:bg-forge-elevated/50 text-forge-muted hover:text-white transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Shortcuts list */}
                            <div className="p-4 max-h-[400px] overflow-y-auto space-y-6">
                                {Object.entries(groupedShortcuts).map(([category, shortcuts]) => (
                                    <div key={category}>
                                        <h3 className="text-[10px] uppercase tracking-wider text-forge-muted mb-3">
                                            {category}
                                        </h3>
                                        <div className="space-y-2">
                                            {shortcuts.map((shortcut, idx) => (
                                                <div
                                                    key={idx}
                                                    className="flex items-center justify-between py-2 px-3 rounded-lg bg-forge-elevated/30 border border-forge-border/30"
                                                >
                                                    <span className="text-sm text-white">{shortcut.description}</span>
                                                    <div className="flex items-center gap-1">
                                                        {shortcut.keys.map((key, keyIdx) => (
                                                            <KeyBadge key={keyIdx}>{key}</KeyBadge>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Footer hint */}
                            <div className="p-4 border-t border-forge-border/50 bg-forge-bg/30">
                                <p className="text-xs text-forge-muted text-center">
                                    Pro tip: Use <KeyBadge>Ctrl</KeyBadge> + <KeyBadge>K</KeyBadge> to quickly search nodes
                                </p>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}

// Hook to handle global ? key press
export function useKeyboardShortcutsModal() {
    const [isOpen, setIsOpen] = useState(false);

    const open = useCallback(() => setIsOpen(true), []);
    const close = useCallback(() => setIsOpen(false), []);
    const toggle = useCallback(() => setIsOpen(prev => !prev), []);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Don't trigger if typing in an input
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
                return;
            }

            if (e.key === '?') {
                e.preventDefault();
                toggle();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [toggle]);

    return { isOpen, open, close, toggle };
}
