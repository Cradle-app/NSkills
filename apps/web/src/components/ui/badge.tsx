'use client';

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

/**
 * Badge Component
 * 
 * A versatile badge/tag component for labels, status indicators,
 * and category markers with multiple variants and sizes.
 */

const badgeVariants = cva(
  // Base styles
  [
    'inline-flex items-center justify-center gap-1',
    'font-medium transition-colors duration-150',
    'border',
  ],
  {
    variants: {
      variant: {
        // Default/neutral
        default: [
          'bg-forge-elevated/50 text-forge-text-secondary',
          'border-forge-border',
        ],
        // Primary brand
        primary: [
          'bg-accent-cyan/10 text-accent-cyan',
          'border-accent-cyan/30',
        ],
        // Secondary brand
        secondary: [
          'bg-accent-purple/10 text-accent-purple',
          'border-accent-purple/30',
        ],
        // Success/positive
        success: [
          'bg-accent-lime/10 text-accent-lime',
          'border-accent-lime/30',
        ],
        // Warning/attention
        warning: [
          'bg-accent-amber/10 text-accent-amber',
          'border-accent-amber/30',
        ],
        // Error/destructive
        error: [
          'bg-accent-coral/10 text-accent-coral',
          'border-accent-coral/30',
        ],
        // Outline only
        outline: [
          'bg-transparent text-forge-text-secondary',
          'border-forge-border',
          'hover:bg-forge-hover hover:text-white',
        ],
        // Solid variants
        'solid-primary': [
          'bg-accent-cyan text-forge-bg',
          'border-accent-cyan',
        ],
        'solid-secondary': [
          'bg-accent-purple text-white',
          'border-accent-purple',
        ],
        'solid-success': [
          'bg-accent-lime text-forge-bg',
          'border-accent-lime',
        ],
        'solid-warning': [
          'bg-accent-amber text-forge-bg',
          'border-accent-amber',
        ],
        'solid-error': [
          'bg-accent-coral text-white',
          'border-accent-coral',
        ],
      },
      size: {
        sm: 'px-2 py-0.5 text-2xs rounded',
        default: 'px-2.5 py-0.5 text-xs rounded-md',
        lg: 'px-3 py-1 text-sm rounded-lg',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
  VariantProps<typeof badgeVariants> {
  /** Optional icon to show before text */
  icon?: React.ReactNode;
  /** Optional icon to show after text */
  endIcon?: React.ReactNode;
  /** Whether the badge is removable (shows X button) */
  removable?: boolean;
  /** Callback when remove button is clicked */
  onRemove?: () => void;
  /** Whether to show a dot indicator */
  dot?: boolean;
  /** Dot color (defaults to variant color) */
  dotColor?: string;
}

function Badge({
  className,
  variant,
  size,
  icon,
  endIcon,
  removable,
  onRemove,
  dot,
  dotColor,
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(badgeVariants({ variant, size }), className)}
      {...props}
    >
      {dot && (
        <span
          className={cn(
            'w-1.5 h-1.5 rounded-full',
            !dotColor && 'bg-current'
          )}
          style={dotColor ? { backgroundColor: dotColor } : undefined}
        />
      )}
      {icon && <span className="shrink-0">{icon}</span>}
      {children}
      {endIcon && <span className="shrink-0">{endIcon}</span>}
      {removable && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove?.();
          }}
          className={cn(
            'shrink-0 -mr-0.5 ml-0.5 p-0.5 rounded',
            'opacity-70 hover:opacity-100',
            'hover:bg-white/10',
            'transition-opacity duration-100',
            'focus:outline-none focus:ring-1 focus:ring-current'
          )}
        >
          <svg
            className="w-3 h-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      )}
    </span>
  );
}

/**
 * Badge Group - For rendering multiple badges together
 */
interface BadgeGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Maximum number of badges to show before collapsing */
  max?: number;
  /** Size for all badges */
  size?: 'sm' | 'default' | 'lg';
}

function BadgeGroup({
  children,
  max,
  size = 'default',
  className,
  ...props
}: BadgeGroupProps) {
  const childArray = React.Children.toArray(children);
  const visibleChildren = max ? childArray.slice(0, max) : childArray;
  const hiddenCount = max ? Math.max(0, childArray.length - max) : 0;

  return (
    <div
      className={cn('flex flex-wrap items-center gap-1.5', className)}
      {...props}
    >
      {visibleChildren.map((child, index) => (
        <React.Fragment key={index}>
          {React.isValidElement(child)
            ? React.cloneElement(child as React.ReactElement<BadgeProps>, { size })
            : child
          }
        </React.Fragment>
      ))}
      {hiddenCount > 0 && (
        <Badge variant="outline" size={size}>
          +{hiddenCount} more
        </Badge>
      )}
    </div>
  );
}

/**
 * Status Badge - Preset badge for status indicators
 */
type StatusType = 'online' | 'offline' | 'busy' | 'away' | 'pending';

interface StatusBadgeProps extends Omit<BadgeProps, 'variant' | 'dot' | 'dotColor'> {
  status: StatusType;
}

function StatusBadge({ status, children, ...props }: StatusBadgeProps) {
  const statusConfig: Record<StatusType, { variant: BadgeProps['variant']; label: string; dotColor: string }> = {
    online: { variant: 'success', label: 'Online', dotColor: 'hsl(152 76% 43%)' },
    offline: { variant: 'default', label: 'Offline', dotColor: 'hsl(224 10% 48%)' },
    busy: { variant: 'error', label: 'Busy', dotColor: 'hsl(350 89% 60%)' },
    away: { variant: 'warning', label: 'Away', dotColor: 'hsl(38 92% 50%)' },
    pending: { variant: 'primary', label: 'Pending', dotColor: 'hsl(192 100% 50%)' },
  };

  const config = statusConfig[status];

  return (
    <Badge
      variant={config.variant}
      dot
      dotColor={config.dotColor}
      {...props}
    >
      {children || config.label}
    </Badge>
  );
}

export { Badge, BadgeGroup, StatusBadge, badgeVariants };
