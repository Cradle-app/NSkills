'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ChevronDown,
    Clock,
    FileText,
    Trash2,
    MoreHorizontal,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface RecentBlueprint {
    id: string;
    name: string;
    updatedAt: Date;
    nodeCount: number;
    json?: string;
}

interface RecentBlueprintsDropdownProps {
    currentBlueprintName: string;
    onSelect: (blueprint: RecentBlueprint) => void;
    onDelete?: (blueprintId: string) => void;
    className?: string;
}

const STORAGE_KEY = 'cradle-recent-blueprints';
const MAX_RECENT = 10;

export function RecentBlueprintsDropdown({
    currentBlueprintName,
    onSelect,
    onDelete,
    className,
}: RecentBlueprintsDropdownProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [recentBlueprints, setRecentBlueprints] = useState<RecentBlueprint[]>([]);

    // Load recent blueprints from localStorage
    useEffect(() => {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                setRecentBlueprints(
                    parsed.map((bp: RecentBlueprint) => ({
                        ...bp,
                        updatedAt: new Date(bp.updatedAt),
                    }))
                );
            } catch {
                // Invalid stored data
            }
        }
    }, []);

    const formatRelativeTime = (date: Date) => {
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString();
    };

    const handleDelete = useCallback((e: React.MouseEvent, blueprintId: string) => {
        e.stopPropagation();
        setRecentBlueprints(prev => {
            const updated = prev.filter(bp => bp.id !== blueprintId);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
            return updated;
        });
        onDelete?.(blueprintId);
    }, [onDelete]);

    return (
        <div className={cn('relative', className)}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    'flex items-center gap-1.5 px-2 py-1 rounded-md transition-colors group',
                    'hover:bg-forge-elevated/50',
                    isOpen && 'bg-forge-elevated/50'
                )}
            >
                <span className="text-[10px] text-forge-muted uppercase tracking-wide">Project</span>
                <span className="text-sm font-medium text-white group-hover:text-accent-cyan transition-colors max-w-32 truncate">
                    {currentBlueprintName || 'Untitled'}
                </span>
                <ChevronDown className={cn(
                    'w-3.5 h-3.5 text-forge-muted transition-transform',
                    isOpen && 'rotate-180'
                )} />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <>
                        {/* Backdrop */}
                        <div
                            className="fixed inset-0 z-40"
                            onClick={() => setIsOpen(false)}
                        />

                        {/* Dropdown */}
                        <motion.div
                            initial={{ opacity: 0, y: -5, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -5, scale: 0.95 }}
                            transition={{ duration: 0.15 }}
                            className={cn(
                                'absolute top-full left-0 mt-2 z-50',
                                'w-72 max-h-80 overflow-y-auto',
                                'bg-forge-surface/95 backdrop-blur-xl rounded-xl',
                                'border border-forge-border/60 shadow-2xl'
                            )}
                        >
                            <div className="p-2">
                                <div className="flex items-center gap-2 px-2 py-1.5 mb-2">
                                    <Clock className="w-3.5 h-3.5 text-forge-muted" />
                                    <span className="text-xs font-medium text-forge-muted">Recent Blueprints</span>
                                </div>

                                {recentBlueprints.length === 0 ? (
                                    <div className="px-2 py-6 text-center">
                                        <FileText className="w-8 h-8 text-forge-muted/50 mx-auto mb-2" />
                                        <p className="text-xs text-forge-muted">No recent blueprints</p>
                                    </div>
                                ) : (
                                    <div className="space-y-0.5">
                                        {recentBlueprints.map((blueprint) => (
                                            <div
                                                key={blueprint.id}
                                                onClick={() => {
                                                    onSelect(blueprint);
                                                    setIsOpen(false);
                                                }}
                                                className={cn(
                                                    'flex items-center gap-3 px-2 py-2 rounded-lg cursor-pointer group',
                                                    'hover:bg-forge-elevated/50 transition-colors'
                                                )}
                                            >
                                                <div className="w-8 h-8 rounded-lg bg-accent-cyan/10 flex items-center justify-center flex-shrink-0">
                                                    <FileText className="w-4 h-4 text-accent-cyan" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium text-white truncate">
                                                        {blueprint.name}
                                                    </p>
                                                    <p className="text-xs text-forge-muted">
                                                        {blueprint.nodeCount} nodes · {formatRelativeTime(blueprint.updatedAt)}
                                                    </p>
                                                </div>
                                                <button
                                                    onClick={(e) => handleDelete(e, blueprint.id)}
                                                    className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-red-500/20 transition-all"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5 text-red-400" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}

// Hook to manage recent blueprints
export function useRecentBlueprints() {
    const addRecent = useCallback((blueprint: RecentBlueprint) => {
        const stored = localStorage.getItem(STORAGE_KEY);
        let recent: RecentBlueprint[] = [];

        if (stored) {
            try {
                recent = JSON.parse(stored);
            } catch {
                // Invalid data
            }
        }

        // Remove if already exists
        recent = recent.filter(bp => bp.id !== blueprint.id);

        // Add to front
        recent.unshift({
            ...blueprint,
            updatedAt: new Date(),
        });

        // Limit to max recent
        recent = recent.slice(0, MAX_RECENT);

        localStorage.setItem(STORAGE_KEY, JSON.stringify(recent));
    }, []);

    const clearRecent = useCallback(() => {
        localStorage.removeItem(STORAGE_KEY);
    }, []);

    return { addRecent, clearRecent };
}
