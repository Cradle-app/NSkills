'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { CheckCircle2, AlertCircle, AlertTriangle } from 'lucide-react';

/**
 * Validation Indicator Component
 * 
 * A status indicator for form validation feedback.
 * Updated to use the new design system tokens.
 */

type ValidationStatus = 'valid' | 'error' | 'warning' | 'none';

interface ValidationIndicatorProps {
    status: ValidationStatus;
    message?: string;
    className?: string;
    showIcon?: boolean;
}

export function ValidationIndicator({
    status,
    message,
    className,
    showIcon = true,
}: ValidationIndicatorProps) {
    if (status === 'none') return null;

    const config = {
        valid: {
            icon: CheckCircle2,
            color: 'text-accent-lime',
            bg: 'bg-accent-lime/10',
            border: 'border-accent-lime/30',
        },
        error: {
            icon: AlertCircle,
            color: 'text-accent-coral',
            bg: 'bg-accent-coral/10',
            border: 'border-accent-coral/30',
        },
        warning: {
            icon: AlertTriangle,
            color: 'text-accent-amber',
            bg: 'bg-accent-amber/10',
            border: 'border-accent-amber/30',
        },
        none: {
            icon: CheckCircle2,
            color: '',
            bg: '',
            border: '',
        },
    };

    const Icon = config[status].icon;

    return (
        <div className={cn('flex items-center gap-1.5', className)}>
            {showIcon && <Icon className={cn('w-3.5 h-3.5', config[status].color)} />}
            {message && (
                <span className={cn('text-xs font-medium', config[status].color)}>
                    {message}
                </span>
            )}
        </div>
    );
}

/**
 * Wrapper for input fields with validation
 */
interface ValidatedInputProps {
    label: string;
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    required?: boolean;
    validate?: (value: string) => { status: ValidationStatus; message?: string };
    className?: string;
    disabled?: boolean;
}

export function ValidatedInput({
    label,
    value,
    onChange,
    placeholder,
    required = false,
    validate,
    className,
    disabled = false,
}: ValidatedInputProps) {
    const validation = validate ? validate(value) : { status: 'none' as ValidationStatus };
    const isEmpty = required && !value.trim();
    const showError = isEmpty
        ? { status: 'error' as ValidationStatus, message: 'Required' }
        : validation;

    return (
        <div className={cn('space-y-1.5', className)}>
            <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-white">
                    {label}
                    {required && <span className="text-accent-coral ml-0.5">*</span>}
                </label>
                {showError.status !== 'none' && (
                    <ValidationIndicator status={showError.status} message={showError.message} />
                )}
            </div>
            <input
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                disabled={disabled}
                className={cn(
                    'w-full px-3 py-2.5 text-sm rounded-lg transition-all duration-150',
                    'bg-forge-bg border text-white placeholder:text-[hsl(var(--color-placeholder))]',
                    'focus:outline-none focus:ring-2',
                    'disabled:opacity-50 disabled:cursor-not-allowed',
                    showError.status === 'error' && 'border-accent-coral focus:ring-accent-coral/20 focus:border-accent-coral',
                    showError.status === 'warning' && 'border-accent-amber focus:ring-accent-amber/20 focus:border-accent-amber',
                    showError.status === 'valid' && 'border-accent-lime focus:ring-accent-lime/20 focus:border-accent-lime',
                    showError.status === 'none' && 'border-forge-border focus:border-accent-cyan focus:ring-accent-cyan/20 hover:border-forge-border-strong'
                )}
            />
        </div>
    );
}

/**
 * Common validators
 */
export const validators = {
    required: (value: string) => ({
        status: value.trim() ? 'valid' : 'error',
        message: value.trim() ? '' : 'Required',
    } as { status: ValidationStatus; message: string }),

    url: (value: string) => {
        if (!value.trim()) return { status: 'none' as ValidationStatus };
        try {
            new URL(value);
            return { status: 'valid' as ValidationStatus };
        } catch {
            return { status: 'error' as ValidationStatus, message: 'Invalid URL' };
        }
    },

    identifier: (value: string) => {
        if (!value.trim()) return { status: 'none' as ValidationStatus };
        const valid = /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(value);
        return valid
            ? { status: 'valid' as ValidationStatus }
            : { status: 'error' as ValidationStatus, message: 'Must be a valid identifier' };
    },

    contractName: (value: string) => {
        if (!value.trim()) return { status: 'none' as ValidationStatus };
        const valid = /^[A-Z][a-zA-Z0-9]*$/.test(value);
        return valid
            ? { status: 'valid' as ValidationStatus }
            : { status: 'warning' as ValidationStatus, message: 'Should be PascalCase' };
    },

    email: (value: string) => {
        if (!value.trim()) return { status: 'none' as ValidationStatus };
        const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
        return valid
            ? { status: 'valid' as ValidationStatus }
            : { status: 'error' as ValidationStatus, message: 'Invalid email' };
    },

    minLength: (min: number) => (value: string) => {
        if (!value.trim()) return { status: 'none' as ValidationStatus };
        return value.length >= min
            ? { status: 'valid' as ValidationStatus }
            : { status: 'error' as ValidationStatus, message: `Min ${min} characters` };
    },

    maxLength: (max: number) => (value: string) => {
        if (!value.trim()) return { status: 'none' as ValidationStatus };
        return value.length <= max
            ? { status: 'valid' as ValidationStatus }
            : { status: 'error' as ValidationStatus, message: `Max ${max} characters` };
    },
};

export type { ValidationStatus };
