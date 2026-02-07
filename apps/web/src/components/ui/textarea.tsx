'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { AlertCircle, Check } from 'lucide-react';

/**
 * Textarea Component
 * 
 * A multiline text input with label, validation states,
 * and character count support.
 */

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  /** Optional label text */
  label?: string;
  /** Error message (shows error state) */
  error?: string;
  /** Success message (shows success state) */
  success?: string;
  /** Helper/hint text shown below textarea */
  helperText?: string;
  /** Maximum character count (shows counter if provided) */
  maxLength?: number;
  /** Whether to auto-resize based on content */
  autoResize?: boolean;
  /** Minimum rows when auto-resizing */
  minRows?: number;
  /** Maximum rows when auto-resizing */
  maxRows?: number;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({
    className,
    label,
    error,
    success,
    helperText,
    maxLength,
    autoResize = false,
    minRows = 3,
    maxRows = 8,
    required,
    disabled,
    id,
    value,
    onChange,
    ...props
  }, ref) => {
    // Internal ref for auto-resize
    const internalRef = React.useRef<HTMLTextAreaElement>(null);
    const textareaRef = (ref as React.RefObject<HTMLTextAreaElement>) || internalRef;

    // Generate unique ID if not provided
    const textareaId = id || React.useId();

    // Character count state
    const [charCount, setCharCount] = React.useState(
      typeof value === 'string' ? value.length : 0
    );

    // Determine current state
    const hasError = Boolean(error);
    const hasSuccess = Boolean(success) && !hasError;
    const isOverLimit = maxLength ? charCount > maxLength : false;

    // Auto-resize handler
    const handleAutoResize = React.useCallback(() => {
      if (!autoResize || !textareaRef.current) return;

      const textarea = textareaRef.current;
      const lineHeight = parseInt(getComputedStyle(textarea).lineHeight, 10) || 20;
      const minHeight = minRows * lineHeight;
      const maxHeight = maxRows * lineHeight;

      // Reset height to auto to get the correct scrollHeight
      textarea.style.height = 'auto';

      // Calculate new height
      const newHeight = Math.min(Math.max(textarea.scrollHeight, minHeight), maxHeight);
      textarea.style.height = `${newHeight}px`;

      // Show scrollbar if at max height
      textarea.style.overflowY = textarea.scrollHeight > maxHeight ? 'auto' : 'hidden';
    }, [autoResize, minRows, maxRows, textareaRef]);

    // Handle change
    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setCharCount(e.target.value.length);
      handleAutoResize();
      onChange?.(e);
    };

    // Initial auto-resize on mount
    React.useEffect(() => {
      handleAutoResize();
    }, [handleAutoResize, value]);

    return (
      <div className="flex flex-col gap-1.5 w-full">
        {/* Label */}
        {label && (
          <label
            htmlFor={textareaId}
            className="text-sm font-medium text-white flex items-center gap-1"
          >
            {label}
            {required && (
              <span className="text-accent-coral" aria-hidden="true">*</span>
            )}
          </label>
        )}

        {/* Textarea */}
        <textarea
          id={textareaId}
          ref={textareaRef}
          required={required}
          disabled={disabled}
          value={value}
          onChange={handleChange}
          aria-invalid={hasError}
          aria-describedby={
            error ? `${textareaId}-error` :
              helperText ? `${textareaId}-helper` :
                undefined
          }
          className={cn(
            // Base styles
            'w-full rounded-lg bg-forge-bg text-white',
            'px-3 py-2.5 text-sm',
            'border transition-all duration-150',
            'placeholder:text-[hsl(var(--color-placeholder))]',
            'resize-none',
            'min-h-[84px]',
            'focus:outline-none',

            // Default state
            'border-forge-border',
            'hover:border-forge-border-strong',
            'focus:border-accent-cyan focus:ring-2 focus:ring-accent-cyan/20',

            // Error state
            (hasError || isOverLimit) && [
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

        {/* Footer row: Messages + Character count */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            {/* Error message */}
            {hasError && (
              <p
                id={`${textareaId}-error`}
                className="text-xs text-accent-coral flex items-center gap-1"
                role="alert"
              >
                <AlertCircle className="w-3 h-3 shrink-0" />
                {error}
              </p>
            )}

            {/* Success message */}
            {hasSuccess && (
              <p className="text-xs text-accent-lime flex items-center gap-1">
                <Check className="w-3 h-3 shrink-0" />
                {success}
              </p>
            )}

            {/* Helper text (only show if no error/success) */}
            {helperText && !hasError && !hasSuccess && (
              <p
                id={`${textareaId}-helper`}
                className="text-xs text-forge-muted"
              >
                {helperText}
              </p>
            )}
          </div>

          {/* Character count */}
          {maxLength && (
            <span
              className={cn(
                'text-xs shrink-0',
                isOverLimit ? 'text-accent-coral' : 'text-forge-muted'
              )}
            >
              {charCount}/{maxLength}
            </span>
          )}
        </div>
      </div>
    );
  }
);
Textarea.displayName = 'Textarea';

export { Textarea };
