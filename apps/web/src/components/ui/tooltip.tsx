'use client';

import * as React from 'react';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import { cn } from '@/lib/utils';

/**
 * Tooltip Component
 * 
 * A styled tooltip with animations and keyboard support.
 * Built on Radix UI primitives for accessibility.
 */

const TooltipProvider = TooltipPrimitive.Provider;

const Tooltip = TooltipPrimitive.Root;

const TooltipTrigger = TooltipPrimitive.Trigger;

const TooltipPortal = TooltipPrimitive.Portal;

interface TooltipContentProps extends React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content> {
    /** Show an arrow pointing to the trigger */
    showArrow?: boolean;
}

const TooltipContent = React.forwardRef<
    React.ElementRef<typeof TooltipPrimitive.Content>,
    TooltipContentProps
>(({ className, sideOffset = 6, showArrow = true, children, ...props }, ref) => (
    <TooltipPrimitive.Portal>
        <TooltipPrimitive.Content
            ref={ref}
            sideOffset={sideOffset}
            className={cn(
                // Base styles
                'z-tooltip overflow-hidden',
                'px-3 py-1.5 rounded-lg',
                'text-xs font-medium text-white',
                'bg-forge-elevated/95 backdrop-blur-md',
                'border border-forge-border/50',
                'shadow-lg shadow-black/30',
                // Animations
                'animate-in fade-in-0 zoom-in-95',
                'data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95',
                'data-[side=top]:slide-in-from-bottom-2',
                'data-[side=bottom]:slide-in-from-top-2',
                'data-[side=left]:slide-in-from-right-2',
                'data-[side=right]:slide-in-from-left-2',
                className
            )}
            {...props}
        >
            {children}
            {showArrow && (
                <TooltipPrimitive.Arrow
                    className="fill-forge-elevated/95"
                    width={12}
                    height={6}
                />
            )}
        </TooltipPrimitive.Content>
    </TooltipPrimitive.Portal>
));
TooltipContent.displayName = TooltipPrimitive.Content.displayName;

/**
 * Simple Tooltip - A convenience wrapper for common use cases
 */
interface SimpleTooltipProps {
    /** The content to show in the tooltip */
    content: React.ReactNode;
    /** The trigger element */
    children: React.ReactNode;
    /** Side of the trigger to show tooltip */
    side?: 'top' | 'right' | 'bottom' | 'left';
    /** Alignment of the tooltip */
    align?: 'start' | 'center' | 'end';
    /** Delay before showing (in ms) */
    delayDuration?: number;
    /** Whether the tooltip is disabled */
    disabled?: boolean;
    /** Additional className for the content */
    contentClassName?: string;
}

const SimpleTooltip = ({
    content,
    children,
    side = 'top',
    align = 'center',
    delayDuration = 200,
    disabled = false,
    contentClassName,
}: SimpleTooltipProps) => {
    if (disabled || !content) {
        return <>{children}</>;
    }

    return (
        <TooltipProvider delayDuration={delayDuration}>
            <Tooltip>
                <TooltipTrigger asChild>
                    {children}
                </TooltipTrigger>
                <TooltipContent
                    side={side}
                    align={align}
                    className={contentClassName}
                >
                    {content}
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
};

/**
 * Tooltip Group - For multiple tooltips with shared provider
 */
interface TooltipGroupProps {
    children: React.ReactNode;
    delayDuration?: number;
    skipDelayDuration?: number;
}

const TooltipGroup = ({
    children,
    delayDuration = 200,
    skipDelayDuration = 100
}: TooltipGroupProps) => (
    <TooltipProvider
        delayDuration={delayDuration}
        skipDelayDuration={skipDelayDuration}
    >
        {children}
    </TooltipProvider>
);

export {
    Tooltip,
    TooltipTrigger,
    TooltipContent,
    TooltipProvider,
    TooltipPortal,
    SimpleTooltip,
    TooltipGroup,
};
