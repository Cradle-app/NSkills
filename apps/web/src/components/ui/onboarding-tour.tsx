'use client';

import { useState, useEffect, useCallback, createContext, useContext, useLayoutEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, Sparkles, MousePointer, Command, Play } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './button';

interface TourStep {
    id: string;
    title: string;
    description: string;
    targetSelector?: string;
    position?: 'top' | 'bottom' | 'left' | 'right';
    icon?: typeof Sparkles;
}

interface OnboardingTourContextValue {
    isActive: boolean;
    currentStep: number;
    steps: TourStep[];
    startTour: () => void;
    endTour: () => void;
    nextStep: () => void;
    prevStep: () => void;
    goToStep: (step: number) => void;
}

const OnboardingTourContext = createContext<OnboardingTourContextValue | null>(null);

export function useOnboardingTour() {
    const context = useContext(OnboardingTourContext);
    if (!context) {
        throw new Error('useOnboardingTour must be used within an OnboardingTourProvider');
    }
    return context;
}

const STORAGE_KEY = 'cradle-onboarding-completed';

const DEFAULT_STEPS: TourStep[] = [
    {
        id: 'welcome',
        title: 'Welcome to Cradle',
        description: 'Cradle is a visual skills composer for Web3 projects. Lay out your architecture here, then generate a skills repo that Claude Code uses to scaffold the full project.',
        icon: Sparkles,
    },
    {
        id: 'palette',
        title: 'Component Palette',
        description: 'This panel holds every building block: Stylus contracts, DeFi protocols, AI agents, Telegram bots, analytics, and more. Drag any block onto the canvas.',
        targetSelector: '[data-tour="palette"]',
        position: 'right',
        icon: MousePointer,
    },
    {
        id: 'canvas',
        title: 'Composition Canvas',
        description: 'Arrange blocks and draw connections to define how components depend on each other. Shimmer blocks are optional suggestions you can activate with a click.',
        targetSelector: '[data-tour="canvas"]',
        position: 'bottom',
    },
    {
        id: 'config',
        title: 'Block Configuration',
        description: 'Click any block to open its settings. Fill in contract names, API keys, prompts, and other details so the generated skills repo has full context.',
        targetSelector: '[data-tour="config"]',
        position: 'left',
    },
    {
        id: 'search',
        title: 'Quick Search',
        description: 'Press Cmd+K (or Ctrl+K) to search for blocks by name and jump to them on the canvas.',
        icon: Command,
    },
    {
        id: 'generate',
        title: 'Build',
        description: 'When your blueprint is ready, click Build to generate a skills repo, a production codebase, or both. The output is pushed straight to a GitHub repository.',
        targetSelector: '[data-tour="generate"]',
        position: 'bottom',
        icon: Play,
    },
];

interface OnboardingTourProviderProps {
    children: React.ReactNode;
    steps?: TourStep[];
}

export function OnboardingTourProvider({ children, steps = DEFAULT_STEPS }: OnboardingTourProviderProps) {
    const [isActive, setIsActive] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);

    // Check if onboarding was completed
    useEffect(() => {
        const completed = localStorage.getItem(STORAGE_KEY);
        if (!completed) {
            // Show tour for new users after a short delay
            const timer = setTimeout(() => {
                setIsActive(true);
            }, 1500);
            return () => clearTimeout(timer);
        }
    }, []);

    const startTour = useCallback(() => {
        setCurrentStep(0);
        setIsActive(true);
    }, []);

    const endTour = useCallback(() => {
        setIsActive(false);
        localStorage.setItem(STORAGE_KEY, 'true');
    }, []);

    const nextStep = useCallback(() => {
        if (currentStep < steps.length - 1) {
            setCurrentStep(prev => prev + 1);
        } else {
            endTour();
        }
    }, [currentStep, steps.length, endTour]);

    const prevStep = useCallback(() => {
        if (currentStep > 0) {
            setCurrentStep(prev => prev - 1);
        }
    }, [currentStep]);

    const goToStep = useCallback((step: number) => {
        if (step >= 0 && step < steps.length) {
            setCurrentStep(step);
        }
    }, [steps.length]);

    return (
        <OnboardingTourContext.Provider
            value={{
                isActive,
                currentStep,
                steps,
                startTour,
                endTour,
                nextStep,
                prevStep,
                goToStep,
            }}
        >
            {children}
            <AnimatePresence>
                {isActive && <TourOverlay />}
            </AnimatePresence>
        </OnboardingTourContext.Provider>
    );
}

