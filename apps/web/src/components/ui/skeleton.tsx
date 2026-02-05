'use client';

import { cn } from '@/lib/utils';

interface SkeletonProps {
    className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
    return (
        <div
            className={cn(
                'animate-pulse rounded-md bg-forge-elevated/50',
                className
            )}
        />
    );
}

export function SkeletonText({ lines = 3, className }: { lines?: number; className?: string }) {
    return (
        <div className={cn('space-y-2', className)}>
            {Array.from({ length: lines }).map((_, i) => (
                <Skeleton
                    key={i}
                    className={cn(
                        'h-3',
                        i === lines - 1 ? 'w-2/3' : 'w-full'
                    )}
                />
            ))}
        </div>
    );
}

export function SkeletonCard({ className }: SkeletonProps) {
    return (
        <div className={cn('p-4 rounded-xl bg-forge-elevated/30 border border-forge-border/30', className)}>
            <div className="flex items-start gap-3">
                <Skeleton className="w-10 h-10 rounded-lg shrink-0" />
                <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-2/3" />
                </div>
            </div>
        </div>
    );
}

export function SkeletonNode({ className }: SkeletonProps) {
    return (
        <div className={cn('p-3 rounded-xl bg-forge-elevated/30 border border-forge-border/30', className)}>
            <div className="flex items-center gap-2">
                <Skeleton className="w-8 h-8 rounded-lg shrink-0" />
                <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-2 w-32" />
                </div>
            </div>
        </div>
    );
}

export function SkeletonButton({ className }: SkeletonProps) {
    return <Skeleton className={cn('h-9 w-24 rounded-lg', className)} />;
}
