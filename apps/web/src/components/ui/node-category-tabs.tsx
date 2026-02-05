'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Box, CreditCard, Bot, Layout, ShieldCheck, Brain, MessageCircle } from 'lucide-react';

export interface CategoryTab {
    id: string;
    label: string;
    icon: typeof Box;
    count?: number;
}

interface NodeCategoryTabsProps {
    categories: CategoryTab[];
    activeCategory: string | null;
    onCategoryChange: (categoryId: string | null) => void;
    className?: string;
}

export function NodeCategoryTabs({
    categories,
    activeCategory,
    onCategoryChange,
    className,
}: NodeCategoryTabsProps) {
    return (
        <div className={cn('flex flex-wrap gap-1.5', className)}>
            {/* All tab */}
            <button
                onClick={() => onCategoryChange(null)}
                className={cn(
                    'px-2.5 py-1 text-xs font-medium rounded-lg transition-all',
                    'flex items-center gap-1.5',
                    activeCategory === null
                        ? 'bg-accent-cyan/20 text-accent-cyan border border-accent-cyan/30'
                        : 'bg-forge-elevated/50 text-forge-muted hover:text-white border border-transparent hover:bg-forge-elevated'
                )}
            >
                All
            </button>

            {categories.map((category) => {
                const Icon = category.icon;
                const isActive = activeCategory === category.id;

                return (
                    <motion.button
                        key={category.id}
                        onClick={() => onCategoryChange(category.id)}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className={cn(
                            'px-2.5 py-1 text-xs font-medium rounded-lg transition-all',
                            'flex items-center gap-1.5',
                            isActive
                                ? 'bg-accent-cyan/20 text-accent-cyan border border-accent-cyan/30'
                                : 'bg-forge-elevated/50 text-forge-muted hover:text-white border border-transparent hover:bg-forge-elevated'
                        )}
                    >
                        <Icon className="w-3 h-3" />
                        <span>{category.label}</span>
                        {category.count !== undefined && (
                            <span className={cn(
                                'px-1.5 py-0.5 text-[10px] rounded-md',
                                isActive ? 'bg-accent-cyan/30' : 'bg-forge-bg'
                            )}>
                                {category.count}
                            </span>
                        )}
                    </motion.button>
                );
            })}
        </div>
    );
}

// Default categories based on plugin types
export const defaultCategories: CategoryTab[] = [
    { id: 'contracts', label: 'Contracts', icon: Box },
    { id: 'payments', label: 'Payments', icon: CreditCard },
    { id: 'agents', label: 'Agents', icon: Bot },
    { id: 'app', label: 'App', icon: Layout },
    { id: 'quality', label: 'Quality', icon: ShieldCheck },
    { id: 'intelligence', label: 'Intel', icon: Brain },
    { id: 'telegram', label: 'Telegram', icon: MessageCircle },
];

// Hook to manage category filter state
export function useCategoryFilter() {
    const [activeCategory, setActiveCategory] = useState<string | null>(null);

    const filterByCategory = <T extends { category?: string }>(items: T[]): T[] => {
        if (!activeCategory) return items;
        return items.filter((item) => item.category === activeCategory);
    };

    return {
        activeCategory,
        setActiveCategory,
        filterByCategory,
    };
}
