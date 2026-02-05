'use client';

import { cn } from '@/lib/utils';
import { CheckCircle2, AlertCircle, AlertTriangle } from 'lucide-react';

type ValidationStatus = 'valid' | 'error' | 'warning' | 'none';

interface ValidationIndicatorProps {
    status: ValidationStatus;
    message?: string;
    className?: string;
}

export function ValidationIndicator({
    status,
    message,
    className,
}: ValidationIndicatorProps) {
    if (status === 'none') return null;

    const config = {
        valid: {
            icon: CheckCircle2,
            color: 'text-emerald-400',
            bg: 'bg-emerald-500/10',
            border: 'border-emerald-500/30',
        },
        error: {
            icon: AlertCircle,
            color: 'text-red-400',
            bg: 'bg-red-500/10',
            border: 'border-red-500/30',
        },
        warning: {
            icon: AlertTriangle,
            color: 'text-amber-400',
            bg: 'bg-amber-500/10',
            border: 'border-amber-500/30',
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
        <div className={cn('flex items-center gap-2', className)}>
            <Icon className={cn('w-4 h-4', config[status].color)} />
            {message && (
                <span className={cn('text-xs', config[status].color)}>{message}</span>
            )}
        </div>
    );
}

// Wrapper for input fields with validation
interface ValidatedInputProps {
    label: string;
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    required?: boolean;
    validate?: (value: string) => { status: ValidationStatus; message?: string };
    className?: string;
}

export function ValidatedInput({
    label,
    value,
    onChange,
    placeholder,
    required = false,
    validate,
    className,
}: ValidatedInputProps) {
    const validation = validate ? validate(value) : { status: 'none' as ValidationStatus };
    const isEmpty = required && !value.trim();
    const showError = isEmpty ? { status: 'error' as ValidationStatus, message: 'Required' } : validation;

    return (
        <div className={cn('space-y-1.5', className)}>
            <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-white">
                    {label}
                    {required && <span className="text-red-400 ml-0.5">*</span>}
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
                className={cn(
                    'w-full px-3 py-2 text-sm rounded-lg transition-all',
                    'bg-forge-bg border text-white placeholder:text-forge-muted/50',
                    'focus:outline-none focus:ring-2',
                    showError.status === 'error' && 'border-red-500/50 focus:ring-red-500/30',
                    showError.status === 'warning' && 'border-amber-500/50 focus:ring-amber-500/30',
                    showError.status === 'valid' && 'border-emerald-500/50 focus:ring-emerald-500/30',
                    showError.status === 'none' && 'border-forge-border focus:border-accent-cyan/50 focus:ring-accent-cyan/20'
                )}
            />
        </div>
    );
}

// Common validators
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
};
