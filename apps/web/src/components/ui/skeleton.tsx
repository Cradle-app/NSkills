'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

/**
 * Skeleton Component
 * 
 * A set of loading placeholder components with shimmer animation.
 * Use these to indicate content is loading and maintain layout stability.
 */

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
    /** Whether to animate (can be disabled for compositing) */
    animate?: boolean;
}

function Skeleton({ className, animate = true, ...props }: SkeletonProps) {
    return (
        <div
            className={cn(
                'rounded-lg bg-forge-elevated/50',
                animate && 'animate-pulse',
                className
            )}
            {...props}
        />
    );
}

interface SkeletonTextProps extends React.HTMLAttributes<HTMLDivElement> {
    /** Number of lines to show */
    lines?: number;
    /** Width of the last line (to simulate natural text) */
    lastLineWidth?: string;
}

function SkeletonText({
    lines = 3,
    lastLineWidth = '60%',
    className,
    ...props
}: SkeletonTextProps) {
    return (
        <div className={cn('space-y-2.5', className)} {...props}>
            {Array.from({ length: lines }).map((_, index) => (
                <Skeleton
                    key={index}
                    className="h-3"
                    style={{
                        width: index === lines - 1 ? lastLineWidth : '100%'
                    }}
                />
            ))}
        </div>
    );
}

function SkeletonHeading({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
    return (
        <Skeleton
            className={cn('h-6 w-48 rounded-md', className)}
            {...props}
        />
    );
}

function SkeletonButton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
    return (
        <Skeleton
            className={cn('h-10 w-24 rounded-lg', className)}
            {...props}
        />
    );
}

function SkeletonAvatar({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
    return (
        <Skeleton
            className={cn('h-10 w-10 rounded-full', className)}
            {...props}
        />
    );
}

function SkeletonCard({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
    return (
        <div
            className={cn(
                'p-4 rounded-xl border border-forge-border bg-forge-surface/50',
                'space-y-4',
                className
            )}
            {...props}
        >
            <div className="flex items-center gap-3">
                <SkeletonAvatar />
                <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-16" />
                </div>
            </div>
            <SkeletonText lines={2} lastLineWidth="80%" />
        </div>
    );
}

interface SkeletonImageProps extends React.HTMLAttributes<HTMLDivElement> {
    /** Aspect ratio as width/height (e.g., 16/9, 1, 4/3) */
    aspectRatio?: number;
}

function SkeletonImage({
    aspectRatio = 16 / 9,
    className,
    style,
    ...props
}: SkeletonImageProps) {
    return (
        <Skeleton
            className={cn('w-full rounded-lg', className)}
            style={{
                aspectRatio,
                ...style,
            }}
            {...props}
        />
    );
}

function SkeletonInput({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
    return (
        <div className={cn('space-y-1.5', className)} {...props}>
            <Skeleton className="h-4 w-16 rounded" />
            <Skeleton className="h-10 w-full rounded-lg" />
        </div>
    );
}

function SkeletonTable({
    rows = 5,
    columns = 4,
    className,
    ...props
}: {
    rows?: number;
    columns?: number;
} & React.HTMLAttributes<HTMLDivElement>) {
    return (
        <div className={cn('space-y-3', className)} {...props}>
            {/* Header */}
            <div className="flex gap-4 pb-2 border-b border-forge-border/50">
                {Array.from({ length: columns }).map((_, i) => (
                    <Skeleton
                        key={`header-${i}`}
                        className="h-4 flex-1 rounded"
                    />
                ))}
            </div>
            {/* Rows */}
            {Array.from({ length: rows }).map((_, rowIndex) => (
                <div key={rowIndex} className="flex gap-4">
                    {Array.from({ length: columns }).map((_, colIndex) => (
                        <Skeleton
                            key={`${rowIndex}-${colIndex}`}
                            className="h-4 flex-1 rounded"
                        />
                    ))}
                </div>
            ))}
        </div>
    );
}

/**
 * Skeleton with shimmer effect (alternative animation)
 */
function SkeletonShimmer({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
    return (
        <div
            className={cn(
                'rounded-lg bg-forge-elevated/50 overflow-hidden relative',
                className
            )}
            {...props}
        >
            <div
                className={cn(
                    'absolute inset-0',
                    'bg-gradient-to-r from-transparent via-white/5 to-transparent',
                    'animate-shimmer'
                )}
                style={{
                    backgroundSize: '200% 100%',
                }}
            />
        </div>
    );
}

export {
    Skeleton,
    SkeletonText,
    SkeletonHeading,
    SkeletonButton,
    SkeletonAvatar,
    SkeletonCard,
    SkeletonImage,
    SkeletonInput,
    SkeletonTable,
    SkeletonShimmer,
};
