'use client';

import * as React from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { X, CheckCircle2, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Toast/Toaster Component
 * 
 * A notification system with multiple toast types, animations,
 * and auto-dismiss functionality.
 */

type ToastType = 'success' | 'error' | 'info' | 'warning' | 'default';
type ToastPosition = 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';

interface Toast {
  id: string;
  title: string;
  description?: string;
  type?: ToastType;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

type ToastOptions = Partial<Omit<Toast, 'id' | 'title' | 'type'>>;

interface ToastContextValue {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => string;
  removeToast: (id: string) => void;
  updateToast: (id: string, toast: Partial<Omit<Toast, 'id'>>) => void;
  dismissAll: () => void;
  // Convenience methods - support both (title) and (title, description) or (title, options) signatures
  success: (title: string, descriptionOrOptions?: string | ToastOptions) => string;
  error: (title: string, descriptionOrOptions?: string | ToastOptions) => string;
  warning: (title: string, descriptionOrOptions?: string | ToastOptions) => string;
  info: (title: string, descriptionOrOptions?: string | ToastOptions) => string;
}

const ToastContext = React.createContext<ToastContextValue | undefined>(undefined);

export function useToast() {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

interface ToasterProps {
  children?: React.ReactNode;
  position?: ToastPosition;
  maxToasts?: number;
}

// Alias for backwards compatibility
export const ToastProvider = Toaster;

export function Toaster({
  children,
  position = 'bottom-right',
  maxToasts = 5
}: ToasterProps) {
  const [toasts, setToasts] = React.useState<Toast[]>([]);

  const addToast = React.useCallback((toast: Omit<Toast, 'id'>): string => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => {
      const newToasts = [...prev, { id, ...toast }];
      // Limit number of toasts
      return newToasts.slice(-maxToasts);
    });
    return id;
  }, [maxToasts]);

  const removeToast = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const updateToast = React.useCallback((id: string, updates: Partial<Omit<Toast, 'id'>>) => {
    setToasts((prev) =>
      prev.map((toast) =>
        toast.id === id ? { ...toast, ...updates } : toast
      )
    );
  }, []);

  const dismissAll = React.useCallback(() => {
    setToasts([]);
  }, []);

  // Helper to normalize options
  const normalizeOptions = (descriptionOrOptions?: string | ToastOptions): ToastOptions => {
    if (!descriptionOrOptions) return {};
    if (typeof descriptionOrOptions === 'string') {
      return { description: descriptionOrOptions };
    }
    return descriptionOrOptions;
  };

  // Convenience methods - support both signature styles
  const success = React.useCallback((title: string, descriptionOrOptions?: string | ToastOptions) => {
    return addToast({ title, type: 'success', ...normalizeOptions(descriptionOrOptions) });
  }, [addToast]);

  const error = React.useCallback((title: string, descriptionOrOptions?: string | ToastOptions) => {
    return addToast({ title, type: 'error', ...normalizeOptions(descriptionOrOptions) });
  }, [addToast]);

  const warning = React.useCallback((title: string, descriptionOrOptions?: string | ToastOptions) => {
    return addToast({ title, type: 'warning', ...normalizeOptions(descriptionOrOptions) });
  }, [addToast]);

  const info = React.useCallback((title: string, descriptionOrOptions?: string | ToastOptions) => {
    return addToast({ title, type: 'info', ...normalizeOptions(descriptionOrOptions) });
  }, [addToast]);

  // Position classes
  const positionClasses: Record<ToastPosition, string> = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'top-center': 'top-4 left-1/2 -translate-x-1/2',
    'bottom-center': 'bottom-4 left-1/2 -translate-x-1/2',
  };

  // Animation variants based on position
  const getAnimationVariants = (): Variants => {
    const isTop = position.startsWith('top');
    const isLeft = position.includes('left');
    const isCenter = position.includes('center');

    return {
      initial: {
        opacity: 0,
        y: isTop ? -20 : 20,
        x: isCenter ? '-50%' : 0,
        scale: 0.95,
      },
      animate: {
        opacity: 1,
        y: 0,
        x: isCenter ? '-50%' : 0,
        scale: 1,
      },
      exit: {
        opacity: 0,
        x: isCenter ? '-50%' : (isLeft ? -100 : 100),
        scale: 0.95,
        transition: { duration: 0.15 }
      },
    };
  };

  const contextValue = React.useMemo(() => ({
    toasts,
    addToast,
    removeToast,
    updateToast,
    dismissAll,
    success,
    error,
    warning,
    info,
  }), [toasts, addToast, removeToast, updateToast, dismissAll, success, error, warning, info]);

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <div
        className={cn(
          'fixed z-toast flex flex-col gap-2 w-full max-w-sm pointer-events-none',
          positionClasses[position]
        )}
      >
        <AnimatePresence mode="popLayout">
          {toasts.map((toast) => (
            <ToastItem
              key={toast.id}
              toast={toast}
              onDismiss={() => removeToast(toast.id)}
              variants={getAnimationVariants()}
            />
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

interface ToastItemProps {
  toast: Toast;
  onDismiss: () => void;
  variants: Variants;
}

function ToastItem({ toast, onDismiss, variants }: ToastItemProps) {
  const { type = 'default', duration = 5000 } = toast;

  // Auto-dismiss
  React.useEffect(() => {
    if (duration === Infinity) return;

    const timer = setTimeout(onDismiss, duration);
    return () => clearTimeout(timer);
  }, [duration, onDismiss]);

  // Type configurations
  const typeConfig = {
    success: {
      icon: CheckCircle2,
      iconClass: 'text-accent-lime',
      borderClass: 'border-l-accent-lime',
      bgClass: 'bg-accent-lime/5',
    },
    error: {
      icon: AlertCircle,
      iconClass: 'text-accent-coral',
      borderClass: 'border-l-accent-coral',
      bgClass: 'bg-accent-coral/5',
    },
    warning: {
      icon: AlertTriangle,
      iconClass: 'text-accent-amber',
      borderClass: 'border-l-accent-amber',
      bgClass: 'bg-accent-amber/5',
    },
    info: {
      icon: Info,
      iconClass: 'text-accent-cyan',
      borderClass: 'border-l-accent-cyan',
      bgClass: 'bg-accent-cyan/5',
    },
    default: {
      icon: Info,
      iconClass: 'text-forge-muted',
      borderClass: 'border-l-forge-border',
      bgClass: '',
    },
  };

  const config = typeConfig[type];
  const Icon = config.icon;

  return (
    <motion.div
      layout
      initial="initial"
      animate="animate"
      exit="exit"
      variants={variants}
      className={cn(
        'pointer-events-auto w-full',
        'bg-forge-surface/95 backdrop-blur-md',
        'border border-forge-border border-l-4 rounded-xl',
        'shadow-xl shadow-black/30',
        'overflow-hidden',
        config.borderClass,
        config.bgClass
      )}
    >
      <div className="flex items-start gap-3 p-4">
        {/* Icon */}
        <Icon className={cn('w-5 h-5 shrink-0 mt-0.5', config.iconClass)} />

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white leading-tight">
            {toast.title}
          </p>
          {toast.description && (
            <p className="mt-1 text-sm text-forge-muted leading-snug">
              {toast.description}
            </p>
          )}
          {toast.action && (
            <button
              onClick={() => {
                toast.action?.onClick();
                onDismiss();
              }}
              className={cn(
                'mt-2 text-sm font-medium transition-colors',
                type === 'error' ? 'text-accent-coral hover:text-accent-coral/80' :
                  type === 'success' ? 'text-accent-lime hover:text-accent-lime/80' :
                    type === 'warning' ? 'text-accent-amber hover:text-accent-amber/80' :
                      'text-accent-cyan hover:text-accent-cyan/80'
              )}
            >
              {toast.action.label}
            </button>
          )}
        </div>

        {/* Dismiss button */}
        <button
          onClick={onDismiss}
          className={cn(
            'shrink-0 p-1 rounded-lg',
            'text-forge-muted hover:text-white',
            'hover:bg-forge-hover',
            'transition-colors duration-150',
            'focus:outline-none focus:ring-2 focus:ring-accent-cyan/40'
          )}
        >
          <X className="w-4 h-4" />
          <span className="sr-only">Dismiss</span>
        </button>
      </div>

      {/* Progress bar for auto-dismiss */}
      {toast.duration !== Infinity && (
        <motion.div
          className={cn(
            'h-0.5',
            type === 'error' ? 'bg-accent-coral' :
              type === 'success' ? 'bg-accent-lime' :
                type === 'warning' ? 'bg-accent-amber' :
                  type === 'info' ? 'bg-accent-cyan' :
                    'bg-forge-border'
          )}
          initial={{ width: '100%' }}
          animate={{ width: '0%' }}
          transition={{
            duration: (toast.duration || 5000) / 1000,
            ease: 'linear'
          }}
        />
      )}
    </motion.div>
  );
}

export { type Toast, type ToastType, type ToastPosition };
