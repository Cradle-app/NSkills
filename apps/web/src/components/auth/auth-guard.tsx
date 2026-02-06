'use client';

import { ReactNode, useEffect, useState, useCallback } from 'react';
import { useAccount } from 'wagmi';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore, ConnectionState } from '@/store/auth';
import { cn } from '@/lib/utils';
import { Lock, Wallet, Github, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AuthGuardProps {
  children: ReactNode;
  fallback?: ReactNode;
  requireGitHub?: boolean;
  onClick?: () => void;
  className?: string;
  showStatusIndicator?: boolean;
}

interface FullAuthStatus {
  hasWallet: boolean;
  hasGitHub: boolean;
  hasActiveSession: boolean;
}

/**
 * AuthGuard component wraps interactive elements and requires authentication
 * before allowing the action to proceed.
 * 
 * Usage:
 * <AuthGuard onClick={handleAddNode}>
 *   <Button>Add Node</Button>
 * </AuthGuard>
 */
export function AuthGuard({
  children,
  fallback,
  requireGitHub = false,
  onClick,
  className,
  showStatusIndicator = false,
}: AuthGuardProps) {
  const { address, isConnected } = useAccount();
  const {
    isWalletConnected,
    isFullyAuthenticated,
    isGitHubConnected,
    openAuthModal,
    checkFullAuthStatus,
    walletLoading,
    githubLoading,
    getConnectionState,
  } = useAuthStore();
  const [isChecking, setIsChecking] = useState(false);
  const [fullAuthStatus, setFullAuthStatus] = useState<FullAuthStatus | null>(null);

  // Check full auth status when wallet is connected
  useEffect(() => {
    if (isConnected && address) {
      setIsChecking(true);
      checkFullAuthStatus(address).then((result) => {
        setFullAuthStatus(result);
        setIsChecking(false);
      });
    } else {
      setFullAuthStatus(null);
    }
  }, [isConnected, address, checkFullAuthStatus]);

  const handleClick = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // If checking auth status, wait
    if (isChecking || walletLoading || githubLoading) {
      return;
    }

    // Check full auth status if wallet is connected
    let shouldShowModal = false;
    if (isConnected && address && fullAuthStatus) {
      if (requireGitHub) {
        // For GitHub requirement: need both GitHub in DB AND active session
        shouldShowModal = !fullAuthStatus.hasGitHub || !fullAuthStatus.hasActiveSession;
      } else {
        // For wallet-only requirement: just need wallet
        shouldShowModal = !fullAuthStatus.hasWallet;
      }
    } else {
      // Fallback to local state if check hasn't completed
      const hasRequiredAuth = requireGitHub ? isFullyAuthenticated : isWalletConnected;
      shouldShowModal = !hasRequiredAuth;
    }

    if (shouldShowModal) {
      // Open the global auth flow modal and pass the intended action
      openAuthModal(onClick);
      return;
    }

    onClick?.();
  }, [
    isChecking,
    walletLoading,
    githubLoading,
    isConnected,
    address,
    fullAuthStatus,
    requireGitHub,
    isFullyAuthenticated,
    isWalletConnected,
    openAuthModal,
    onClick,
  ]);

  const connectionState = getConnectionState();
  const isLoading = isChecking || walletLoading || githubLoading;

  return (
    <div
      onClick={handleClick}
      className={cn(
        'cursor-pointer relative',
        isLoading && 'opacity-70 pointer-events-none',
        className
      )}
    >
      {children}

      {/* Status indicator */}
      {showStatusIndicator && (
        <AnimatePresence>
          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center bg-black/20 rounded"
            >
              <Loader2 className="w-4 h-4 animate-spin text-accent-cyan" />
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
  );
}

/**
 * AuthOverlay shows a lock overlay on elements when not authenticated
 * Enhanced with connection state awareness
 */
interface AuthOverlayProps {
  children: ReactNode;
  message?: string;
  className?: string;
  requireGitHub?: boolean;
}

export function AuthOverlay({
  children,
  message,
  className,
  requireGitHub = false,
}: AuthOverlayProps) {
  const { address, isConnected } = useAccount();
  const {
    isWalletConnected,
    isGitHubConnected,
    isFullyAuthenticated,
    openAuthModal,
    getConnectionState,
    walletLoading,
    githubLoading,
  } = useAuthStore();

  const connectionState = getConnectionState();

  // Determine if we should show the overlay
  const shouldShowOverlay = requireGitHub
    ? !isFullyAuthenticated
    : !isWalletConnected && !isConnected;

  if (!shouldShowOverlay) {
    return <>{children}</>;
  }

  // Get appropriate message based on connection state
  const getOverlayContent = () => {
    switch (connectionState) {
      case 'none_connected':
        return {
          icon: Lock,
          title: message || 'Authentication Required',
          description: 'Connect your wallet and GitHub to access this feature.',
          buttonText: 'Connect',
        };
      case 'wallet_only':
        return {
          icon: Github,
          title: 'GitHub Connection Required',
          description: 'Connect your GitHub account to access this feature.',
          buttonText: 'Connect GitHub',
        };
      case 'github_only':
        return {
          icon: Wallet,
          title: 'Wallet Connection Required',
          description: 'Connect your wallet to access this feature.',
          buttonText: 'Connect Wallet',
        };
      default:
        return {
          icon: Lock,
          title: message || 'Connect to access',
          description: 'Authentication required.',
          buttonText: 'Connect',
        };
    }
  };

  const content = getOverlayContent();
  const Icon = content.icon;
  const isLoading = walletLoading || githubLoading;

  return (
    <div className={cn('relative', className)}>
      {/* Content with reduced opacity */}
      <div className="opacity-50 pointer-events-none select-none blur-[1px]">
        {children}
      </div>

      {/* Lock overlay */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        onClick={() => openAuthModal()}
        className="absolute inset-0 flex flex-col items-center justify-center bg-forge-bg/70 backdrop-blur-sm cursor-pointer group rounded-xl"
      >
        <div className="text-center max-w-xs px-4">
          <div className="p-3 rounded-full bg-forge-elevated/50 border border-forge-border/50 mb-3 mx-auto w-fit group-hover:border-accent-cyan/50 transition-colors">
            {isLoading ? (
              <Loader2 className="w-6 h-6 text-accent-cyan animate-spin" />
            ) : (
              <Icon className="w-6 h-6 text-forge-muted group-hover:text-accent-cyan transition-colors" />
            )}
          </div>
          <p className="text-sm font-medium text-white mb-1">
            {content.title}
          </p>
          <p className="text-xs text-forge-muted mb-3">
            {content.description}
          </p>
          <Button
            size="sm"
            variant="outline"
            disabled={isLoading}
            className="border-forge-border hover:border-accent-cyan hover:text-accent-cyan"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                Connecting...
              </>
            ) : (
              content.buttonText
            )}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}

/**
 * AuthStatusBadge shows the current authentication status
 */
interface AuthStatusBadgeProps {
  className?: string;
  compact?: boolean;
}

export function AuthStatusBadge({ className, compact = false }: AuthStatusBadgeProps) {
  const { address, isConnected } = useAccount();
  const {
    isGitHubConnected,
    session,
    getConnectionState,
  } = useAuthStore();

  // Ensure we only render status based on client-side state
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    // Render a minimal, stable placeholder during SSR/first client render
    if (compact) {
      return (
        <div className={cn('flex items-center gap-1.5', className)}>
          <div className={cn('w-2 h-2 rounded-full', 'bg-forge-muted')} />
        </div>
      );
    }

    return (
      <div className={cn('flex items-center gap-2 px-2 py-1 rounded-lg bg-forge-surface border border-forge-border', className)}>
        <div className={cn('w-2 h-2 rounded-full', 'bg-forge-muted')} />
        <span className="text-xs text-forge-muted">Checking status…</span>
      </div>
    );
  }

  const connectionState = getConnectionState();

  const getStatusInfo = () => {
    switch (connectionState) {
      case 'both_connected':
        return {
          color: 'bg-accent-lime',
          text: 'Fully Connected',
          icon: null,
        };
      case 'wallet_only':
        return {
          color: 'bg-yellow-500',
          text: 'GitHub Required',
          icon: Github,
        };
      case 'github_only':
        return {
          color: 'bg-yellow-500',
          text: 'Wallet Required',
          icon: Wallet,
        };
      default:
        return {
          color: 'bg-red-500',
          text: 'Not Connected',
          icon: AlertCircle,
        };
    }
  };

  const status = getStatusInfo();

  if (compact) {
    return (
      <div className={cn('flex items-center gap-1.5', className)}>
        <div className={cn('w-2 h-2 rounded-full', status.color)} />
        {status.icon && <status.icon className="w-3 h-3 text-forge-muted" />}
      </div>
    );
  }

  return (
    <div className={cn('flex items-center gap-2 px-2 py-1 rounded-lg bg-forge-surface border border-forge-border', className)}>
      <div className={cn('w-2 h-2 rounded-full', status.color)} />
      <span className="text-xs text-forge-muted">{status.text}</span>
      {status.icon && <status.icon className="w-3 h-3 text-forge-muted" />}
    </div>
  );
}

