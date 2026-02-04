'use client';

import { ReactNode, useEffect, useState } from 'react';
import { useAccount } from 'wagmi';
import { useAuthStore } from '@/store/auth';
import { cn } from '@/lib/utils';
import { Lock } from 'lucide-react';

interface AuthGuardProps {
  children: ReactNode;
  fallback?: ReactNode;
  requireGitHub?: boolean;
  onClick?: () => void;
  className?: string;
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
}: AuthGuardProps) {
  const { address, isConnected } = useAccount();
  const { isWalletConnected, isFullyAuthenticated, openAuthModal, checkFullAuthStatus } = useAuthStore();
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

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // If checking auth status, wait
    if (isChecking) {
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
  };

  return (
    <div onClick={handleClick} className={cn('cursor-pointer', className)}>
      {children}
    </div>
  );
}

/**
 * AuthOverlay shows a lock overlay on elements when not authenticated
 */
interface AuthOverlayProps {
  children: ReactNode;
  message?: string;
  className?: string;
}

export function AuthOverlay({
  children,
  message = 'Connect wallet to access',
  className,
}: AuthOverlayProps) {
  const { isWalletConnected, openAuthModal } = useAuthStore();

  if (isWalletConnected) {
    return <>{children}</>;
  }

  return (
    <div className={cn('relative', className)}>
      {/* Content with reduced opacity */}
      <div className="opacity-50 pointer-events-none select-none">
        {children}
      </div>

      {/* Lock overlay */}
      <div
        onClick={() => openAuthModal()}
        className="absolute inset-0 flex flex-col items-center justify-center bg-forge-bg/60 backdrop-blur-sm cursor-pointer group"
      >
        <div className="p-3 rounded-full bg-forge-elevated/50 border border-forge-border/50 mb-3 group-hover:border-accent-cyan/50 transition-colors">
          <Lock className="w-6 h-6 text-forge-muted group-hover:text-accent-cyan transition-colors" />
        </div>
        <p className="text-sm text-forge-muted group-hover:text-white transition-colors">
          {message}
        </p>
      </div>
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
  } = useAuthStore();
  const [fullAuthStatus, setFullAuthStatus] = useState<FullAuthStatus | null>(null);

  // Check full auth status when wallet is connected
  useEffect(() => {
    if (isConnected && address) {
      checkFullAuthStatus(address).then(setFullAuthStatus);
    } else {
      setFullAuthStatus(null);
    }
  }, [isConnected, address, checkFullAuthStatus]);

  const checkAuth = async (action?: () => void): Promise<boolean> => {
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
  };

  const checkFullAuth = async (action?: () => void): Promise<boolean> => {
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
  };

  return {
    isWalletConnected,
    isGitHubConnected,
    isFullyAuthenticated,
    checkAuth,
    checkFullAuth,
    fullAuthStatus,
  };
}
