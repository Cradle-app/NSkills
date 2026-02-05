'use client';

import { useState, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface TooltipProps {
    children: ReactNode;
    content: ReactNode;
    side?: 'top' | 'right' | 'bottom' | 'left';
    delay?: number;
    className?: string;
}

export function Tooltip({
    children,
    content,
    side = 'right',
    delay = 300,
    className,
}: TooltipProps) {
    const [isVisible, setIsVisible] = useState(false);
    const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);

    const handleMouseEnter = () => {
        const id = setTimeout(() => setIsVisible(true), delay);
        setTimeoutId(id);
    };

    const handleMouseLeave = () => {
        if (timeoutId) {
            clearTimeout(timeoutId);
            setTimeoutId(null);
        }
        setIsVisible(false);
    };

    const positionClasses = {
        top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
        right: 'left-full top-1/2 -translate-y-1/2 ml-2',
        bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
        left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    };

    const animationVariants = {
        top: { initial: { opacity: 0, y: 5 }, animate: { opacity: 1, y: 0 } },
        right: { initial: { opacity: 0, x: -5 }, animate: { opacity: 1, x: 0 } },
        bottom: { initial: { opacity: 0, y: -5 }, animate: { opacity: 1, y: 0 } },
        left: { initial: { opacity: 0, x: 5 }, animate: { opacity: 1, x: 0 } },
    };

    return (
        <div
            className="relative inline-block"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            {children}
            <AnimatePresence>
                {isVisible && (
                    <motion.div
                        initial={animationVariants[side].initial}
                        animate={animationVariants[side].animate}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.15 }}
                        className={cn(
                            'absolute z-50 pointer-events-none',
                            positionClasses[side],
                            className
                        )}
                    >
                        <div className="px-3 py-2 rounded-lg bg-forge-surface border border-forge-border/60 shadow-xl backdrop-blur-xl">
                            {content}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

// Rich tooltip for node palette items
interface NodeTooltipProps {
    name: string;
    description: string;
    tags?: string[];
    color?: string;
    children: ReactNode;
}

export function NodeTooltip({
    name,
    description,
    tags = [],
    color = 'accent-cyan',
    children,
}: NodeTooltipProps) {
    return (
        <Tooltip
            side="right"
            delay={400}
            content={
                <div className="max-w-[220px]">
                    <p className={cn('text-sm font-medium mb-1', `text-${color}`)}>{name}</p>
                    <p className="text-xs text-forge-muted leading-relaxed">{description}</p>
                    {tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                            {tags.slice(0, 3).map((tag) => (
                                <span
                                    key={tag}
                                    className="text-[9px] px-1.5 py-0.5 rounded bg-forge-elevated text-forge-muted"
                                >
                                    {tag}
                                </span>
                            ))}
                        </div>
                    )}
                </div>
            }
        >
            {children}
        </Tooltip>
    );
}