/**
 * Hook to check auth status and show modal if needed
 */
export function useAuthGuard() {
  const { address, isConnected } = useAccount();
  const {
    isWalletConnected,
    isGitHubConnected,
    isFullyAuthenticated,
    openAuthModal,
    checkFullAuthStatus,
    walletLoading,
    githubLoading,
    walletError,
    githubError,
    getConnectionState,
  } = useAuthStore();
  const [fullAuthStatus, setFullAuthStatus] = useState<FullAuthStatus | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  // Check full auth status when wallet is connected
  useEffect(() => {
    if (isConnected && address) {
      setIsChecking(true);
      checkFullAuthStatus(address).then((result) => {
        setFullAuthStatus(result);
        setIsChecking(false);
      });
    } else {
      setFullAuthStatus(null);
    }
  }, [isConnected, address, checkFullAuthStatus]);

  const checkAuth = useCallback(async (action?: () => void): Promise<boolean> => {
    if (isConnected && address && fullAuthStatus) {
      if (!fullAuthStatus.hasWallet) {
        openAuthModal(action);
        return false;
      }
    } else if (!isWalletConnected) {
      openAuthModal(action);
      return false;
    }
    action?.();
    return true;
  }, [isConnected, address, fullAuthStatus, isWalletConnected, openAuthModal]);

  const checkFullAuth = useCallback(async (action?: () => void): Promise<boolean> => {
    if (isConnected && address && fullAuthStatus) {
      // Require both GitHub in DB AND active session
      if (!fullAuthStatus.hasGitHub || !fullAuthStatus.hasActiveSession) {
        openAuthModal(action);
        return false;
      }
    } else if (!isFullyAuthenticated) {
      openAuthModal(action);
      return false;
    }
    action?.();
    return true;
  }, [isConnected, address, fullAuthStatus, isFullyAuthenticated,  openAuthModal]);

  const connectionState = getConnectionState();

  return {
    // Connection states
    isWalletConnected: isConnected || isWalletConnected,
    isGitHubConnected,
    isFullyAuthenticated,
    connectionState,
    fullAuthStatus,

    // Loading states
    isChecking,
    walletLoading,
    githubLoading,
    isLoading: isChecking || walletLoading || githubLoading,

    // Error states
    walletError,
    githubError,
    hasError: !!walletError || !!githubError,

    // Actions
    checkAuth,
    checkFullAuth,
    openAuthModal,
  };
}

/**
 * Higher-order component to protect routes/components
 */
export function withAuthGuard<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  options?: {
    requireGitHub?: boolean;
    fallback?: ReactNode;
  }
) {
  return function AuthGuardedComponent(props: P) {
    const {
      isWalletConnected,
      isFullyAuthenticated,
      isLoading,
      connectionState,
    } = useAuthGuard();

    const isAuthenticated = options?.requireGitHub
      ? isFullyAuthenticated
      : isWalletConnected;

    if (isLoading) {
      return (
        <div className="flex items-center justify-center p-8">
          <Loader2 className="w-6 h-6 animate-spin text-accent-cyan" />
        </div>
      );
    }

    if (!isAuthenticated) {
      if (options?.fallback) {
        return <>{options.fallback}</>;
      }

      return (
        <AuthOverlay requireGitHub={options?.requireGitHub}>
          <WrappedComponent {...props} />
        </AuthOverlay>
      );
    }

    return <WrappedComponent {...props} />;
  };
}
