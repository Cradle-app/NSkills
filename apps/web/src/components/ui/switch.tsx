'use client';

import * as React from 'react';
import * as SwitchPrimitive from '@radix-ui/react-switch';
import { cn } from '@/lib/utils';

/**
 * Switch Component
 * 
 * A toggle switch for binary settings with refined styling,
 * smooth animations, and accessibility support.
 */

interface SwitchProps
  extends React.ComponentPropsWithoutRef<typeof SwitchPrimitive.Root> {
  /** Optional label displayed beside the switch */
  label?: string;
  /** Description text below the label */
  description?: string;
  /** Size variant */
  size?: 'sm' | 'default' | 'lg';
  /** Label position */
  labelPosition?: 'left' | 'right';
}

const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitive.Root>,
  SwitchProps
>(({ className, label, description, size = 'default', labelPosition = 'right', ...props }, ref) => {
  // Size configurations
  const sizeConfig = {
    sm: {
      track: 'h-4 w-7',
      thumb: 'h-3 w-3',
      translate: 'data-[state=checked]:translate-x-3',
    },
    default: {
      track: 'h-5 w-9',
      thumb: 'h-4 w-4',
      translate: 'data-[state=checked]:translate-x-4',
    },
    lg: {
      track: 'h-6 w-11',
      thumb: 'h-5 w-5',
      translate: 'data-[state=checked]:translate-x-5',
    },
  };

  const { track, thumb, translate } = sizeConfig[size];

  const switchElement = (
    <SwitchPrimitive.Root
      className={cn(
        // Base styles
        'peer inline-flex shrink-0 cursor-pointer items-center rounded-full',
        'border-2 border-transparent',
        'transition-all duration-200',
        // Track sizing
        track,
        // States
        'data-[state=unchecked]:bg-forge-border',
        'data-[state=checked]:bg-accent-cyan',
        // Hover
        'hover:data-[state=unchecked]:bg-forge-border-strong',
        'hover:data-[state=checked]:bg-accent-cyan/90',
        // Focus
        'focus-visible:outline-none',
        'focus-visible:ring-2 focus-visible:ring-accent-cyan/60',
        'focus-visible:ring-offset-2 focus-visible:ring-offset-forge-bg',
        // Disabled
        'disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
      {...props}
      ref={ref}
    >
      <SwitchPrimitive.Thumb
        className={cn(
          // Base styles
          'pointer-events-none block rounded-full',
          'bg-white shadow-sm',
          'transition-transform duration-200 ease-spring',
          // Sizing
          thumb,
          // Position
          'data-[state=unchecked]:translate-x-0',
          translate,
          // Subtle shadow when checked
          'data-[state=checked]:shadow-md'
        )}
      />
    </SwitchPrimitive.Root>
  );

  // If no label, return just the switch
  if (!label && !description) {
    return switchElement;
  }

  // With label/description
  return (
    <label className={cn(
      'flex items-start gap-3 cursor-pointer group',
      labelPosition === 'left' && 'flex-row-reverse justify-end'
    )}>
      {switchElement}
      <div className="flex flex-col gap-0.5">
        {label && (
          <span className={cn(
            'text-sm font-medium',
            'text-forge-text-secondary group-hover:text-white',
            'transition-colors duration-150',
            props.disabled && 'opacity-50'
          )}>
            {label}
          </span>
        )}
        {description && (
          <span className={cn(
            'text-xs text-forge-muted',
            props.disabled && 'opacity-50'
          )}>
            {description}
          </span>
        )}
      </div>
    </label>
  );
});
Switch.displayName = SwitchPrimitive.Root.displayName;

export { Switch };
