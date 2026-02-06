'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Wallet,
  Github,
  Check,
  ArrowRight,
  X,
  Loader2,
  Shield,
  AlertCircle,
  RefreshCw,
  CheckCircle2,
} from 'lucide-react';
import { useAccount } from 'wagmi';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { WalletConnectButton } from './wallet-connect-button';
import { useAuthStore, createAuthError } from '@/store/auth';

interface AuthFlowModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete?: () => void;
  requireGitHub?: boolean;
}

const AUTO_CLOSE_DELAY = 1500; // 1.5 seconds

export function AuthFlowModal({
  open,
  onOpenChange,
  onComplete,
  requireGitHub = true,
}: AuthFlowModalProps) {
  const { address, isConnected } = useAccount();
  const {
    isWalletConnected,
    isGitHubConnected,
    authModalStep,
    setAuthModalStep,
    setGitHubSession,
    session,
    executePendingAction,
    walletLoading,
    githubLoading,
    walletError,
    githubError,
    walletSuccess,
    githubSuccess,
    setGitHubLoading,
    setGitHubError,
    setGitHubSuccess,
    clearAllErrors,
    retryGitHubConnection,
  } = useAuthStore();

  const [savingUser, setSavingUser] = useState(false);
  const [showCompletionScreen, setShowCompletionScreen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const autoCloseTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Ensure client-side only rendering for portal
  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  // Derive the current step from actual connection states (wagmi for wallet, store for GitHub)
  const currentStep = useMemo(() => {
    if (showCompletionScreen) {
      return 'complete';
    }
    if (!isConnected) {
      return 'wallet';
    }
    if (requireGitHub && !isGitHubConnected) {
      return 'github';
    }
    return 'complete';
  }, [isConnected, isGitHubConnected, requireGitHub, showCompletionScreen]);

  // Clear timeouts on unmount
  useEffect(() => {
    return () => {
      if (autoCloseTimeoutRef.current) {
        clearTimeout(autoCloseTimeoutRef.current);
      }
    };
  }, []);

  // Check for GitHub session on mount and handle OAuth callback
  useEffect(() => {
    if (!isMounted) return;

    if (open) {
      checkGitHubSession();
      clearAllErrors();
    }

    // Check if returning from GitHub OAuth
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const githubParam = urlParams.get('github');
      const errorParam = urlParams.get('error');

      if (githubParam === 'connected') {
        checkGitHubSession();
        // Clean up URL
        window.history.replaceState({}, '', window.location.pathname);
      }

      if (errorParam) {
        // Handle OAuth errors from URL
        const errorMessage = urlParams.get('message') || 'Authentication failed';
        setGitHubError(createAuthError('github_auth_failed', errorMessage));
        window.history.replaceState({}, '', window.location.pathname);
      }
    }
  }, [open, isMounted, clearAllErrors, setGitHubError]);

  // Auto-advance steps and save wallet to database
  useEffect(() => {
    if (isConnected && address && currentStep === 'wallet') {
      saveUserToDatabase().then(() => {
        if (requireGitHub) {
          // Step will automatically advance via currentStep computation
        } else {
          handleComplete();
        }
      });
    }
  }, [isConnected, address, currentStep, requireGitHub]);

  // Handle auto-close when fully authenticated
  useEffect(() => {
    if (isConnected && isGitHubConnected && open) {
      setShowCompletionScreen(true);

      // Auto-close after delay
      autoCloseTimeoutRef.current = setTimeout(() => {
        handleComplete();
      }, AUTO_CLOSE_DELAY);

      return () => {
        if (autoCloseTimeoutRef.current) {
          clearTimeout(autoCloseTimeoutRef.current);
        }
      };
    }
  }, [isConnected, isGitHubConnected, open]);

  // Check GitHub session from cookie (same flow as header GitHubConnect)
  const checkGitHubSession = async () => {
    try {
      const response = await fetch('/api/auth/session');
      const data = await response.json();
      if (data.authenticated && data.github) {
        // Sync with auth store (same as GitHubConnect component)
        setGitHubSession({
          id: data.github.id,
          username: data.github.username,
          avatar: data.github.avatar,
        });
      }
    } catch (error) {
      console.error('Failed to check GitHub session:', error);
    }
  };

  const saveUserToDatabase = async (): Promise<void> => {
    if (!address) return;

    setSavingUser(true);
    try {
      const response = await fetch('/api/auth/user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress: address,
          githubId: session.github?.id || null,
          githubUsername: session.github?.username || null,
          githubAvatar: session.github?.avatar || null,
        }),
      });

      if (!response.ok) {
        console.error('Failed to save user to database');
        throw new Error('Failed to save user');
      }
    } catch (error) {
      console.error('Error saving user:', error);
      throw error;
    } finally {
      setSavingUser(false);
    }
  };

  const handleGitHubConnect = () => {
    setGitHubLoading(true);
    clearAllErrors();

    // Store current state to resume after redirect
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('auth_flow_pending', 'true');
      // Redirect to GitHub OAuth
      window.location.href = '/api/auth/github';
    }
  };

  const handleComplete = useCallback(() => {
    // Save to database and close modal
    saveUserToDatabase().finally(() => {
      onComplete?.();
      executePendingAction();
      onOpenChange(false);
      setShowCompletionScreen(false);
    });
  }, [onComplete, executePendingAction, onOpenChange, address, session.github]);

  const handleFinish = () => {
    handleComplete();
  };

  const handleRetryGitHub = () => {
    retryGitHubConnection();
    handleGitHubConnect();
  };

  const handleSkipGitHub = () => {
    // Skip GitHub and finish
    saveUserToDatabase().finally(() => {
      onComplete?.();
      executePendingAction();
      onOpenChange(false);
    });
  };

  const steps = [
    {
      id: 'wallet',
      title: 'Connect Wallet',
      description: 'Connect your wallet to access [N]skills features',
      icon: Wallet,
      completed: isConnected,
      loading: walletLoading,
      error: walletError,
      success: walletSuccess,
    },
    ...(requireGitHub
      ? [
        {
          id: 'github',
          title: 'Connect GitHub',
          description: 'Link your GitHub for code generation and repo creation',
          icon: Github,
          completed: isGitHubConnected,
          loading: githubLoading,
          error: githubError,
          success: githubSuccess,
        },
      ]
      : []),
  ];

  // Lower z-index when on wallet step to allow RainbowKit modal to appear above
  const isWalletStep = currentStep === 'wallet';

  // Don't render on server or if modal is closed
  if (!open || !isMounted) {
    return null;
  }

  const modal = (
    <>
      <div
        className={cn(
          'fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity',
          isWalletStep ? 'z-[40] opacity-20' : 'z-30'
        )}
        onClick={() => onOpenChange(false)}
      />
      <div
        className={cn(
          'fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg',
          isWalletStep ? 'z-[50]' : 'z-50'
        )}
        aria-modal="true"
        role="dialog"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className={cn(
            'relative rounded-2xl overflow-hidden',
            'bg-gradient-to-b from-forge-surface to-forge-bg',
            'border border-forge-border/50',
            'shadow-2xl shadow-black/40'
          )}
        >
          {/* Close button */}
          <button
            onClick={() => onOpenChange(false)}
            className="absolute right-4 top-4 p-2 rounded-lg text-forge-muted hover:text-white hover:bg-forge-elevated/50 transition-colors z-10"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Completion Screen */}
          {showCompletionScreen ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-8 text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
                className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-accent-lime/20 to-accent-lime/5 border border-accent-lime/30 flex items-center justify-center"
              >
                <CheckCircle2 className="w-10 h-10 text-accent-lime" />
              </motion.div>
              <h2 className="text-2xl font-semibold text-white mb-2">
                Authentication Complete!
              </h2>
              <p className="text-sm text-forge-muted mb-6">
                You now have full access to all platform features.
              </p>
              <div className="flex items-center justify-center gap-4">
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-forge-elevated/30 border border-forge-border/30">
                  <Wallet className="w-4 h-4 text-accent-cyan" />
                  <span className="text-sm text-white font-mono">
                    {address?.slice(0, 6)}...{address?.slice(-4)}
                  </span>
                </div>
                {session.github && (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-forge-elevated/30 border border-forge-border/30">
                    <img
                      src={session.github.avatar}
                      alt={session.github.username}
                      className="w-5 h-5 rounded-full"
                    />
                    <span className="text-sm text-white">{session.github.username}</span>
                  </div>
                )}
              </div>
              <p className="text-xs text-forge-muted mt-6">
                This window will close automatically...
              </p>
            </motion.div>
          ) : (
            <>
              {/* Header */}
              <div className="p-6 pb-4 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-accent-cyan/20 to-accent-cyan/5 border border-accent-cyan/30 flex items-center justify-center">
                  <Shield className="w-8 h-8 text-accent-cyan" />
                </div>
                <h2 className="text-xl font-semibold text-white mb-2">
                  Authentication Required
                </h2>
                <p className="text-sm text-forge-muted">
                  Complete the following steps to access all features
                </p>
              </div>

              {/* Progress Steps */}
              <div className="px-6 mb-6">
                <div className="flex items-center justify-center gap-2">
                  {steps.map((step, index) => (
                    <div key={step.id} className="flex items-center">
                      <div
                        className={cn(
                          'w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300',
                          step.completed
                            ? 'bg-accent-cyan text-black'
                            : step.error
                              ? 'bg-red-500/20 border-2 border-red-500 text-red-500'
                              : step.loading
                                ? 'bg-accent-cyan/20 border-2 border-accent-cyan text-accent-cyan animate-pulse'
                                : currentStep === step.id
                                  ? 'bg-accent-cyan/20 border-2 border-accent-cyan text-accent-cyan'
                                  : 'bg-forge-elevated text-forge-muted'
                        )}
                      >
                        {step.completed ? (
                          <Check className="w-4 h-4" />
                        ) : step.loading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : step.error ? (
                          <AlertCircle className="w-4 h-4" />
                        ) : (
                          <step.icon className="w-4 h-4" />
                        )}
                      </div>
                      {index < steps.length - 1 && (
                        <div
                          className={cn(
                            'w-12 h-0.5 mx-2 transition-colors duration-300',
                            step.completed ? 'bg-accent-cyan' : 'bg-forge-border'
                          )}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Content */}
              <div className="px-6 pb-6">
                <AnimatePresence mode="wait">
                  {currentStep === 'wallet' && (
                    <motion.div
                      key="wallet"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-4"
                    >
                      <div className="p-4 rounded-xl bg-forge-elevated/30 border border-forge-border/30">
                        <h3 className="text-lg font-medium text-white mb-2">
                          Connect Your Wallet
                        </h3>
                        <p className="text-sm text-forge-muted mb-4">
                          Connect your Ethereum wallet to authenticate and access [N]skills&apos; features.
                        </p>

                        {/* Wallet Error */}
                        {walletError && (
                          <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 flex items-start gap-3"
                          >
                            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                            <div className="flex-1">
                              <p className="text-sm text-red-400">{walletError.message}</p>
                              {walletError.retryable && (
                                <p className="text-xs text-red-400/70 mt-1">
                                  Please try again.
                                </p>
                              )}
                            </div>
                          </motion.div>
                        )}

                        <WalletConnectButton variant="full" className="w-full" />
                      </div>
                    </motion.div>
                  )}

                  {currentStep === 'github' && (
                    <motion.div
                      key="github"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-4"
                    >
                      {/* Wallet Connected Badge */}
                      <div className="p-4 rounded-xl bg-forge-elevated/30 border border-forge-border/30">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-10 h-10 rounded-full bg-accent-cyan/10 flex items-center justify-center">
                            <Check className="w-5 h-5 text-accent-cyan" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-white">Wallet Connected</p>
                            <p className="text-xs text-forge-muted font-mono">
                              {address?.slice(0, 6)}...{address?.slice(-4)}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* GitHub Section */}
                      <div className="p-4 rounded-xl bg-forge-elevated/30 border border-forge-border/30">
                        <h3 className="text-lg font-medium text-white mb-2">
                          Connect GitHub
                        </h3>
                        <p className="text-sm text-forge-muted mb-4">
                          Link your GitHub account to enable code generation and repository creation.
                        </p>

                        {/* GitHub Error */}
                        {githubError && (
                          <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 flex items-start gap-3"
                          >
                            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                            <div className="flex-1">
                              <p className="text-sm text-red-400">{githubError.message}</p>
                            </div>
                          </motion.div>
                        )}

                        {/* GitHub Success */}
                        {githubSuccess && isGitHubConnected && session.github && (
                          <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mb-4 p-3 rounded-lg bg-accent-lime/10 border border-accent-lime/30 flex items-center gap-3"
                          >
                            <CheckCircle2 className="w-5 h-5 text-accent-lime" />
                            <p className="text-sm text-accent-lime">GitHub connected successfully!</p>
                          </motion.div>
                        )}

                        {isGitHubConnected && session.github ? (
                          <div className="flex items-center gap-3 p-3 rounded-lg bg-accent-cyan/10 border border-accent-cyan/30">
                            <img
                              src={session.github.avatar}
                              alt={session.github.username}
                              className="w-8 h-8 rounded-full"
                            />
                            <div>
                              <p className="text-sm font-medium text-white">
                                {session.github.username}
                              </p>
                              <p className="text-xs text-forge-muted">Connected</p>
                            </div>
                            <Check className="w-5 h-5 text-accent-cyan ml-auto" />
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {githubError?.retryable ? (
                              <Button
                                onClick={handleRetryGitHub}
                                disabled={githubLoading}
                                className="w-full gap-2 bg-[#24292e] hover:bg-[#2f363d] text-white"
                              >
                                {githubLoading ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <RefreshCw className="w-4 h-4" />
                                )}
                                Retry GitHub Connection
                              </Button>
                            ) : (
                              <Button
                                onClick={handleGitHubConnect}
                                disabled={githubLoading}
                                className="w-full gap-2 bg-[#24292e] hover:bg-[#2f363d] text-white"
                              >
                                {githubLoading ? (
                                  <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Connecting...
                                  </>
                                ) : (
                                  <>
                                    <Github className="w-4 h-4" />
                                    Connect GitHub
                                    <ArrowRight className="w-4 h-4 ml-auto" />
                                  </>
                                )}
                              </Button>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Finish button when GitHub is connected */}
                      {isGitHubConnected && session.github && (
                        <Button
                          onClick={handleFinish}
                          disabled={savingUser}
                          className="w-full gap-2 bg-accent-cyan hover:bg-accent-cyan/90 text-black font-medium"
                        >
                          {savingUser ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Check className="w-4 h-4" />
                          )}
                          Finish
                        </Button>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Footer */}
              <div className="px-6 py-4 bg-forge-bg/50 border-t border-forge-border/30">
                <p className="text-xs text-center text-forge-muted">
                  By connecting, you agree to our Terms of Service and Privacy Policy
                </p>
              </div>
            </>
          )}
        </motion.div>
      </div>
    </>
  );

  return createPortal(modal, document.body);
}

// Convenience hook for using auth flow
export function useAuthFlow() {
  const {
    showAuthModal,
    openAuthModal,
    closeAuthModal,
    isWalletConnected,
    isFullyAuthenticated,
    walletLoading,
    githubLoading,
    walletError,
    githubError,
    getConnectionState,
  } = useAuthStore();

  // requireAuth now delegates fully to openAuthModal which checks:
  // 1. Wallet connection (wagmi)
  // 2. Database records
  // 3. Active GitHub session (cookie)
  const requireAuth = (action: () => void): boolean => {
    // openAuthModal will check all conditions and either:
    // - Execute the action immediately if fully authenticated
    // - Show the modal if any auth is missing
    openAuthModal(action);
    // Return false since we can't know synchronously if auth succeeded
    // The action will be executed via pendingAction if auth completes
    return false;
  };

  return {
    showAuthModal,
    openAuthModal,
    closeAuthModal,
    requireAuth,
    isWalletConnected,
    isFullyAuthenticated,
    walletLoading,
    githubLoading,
    walletError,
    githubError,
    connectionState: getConnectionState(),
  };
}
