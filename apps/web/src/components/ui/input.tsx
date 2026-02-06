'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { AlertCircle, Check, Info } from 'lucide-react';

/**
 * Input Component
 * 
 * A versatile input field with built-in label, validation states,
 * helper text, and icon support. Designed for accessibility and
 * consistent styling.
 */

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  /** Optional label text */
  label?: string;
  /** Error message (shows error state) */
  error?: string;
  /** Success message (shows success state) */
  success?: string;
  /** Helper/hint text shown below input */
  helperText?: string;
  /** Icon to show at the start of input */
  leftIcon?: React.ReactNode;
  /** Icon or element to show at the end of input */
  rightIcon?: React.ReactNode;
  /** Size variant */
  inputSize?: 'sm' | 'default' | 'lg';
  /** Full width */
  fullWidth?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({
    className,
    type = 'text',
    label,
    error,
    success,
    helperText,
    leftIcon,
    rightIcon,
    inputSize = 'default',
    fullWidth = true,
    required,
    disabled,
    id,
    ...props
  }, ref) => {
    // Generate unique ID if not provided
    const inputId = id || React.useId();

    // Determine current state
    const hasError = Boolean(error);
    const hasSuccess = Boolean(success) && !hasError;

    // Status icon for right side
    const statusIcon = hasError ? (
      <AlertCircle className="w-4 h-4 text-accent-coral" />
    ) : hasSuccess ? (
      <Check className="w-4 h-4 text-accent-lime" />
    ) : null;

    // Size-based classes
    const sizeClasses = {
      sm: 'h-8 text-sm px-2.5',
      default: 'h-10 text-sm px-3',
      lg: 'h-12 text-base px-4',
    };

    return (
      <div className={cn('flex flex-col gap-1.5', fullWidth && 'w-full')}>
        {/* Label */}
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-white flex items-center gap-1"
          >
            {label}
            {required && (
              <span className="text-accent-coral" aria-hidden="true">*</span>
            )}
          </label>
        )}

        {/* Input wrapper */}
        <div className="relative">
          {/* Left icon */}
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-forge-muted pointer-events-none">
              {leftIcon}
            </div>
          )}

          {/* Input field */}
          <input
            id={inputId}
            type={type}
            ref={ref}
            required={required}
            disabled={disabled}
            aria-invalid={hasError}
            aria-describedby={
              error ? `${inputId}-error` :
                helperText ? `${inputId}-helper` :
                  undefined
            }
            className={cn(
              // Base styles
              'w-full rounded-lg bg-forge-bg text-white',
              'border transition-all duration-150',
              'placeholder:text-forge-muted',
              'focus:outline-none',

              // Size
              sizeClasses[inputSize],

              // Icon padding
              leftIcon && 'pl-10',
              (rightIcon || statusIcon) && 'pr-10',

              // Default state
              'border-forge-border',
              'hover:border-forge-border-strong',
              'focus:border-accent-cyan focus:ring-2 focus:ring-accent-cyan/20',

              // Error state
              hasError && [
                'border-accent-coral',
                'focus:border-accent-coral focus:ring-accent-coral/20',
              ],

              // Success state
              hasSuccess && [
                'border-accent-lime',
                'focus:border-accent-lime focus:ring-accent-lime/20',
              ],

              // Disabled state
              disabled && 'opacity-50 cursor-not-allowed bg-forge-surface',

              className
            )}
            {...props}
          />

          {/* Right icon / Status icon */}
          {(rightIcon || statusIcon) && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
              {statusIcon || rightIcon}
            </div>
          )}
        </div>

        {/* Error message */}
        {hasError && (
          <p
            id={`${inputId}-error`}
            className="text-xs text-accent-coral flex items-center gap-1"
            role="alert"
          >
            <AlertCircle className="w-3 h-3 shrink-0" />
            {error}
          </p>
        )}

        {/* Success message */}
        {hasSuccess && (
          <p
            className="text-xs text-accent-lime flex items-center gap-1"
          >
            <Check className="w-3 h-3 shrink-0" />
            {success}
          </p>
        )}

        {/* Helper text (only show if no error/success) */}
        {helperText && !hasError && !hasSuccess && (
          <p
            id={`${inputId}-helper`}
            className="text-xs text-forge-muted flex items-center gap-1"
          >
            <Info className="w-3 h-3 shrink-0" />
            {helperText}
          </p>
        )}
      </div>
    );
  }
);
Input.displayName = 'Input';

export { Input };
