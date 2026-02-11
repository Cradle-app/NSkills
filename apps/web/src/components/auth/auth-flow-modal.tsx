'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
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
          'fixed inset-0 bg-black/80 backdrop-blur-md z-[1550]'
        )}
        onClick={() => onOpenChange(false)}
      />
      <div
        className={cn(
          'fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg z-[1600]'
        )}
        aria-modal="true"
        role="dialog"
      >
        {/* Glow Effect */}
        <div className="absolute -inset-1 bg-gradient-to-r from-accent-cyan/20 to-accent-purple/20 rounded-[2.2rem] blur-2xl opacity-50" />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className={cn(
            'relative rounded-[2rem] overflow-hidden',
            'bg-gradient-to-b from-forge-surface to-forge-bg',
            'border border-forge-border/40',
            'shadow-[0_20px_50px_rgba(0,0,0,0.5)]'
          )}
        >
          {/* Decorative Top Bar */}
          {/* <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-accent-cyan/40 via-accent-purple/40 to-accent-cyan/40" /> */}

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
              className="p-10 text-center"
            >
              <div className="relative inline-block mb-8">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
                  className="w-24 h-24 rounded-3xl bg-gradient-to-br from-accent-lime/20 to-accent-lime/5 border border-accent-lime/30 flex items-center justify-center relative z-10"
                >
                  <CheckCircle2 className="w-12 h-12 text-accent-lime" />
                </motion.div>
                {/* Status Glow */}
                <div className="absolute inset-0 bg-accent-lime/20 blur-2xl rounded-full" />
              </div>

              <h2 className="text-3xl font-bold text-white mb-3">
                All Set!
              </h2>
              <p className="text-forge-muted mb-8 max-w-xs mx-auto">
                Your account is now fully verified and ready for deep building.
              </p>

              <div className="flex flex-col gap-3 max-w-sm mx-auto">
                <div className="flex items-center justify-between p-4 rounded-2xl bg-forge-elevated/20 border border-forge-border/40 backdrop-blur-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-accent-cyan/10 flex items-center justify-center">
                      <Wallet className="w-4 h-4 text-accent-cyan" />
                    </div>
                    <span className="text-sm font-medium text-white">Wallet</span>
                  </div>
                  <span className="text-sm text-forge-muted font-mono bg-black/20 px-2 py-1 rounded-md">
                    {address?.slice(0, 6)}...{address?.slice(-4)}
                  </span>
                </div>

                {session.github && (
                  <div className="flex items-center justify-between p-4 rounded-2xl bg-forge-elevated/20 border border-forge-border/40 backdrop-blur-sm">
                    <div className="flex items-center gap-3">
                      <img
                        src={session.github.avatar}
                        alt={session.github.username}
                        className="w-8 h-8 rounded-lg shadow-lg"
                      />
                      <span className="text-sm font-medium text-white">GitHub</span>
                    </div>
                    <span className="text-sm text-forge-muted bg-black/20 px-2 py-1 rounded-md">
                      @{session.github.username}
                    </span>
                  </div>
                )}
              </div>

              <div className="mt-10 flex items-center justify-center gap-2 text-xs text-forge-muted">
                <Loader2 className="w-3 h-3 animate-spin" />
                <span>Redirecting back to your workflow...</span>
              </div>
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
              <div className="px-10 mb-8">
                <div className="flex items-center justify-center gap-3">
                  {steps.map((step, index) => (
                    <React.Fragment key={step.id}>
                      <div className="flex flex-col items-center gap-2">
                        <div
                          className={cn(
                            'w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300',
                            step.completed
                              ? 'bg-accent-cyan text-black shadow-[0_0_15px_rgba(var(--color-accent-primary),0.3)]'
                              : step.error
                                ? 'bg-red-500/20 border border-red-500/50 text-red-500'
                                : step.loading
                                  ? 'bg-accent-cyan/10 border-2 border-accent-cyan text-accent-cyan shadow-[0_0_15px_rgba(var(--color-accent-primary),0.2)] animate-pulse'
                                  : currentStep === step.id
                                    ? 'bg-accent-cyan/10 border border-accent-cyan/50 text-accent-cyan shadow-[0_0_10px_rgba(var(--color-accent-primary),0.1)]'
                                    : 'bg-forge-elevated/50 text-forge-muted border border-forge-border/30'
                          )}
                        >
                          {step.completed ? (
                            <Check className="w-5 h-5 stroke-[2.5px]" />
                          ) : step.loading ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                          ) : step.error ? (
                            <AlertCircle className="w-5 h-5" />
                          ) : (
                            <step.icon className="w-5 h-5" />
                          )}
                        </div>
                        <span className={cn(
                          "text-[10px] uppercase tracking-widest font-bold transition-colors",
                          currentStep === step.id ? "text-accent-cyan" : "text-forge-muted"
                        )}>
                          {step.id}
                        </span>
                      </div>
                      {index < steps.length - 1 && (
                        <div
                          className={cn(
                            'w-16 h-[2px] mb-6 transition-colors duration-300 rounded-full',
                            step.completed ? 'bg-accent-cyan shadow-[0_0_8px_rgba(var(--color-accent-primary),0.3)]' : 'bg-forge-border/30'
                          )}
                        />
                      )}
                    </React.Fragment>
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
                      <div className="p-5 rounded-2xl bg-forge-elevated/20 border border-forge-border/40 backdrop-blur-sm shadow-inner group transition-all hover:bg-forge-elevated/30">
                        <div className="flex items-center gap-4 mb-4">
                          <div className="w-12 h-12 rounded-xl bg-accent-cyan/10 border border-accent-cyan/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <Wallet className="w-6 h-6 text-accent-cyan" />
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-white">
                              Connect Your Wallet
                            </h3>
                            <p className="text-sm text-forge-muted">
                              Secure authentication via Ethereum
                            </p>
                          </div>
                        </div>
                        <p className="text-sm text-forge-muted leading-relaxed mb-6">
                          Connect your preferred wallet to authenticate your identity and access [N]skills features.
                        </p>

                        {/* Wallet Error */}
                        {walletError && (
                          <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-3"
                          >
                            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                            <div className="flex-1">
                              <p className="text-sm text-red-400">{walletError.message}</p>
                            </div>
                          </motion.div>
                        )}

                        <WalletConnectButton variant="full" className="w-full h-12 rounded-xl text-md font-bold shadow-lg shadow-black/20" />
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
                      <div className="p-4 rounded-2xl bg-accent-cyan/5 border border-accent-cyan/20 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-accent-cyan/10 flex items-center justify-center shadow-inner">
                            <Wallet className="w-5 h-5 text-accent-cyan" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-white">Wallet Connected</p>
                            <p className="text-xs text-forge-muted font-mono leading-none mt-0.5">
                              {address?.slice(0, 6)}...{address?.slice(-4)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-accent-cyan/20 border border-accent-cyan/30">
                          <Check className="w-3 h-3 text-accent-cyan" />
                          <span className="text-[10px] uppercase font-bold text-accent-cyan">Active</span>
                        </div>
                      </div>

                      {/* GitHub Section */}
                      <div className="p-5 rounded-3xl bg-forge-elevated/20 border border-forge-border/40 backdrop-blur-sm shadow-inner overflow-hidden relative">
                        <div className="absolute top-0 right-0 p-8 -mr-4 -mt-4 bg-accent-purple/5 blur-3xl rounded-full" />

                        <div className="relative z-10">
                          <div className="flex items-center gap-4 mb-4">
                            <div className="w-12 h-12 rounded-xl bg-[#24292e] border border-white/10 flex items-center justify-center shadow-lg">
                              <Github className="w-6 h-6 text-white" />
                            </div>
                            <div>
                              <h3 className="text-lg font-semibold text-white">
                                Connect GitHub
                              </h3>
                              <p className="text-sm text-forge-muted">
                                Required for repository management
                              </p>
                            </div>
                          </div>

                          <p className="text-sm text-forge-muted leading-relaxed mb-6">
                            Linking your GitHub account allows [N]skills to push code and create repositories on your behalf.
                          </p>

                          {/* GitHub Error */}
                          {githubError && (
                            <motion.div
                              initial={{ opacity: 0, y: -10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-3"
                            >
                              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                              <div className="flex-1">
                                <p className="text-sm text-red-400">{githubError.message}</p>
                              </div>
                            </motion.div>
                          )}

                          {isGitHubConnected && session.github ? (
                            <div className="flex items-center gap-4 p-4 rounded-2xl bg-accent-lime/10 border border-accent-lime/20 shadow-inner">
                              <img
                                src={session.github.avatar}
                                alt={session.github.username}
                                className="w-10 h-10 rounded-xl border border-white/10 shadow-lg"
                              />
                              <div className="flex-1">
                                <p className="text-sm font-bold text-white">
                                  @{session.github.username}
                                </p>
                                <p className="text-xs text-accent-lime font-medium">Account Linked</p>
                              </div>
                              <div className="w-8 h-8 rounded-full bg-accent-lime/20 flex items-center justify-center">
                                <Check className="w-4 h-4 text-accent-lime stroke-[3px]" />
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-3">
                              <Button
                                onClick={githubError?.retryable ? handleRetryGitHub : handleGitHubConnect}
                                disabled={githubLoading}
                                className={cn(
                                  "w-full h-12 rounded-2xl gap-3 text-md font-bold transition-all shadow-xl",
                                  githubError?.retryable ? "bg-accent-purple hover:bg-accent-purple/90" : "bg-[#24292e] hover:bg-[#333940] text-white shadow-black/40"
                                )}
                              >
                                {githubLoading ? (
                                  <Loader2 className="w-5 h-5 animate-spin" />
                                ) : githubError?.retryable ? (
                                  <RefreshCw className="w-5 h-5" />
                                ) : (
                                  <Github className="w-5 h-5" />
                                )}
                                {githubLoading ? "Connecting..." : githubError?.retryable ? "Retry Connection" : "Connect GitHub"}
                                {!githubLoading && <ArrowRight className="w-4 h-4 ml-auto opacity-50" />}
                              </Button>
                            </div>
                          )}
                        </div>
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
