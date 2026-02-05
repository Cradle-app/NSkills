'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Check, Loader2, Circle, AlertCircle } from 'lucide-react';

export type StepStatus = 'pending' | 'active' | 'completed' | 'error';

export interface ProgressStep {
    id: string;
    label: string;
    description?: string;
    status: StepStatus;
}

interface GenerationProgressProps {
    steps: ProgressStep[];
    currentStepId: string | null;
    className?: string;
}

export function GenerationProgress({ steps, currentStepId, className }: GenerationProgressProps) {
    return (
        <div className={cn('space-y-4', className)}>
            {steps.map((step, index) => {
                const isActive = step.id === currentStepId;
                const isCompleted = step.status === 'completed';
                const isError = step.status === 'error';
                const isPending = step.status === 'pending';

                return (
                    <motion.div
                        key={step.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-start gap-4"
                    >
                        {/* Step indicator */}
                        <div className="relative flex flex-col items-center">
                            <div
                                className={cn(
                                    'w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-300',
                                    isCompleted && 'bg-emerald-500 border-emerald-500',
                                    isActive && 'bg-accent-cyan/20 border-accent-cyan animate-pulse',
                                    isError && 'bg-red-500/20 border-red-500',
                                    isPending && 'bg-forge-elevated border-forge-border'
                                )}
                            >
                                {isCompleted && <Check className="w-4 h-4 text-white" />}
                                {isActive && <Loader2 className="w-4 h-4 text-accent-cyan animate-spin" />}
                                {isError && <AlertCircle className="w-4 h-4 text-red-400" />}
                                {isPending && <Circle className="w-4 h-4 text-forge-muted" />}
                            </div>

                            {/* Connector line */}
                            {index < steps.length - 1 && (
                                <div
                                    className={cn(
                                        'w-0.5 h-8 mt-2 transition-all duration-500',
                                        isCompleted ? 'bg-emerald-500' : 'bg-forge-border'
                                    )}
                                />
                            )}
                        </div>

                        {/* Step content */}
                        <div className="flex-1 pt-1">
                            <h4
                                className={cn(
                                    'text-sm font-medium transition-colors',
                                    isCompleted && 'text-emerald-400',
                                    isActive && 'text-accent-cyan',
                                    isError && 'text-red-400',
                                    isPending && 'text-forge-muted'
                                )}
                            >
                                {step.label}
                            </h4>
                            {step.description && (
                                <p className="text-xs text-forge-muted mt-0.5">
                                    {step.description}
                                </p>
                            )}
                        </div>
                    </motion.div>
                );
            })}
        </div>
    );
}

export const DEFAULT_GENERATION_STEPS: ProgressStep[] = [
    { id: 'validate', label: 'Validating Blueprint', description: 'Checking node configurations', status: 'pending' },
    { id: 'prepare', label: 'Preparing Context', description: 'Building generation context', status: 'pending' },
    { id: 'generate', label: 'Generating Code', description: 'Creating project files', status: 'pending' },
    { id: 'push', label: 'Pushing to GitHub', description: 'Creating repository and pushing', status: 'pending' },
    { id: 'complete', label: 'Complete', description: 'Your project is ready!', status: 'pending' },
];

// Hook to manage generation progress steps
export function useGenerationProgress() {
    const defaultSteps = useMemo(() => DEFAULT_GENERATION_STEPS.map((s) => ({ ...s })), []);
    return { defaultSteps };
}
