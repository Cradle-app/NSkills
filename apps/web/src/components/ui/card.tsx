'use client';

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

/**
 * Card Component
 * 
 * A versatile card container with multiple variants for consistent
 * presentation of grouped content throughout the application.
 */

const cardVariants = cva(
  // Base styles
  [
    'rounded-xl border transition-all duration-200',
  ],
  {
    variants: {
      variant: {
        // Default card
        default: [
          'bg-forge-surface border-forge-border',
          'shadow-sm',
        ],
        // Elevated card (more prominent)
        elevated: [
          'bg-forge-elevated border-forge-border',
          'shadow-md',
        ],
        // Glass/frosted effect
        glass: [
          'bg-forge-surface/80 backdrop-blur-xl',
          'border-forge-border/50',
          'shadow-lg',
        ],
        // Interactive card with hover effects
        interactive: [
          'bg-forge-surface border-forge-border',
          'shadow-sm',
          'hover:bg-forge-hover hover:border-forge-border-strong',
          'hover:shadow-lg hover:-translate-y-0.5',
          'cursor-pointer',
          'active:scale-[0.99]',
        ],
        // Outline only
        outline: [
          'bg-transparent border-forge-border',
        ],
        // Ghost (minimal)
        ghost: [
          'bg-transparent border-transparent',
          'hover:bg-forge-hover/50',
        ],
        // Gradient border effect
        gradient: [
          'bg-forge-surface border-transparent',
          'shadow-lg',
          'relative',
          'before:absolute before:inset-0 before:-z-10',
          'before:rounded-xl before:p-px',
          'before:bg-gradient-to-br before:from-accent-cyan/50 before:via-accent-purple/30 before:to-transparent',
        ],
      },
      padding: {
        none: 'p-0',
        sm: 'p-3',
        default: 'p-4',
        lg: 'p-6',
        xl: 'p-8',
      },
    },
    defaultVariants: {
      variant: 'default',
      padding: 'default',
    },
  }
);

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
  VariantProps<typeof cardVariants> { }

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, padding, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(cardVariants({ variant, padding, className }))}
      {...props}
    />
  )
);
Card.displayName = 'Card';

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    icon?: React.ReactNode;
    action?: React.ReactNode;
  }
>(({ className, icon, action, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'flex items-start justify-between gap-4',
      'pb-4 border-b border-forge-border/50',
      className
    )}
    {...props}
  >
    <div className="flex items-center gap-3 min-w-0">
      {icon && (
        <div className="shrink-0 w-9 h-9 rounded-lg bg-forge-elevated flex items-center justify-center text-accent-cyan">
          {icon}
        </div>
      )}
      <div className="min-w-0">{children}</div>
    </div>
    {action && <div className="shrink-0">{action}</div>}
  </div>
));
CardHeader.displayName = 'CardHeader';

const CardTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      'text-base font-semibold text-white leading-tight tracking-tight',
      className
    )}
    {...props}
  />
));
CardTitle.displayName = 'CardTitle';

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn(
      'text-sm text-forge-muted leading-relaxed mt-0.5',
      className
    )}
    {...props}
  />
));
CardDescription.displayName = 'CardDescription';

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('py-4', className)}
    {...props}
  />
));
CardContent.displayName = 'CardContent';

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'flex items-center justify-end gap-3',
      'pt-4 border-t border-forge-border/50',
      className
    )}
    {...props}
  />
));
CardFooter.displayName = 'CardFooter';

/**
 * Feature Card - Preset for feature/info cards
 */
interface FeatureCardProps extends React.HTMLAttributes<HTMLDivElement> {
  icon: React.ReactNode;
  title: string;
  description?: string;
  iconColor?: string;
}

const FeatureCard = React.forwardRef<HTMLDivElement, FeatureCardProps>(
  ({ icon, title, description, iconColor, className, children, ...props }, ref) => (
    <Card
      ref={ref}
      variant="interactive"
      className={cn('group', className)}
      {...props}
    >
      <div className="flex items-start gap-4">
        <div
          className={cn(
            'shrink-0 w-12 h-12 rounded-xl',
            'bg-forge-elevated group-hover:bg-forge-hover',
            'flex items-center justify-center',
            'transition-all duration-200',
            'group-hover:scale-105'
          )}
          style={iconColor ? { color: iconColor } : undefined}
        >
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <h4 className="text-sm font-semibold text-white mb-1 group-hover:text-accent-cyan transition-colors">
            {title}
          </h4>
          {description && (
            <p className="text-sm text-forge-muted leading-relaxed">
              {description}
            </p>
          )}
          {children}
        </div>
      </div>
    </Card>
  )
);
FeatureCard.displayName = 'FeatureCard';

/**
 * Stat Card - Preset for statistics/metrics
 */
interface StatCardProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    isPositive?: boolean;
  };
  description?: string;
}

const StatCard = React.forwardRef<HTMLDivElement, StatCardProps>(
  ({ label, value, icon, trend, description, className, ...props }, ref) => (
    <Card
      ref={ref}
      padding="lg"
      className={cn('', className)}
      {...props}
    >
      <div className="flex items-start justify-between mb-3">
        <span className="text-sm font-medium text-forge-muted">{label}</span>
        {icon && (
          <span className="text-forge-muted">{icon}</span>
        )}
      </div>
      <div className="flex items-end gap-3">
        <span className="text-2xl font-bold text-white tracking-tight">
          {value}
        </span>
        {trend && (
          <span
            className={cn(
              'text-sm font-medium mb-0.5',
              trend.isPositive !== false ? 'text-accent-lime' : 'text-accent-coral'
            )}
          >
            {trend.isPositive !== false ? '↑' : '↓'} {Math.abs(trend.value)}%
          </span>
        )}
      </div>
      {description && (
        <p className="text-xs text-forge-muted mt-2">{description}</p>
      )}
    </Card>
  )
);
StatCard.displayName = 'StatCard';

export {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  FeatureCard,
  StatCard,
  cardVariants,
};