function TourOverlay() {
    const { steps, currentStep, nextStep, prevStep, endTour } = useOnboardingTour();
    const step = steps[currentStep];
    const Icon = step.icon || Sparkles;

    const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null);

    useLayoutEffect(() => {
        if (!step.targetSelector) {
            setAnchorRect(null);
            return;
        }
        const el = document.querySelector(step.targetSelector) as HTMLElement | null;
        if (!el) {
            setAnchorRect(null);
            return;
        }
        const update = () => setAnchorRect(el.getBoundingClientRect());
        update();
        window.addEventListener('resize', update);
        window.addEventListener('scroll', update, true);
        return () => {
            window.removeEventListener('resize', update);
            window.removeEventListener('scroll', update, true);
        };
    }, [step.targetSelector]);

    const placement = (step.position ?? 'bottom') as 'top' | 'bottom' | 'left' | 'right';

    const positionedStyle = useMemo(() => {
        // Default center
        if (!anchorRect) {
            return { left: '50%', top: '50%', transform: 'translate(-50%, -50%)' } as React.CSSProperties;
        }

        const GAP = 14;
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        const cardW = 384; // w-96
        const cardH = 320; // approximate; content varies but good enough

        const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

        let left = anchorRect.left;
        let top = anchorRect.top;

        if (placement === 'right') {
            left = anchorRect.right + GAP;
            top = anchorRect.top + anchorRect.height / 2 - cardH / 2;
        } else if (placement === 'left') {
            left = anchorRect.left - GAP - cardW;
            top = anchorRect.top + anchorRect.height / 2 - cardH / 2;
        } else if (placement === 'top') {
            left = anchorRect.left + anchorRect.width / 2 - cardW / 2;
            top = anchorRect.top - GAP - cardH;
        } else {
            // bottom
            left = anchorRect.left + anchorRect.width / 2 - cardW / 2;
            top = anchorRect.bottom + GAP;
        }

        left = clamp(left, 12, vw - cardW - 12);
        top = clamp(top, 12, vh - cardH - 12);

        return { left, top } as React.CSSProperties;
    }, [anchorRect, placement]);

    const arrow = useMemo(() => {
        if (!anchorRect) return null;
        const base = 'absolute w-3 h-3 rotate-45 bg-forge-surface border border-forge-border/60';
        if (placement === 'right') return <div className={cn(base, 'left-[-6px] top-1/2 -translate-y-1/2 border-r-0 border-t-0')} />;
        if (placement === 'left') return <div className={cn(base, 'right-[-6px] top-1/2 -translate-y-1/2 border-l-0 border-b-0')} />;
        if (placement === 'top') return <div className={cn(base, 'bottom-[-6px] left-1/2 -translate-x-1/2 border-l-0 border-t-0')} />;
        // bottom
        return <div className={cn(base, 'top-[-6px] left-1/2 -translate-x-1/2 border-r-0 border-b-0')} />;
    }, [anchorRect, placement]);

    return (
        <>
            {/* Tour Card (no fullscreen backdrop so underlying UI stays visible) */}
            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className={cn(
                    'fixed z-[101] w-96 p-6 rounded-2xl',
                    'bg-forge-surface border border-forge-border/60',
                    'shadow-2xl shadow-black/50'
                )}
                style={positionedStyle}
            >
                {arrow}
                {/* Close button */}
                <button
                    onClick={endTour}
                    className="absolute top-4 right-4 p-1 rounded-lg hover:bg-forge-elevated/50 transition-colors"
                >
                    <X className="w-4 h-4 text-forge-muted" />
                </button>

                {/* Icon */}
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent-cyan/20 to-accent-purple/20 flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6 text-accent-cyan" />
                </div>

                {/* Content */}
                <h3 className="text-lg font-semibold text-white mb-2">{step.title}</h3>
                <p className="text-sm text-forge-text/80 leading-relaxed mb-6">{step.description}</p>

                {/* Progress dots */}
                <div className="flex items-center justify-center gap-1.5 mb-6">
                    {steps.map((_, index) => (
                        <div
                            key={index}
                            className={cn(
                                'w-2 h-2 rounded-full transition-all',
                                index === currentStep
                                    ? 'w-6 bg-accent-cyan'
                                    : index < currentStep
                                        ? 'bg-accent-cyan/50'
                                        : 'bg-forge-border'
                            )}
                        />
                    ))}
                </div>

                {/* Navigation */}
                <div className="flex items-center justify-between">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={prevStep}
                        disabled={currentStep === 0}
                        className="text-forge-muted"
                    >
                        <ChevronLeft className="w-4 h-4 mr-1" />
                        Back
                    </Button>

                    <Button
                        size="sm"
                        onClick={nextStep}
                        className="bg-accent-cyan hover:bg-accent-cyan/90 text-black"
                    >
                        {currentStep === steps.length - 1 ? (
                            'Get Started'
                        ) : (
                            <>
                                Next
                                <ChevronRight className="w-4 h-4 ml-1" />
                            </>
                        )}
                    </Button>
                </div>
            </motion.div>
        </>
    );
}

// Button to restart tour from settings
export function RestartTourButton({ className }: { className?: string }) {
    const { startTour } = useOnboardingTour();

    return (
        <Button
            variant="ghost"
            size="sm"
            onClick={() => {
                localStorage.removeItem(STORAGE_KEY);
                startTour();
            }}
            className={className}
        >
            <Sparkles className="w-4 h-4 mr-2" />
            Restart Tour
        </Button>
    );
}
