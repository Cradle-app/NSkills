import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { Loader2 } from 'lucide-react';

import { cn } from '@/lib/utils';

/**
 * Button variants using the new design system
 * 
 * Uses CSS custom properties for consistent theming
 */
const buttonVariants = cva(
  [
    'inline-flex items-center justify-center gap-2',
    'whitespace-nowrap font-medium',
    'transition-all duration-150 ease-out',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[hsl(var(--color-bg-base))]',
    'disabled:pointer-events-none disabled:opacity-50',
    'active:scale-[0.98]',
  ],
  {
    variants: {
      variant: {
        default: [
          'bg-[hsl(var(--color-accent-primary))] text-white font-semibold',
          'hover:bg-[hsl(var(--color-accent-primary)/0.9)]',
          'focus-visible:ring-[hsl(var(--color-accent-primary)/0.6)]',
          'shadow-sm hover:shadow-md',
        ],
        secondary: [
          'bg-[hsl(var(--color-bg-elevated))] text-[hsl(var(--color-text-primary))]',
          'border border-[hsl(var(--color-border-default))]',
          'hover:bg-[hsl(var(--color-bg-hover))] hover:border-[hsl(var(--color-border-strong))]',
          'focus-visible:ring-[hsl(var(--color-accent-secondary)/0.5)]',
        ],
        outline: [
          'border border-[hsl(var(--color-border-default))] bg-transparent',
          'text-[hsl(var(--color-text-primary))]',
          'hover:bg-[hsl(var(--color-bg-muted))] hover:border-[hsl(var(--color-border-strong))]',
          'focus-visible:ring-[hsl(var(--color-accent-secondary)/0.5)]',
        ],
        ghost: [
          'text-[hsl(var(--color-text-secondary))]',
          'hover:bg-[hsl(var(--color-bg-hover))] hover:text-[hsl(var(--color-text-primary))]',
          'focus-visible:ring-[hsl(var(--color-accent-secondary)/0.5)]',
        ],
        destructive: [
          'bg-[hsl(var(--color-error))] text-white',
          'hover:bg-[hsl(var(--color-error)/0.9)]',
          'focus-visible:ring-[hsl(var(--color-error)/0.5)]',
          'shadow-sm',
        ],
        link: [
          'text-[hsl(var(--color-accent-primary))] underline-offset-4',
          'hover:underline hover:text-[hsl(var(--color-accent-primary)/0.8)]',
          'focus-visible:ring-[hsl(var(--color-accent-primary)/0.5)]',
        ],
        success: [
          'bg-[hsl(var(--color-success))] text-white',
          'hover:bg-[hsl(var(--color-success)/0.9)]',
          'focus-visible:ring-[hsl(var(--color-success)/0.5)]',
          'shadow-sm',
        ],
        premium: [
          'bg-gradient-to-r from-[hsl(var(--color-accent-primary))] to-[hsl(var(--color-accent-secondary))]',
          'text-white font-semibold',
          'hover:brightness-110',
          'focus-visible:ring-[hsl(var(--color-accent-primary)/0.5)]',
          'shadow-md hover:shadow-lg',
        ],
        subtle: [
          'bg-[hsl(var(--color-bg-muted))]',
          'text-[hsl(var(--color-text-secondary))]',
          'hover:bg-[hsl(var(--color-bg-hover))] hover:text-[hsl(var(--color-text-primary))]',
          'focus-visible:ring-[hsl(var(--color-accent-secondary)/0.5)]',
        ],
      },
      size: {
        xs: 'h-7 px-2.5 text-xs rounded-md',
        sm: 'h-8 px-3 text-sm rounded-lg',
        default: 'h-10 px-4 text-sm rounded-lg',
        lg: 'h-11 px-5 text-base rounded-lg',
        xl: 'h-12 px-6 text-base rounded-xl',
        icon: 'h-9 w-9 rounded-lg',
        'icon-sm': 'h-7 w-7 rounded-md',
        'icon-lg': 'h-11 w-11 rounded-lg',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
  VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      asChild = false,
      loading = false,
      disabled = false,
      leftIcon,
      rightIcon,
      children,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : 'button';
    const isDisabled = disabled || loading;

    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={isDisabled}
        aria-busy={loading}
        {...props}
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          leftIcon
        )}
        {children}
        {!loading && rightIcon}
      </Comp>
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
