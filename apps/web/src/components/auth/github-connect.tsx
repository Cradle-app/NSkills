'use client';

import { useState, useEffect } from 'react';
import { Github, LogOut, Loader2, AlertCircle, RefreshCw, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useAuthStore, createAuthError } from '@/store/auth';
import Image from 'next/image';

export function GitHubConnect() {
  const [loading, setLoading] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);

  // Use Zustand store as single source of truth
  const {
    session,
    isGitHubConnected,
    setGitHubSession,
    disconnectGitHub,
    isSyncing,
    githubError,
    githubSuccess,
    githubLoading,
    setGitHubLoading,
    setGitHubError,
    setGitHubSuccess,
    retryGitHubConnection,
    startSessionMonitoring,
  } = useAuthStore();

  // Check session on mount and sync with store
  useEffect(() => {
    const checkAndSyncSession = async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/auth/session');
        const data = await response.json();
        console.log('data', data);

        // Sync session data with auth store
        if (data.authenticated && data.github) {
          setGitHubSession({
            id: data.github.id,
            username: data.github.username,
            avatar: data.github.avatar,
          });
          // Start session monitoring
          startSessionMonitoring();
        }
      } catch (error) {
        console.error('Failed to fetch session:', error);
      } finally {
        setLoading(false);
      }
    };

    // Only check if not already connected in store
    if (!isGitHubConnected) {
      checkAndSyncSession();
    } else {
      setLoading(false);
      // Start session monitoring for already connected users
      startSessionMonitoring();
    }
  }, [isGitHubConnected, setGitHubSession, startSessionMonitoring]);

  // Handle OAuth callback from URL
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const urlParams = new URLSearchParams(window.location.search);
    const githubParam = urlParams.get('github');
    const errorParam = urlParams.get('error');
    const errorMessage = urlParams.get('message');

    if (githubParam === 'connected') {
      // Successfully connected - refresh session
      checkSession();
      window.history.replaceState({}, '', window.location.pathname);
    }

    if (errorParam) {
      setGitHubError(createAuthError('github_auth_failed', errorMessage || 'GitHub authentication failed'));
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [setGitHubError]);

  const checkSession = async () => {
    try {
      const response = await fetch('/api/auth/session');
      const data = await response.json();

      if (data.authenticated && data.github) {
        setGitHubSession({
          id: data.github.id,
          username: data.github.username,
          avatar: data.github.avatar,
        });
        setGitHubSuccess(true);
      }
    } catch (error) {
      console.error('Failed to check session:', error);
    }
  };

  const handleConnect = () => {
    setGitHubLoading(true);
    setGitHubError(null);
    // Redirect to GitHub OAuth
    window.location.href = '/api/auth/github';
  };

  const handleRetry = () => {
    retryGitHubConnection();
    handleConnect();
  };

  const handleDisconnect = async () => {
    setDisconnecting(true);
    try {
      // Use the store's disconnectGitHub which only clears session, not database
      await disconnectGitHub();
    } catch (error) {
      console.error('Failed to disconnect:', error);
    } finally {
      setDisconnecting(false);
    }
  };

  if (loading || isSyncing) {
    return (
      <Button variant="outline" size="sm" disabled className="gap-2">
        <Loader2 className="w-4 h-4 animate-spin" />
        Loading...
      </Button>
    );
  }

  // Use store state to determine connected status
  if (isGitHubConnected && session.github) {
    return (
      <div className="flex items-center gap-2">
        {/* Success indicator */}
        {/* <AnimatePresence>
          {githubSuccess && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, x: 10 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.8, x: 10 }}
              className="flex items-center gap-1 text-accent-lime text-xs"
            >
              <CheckCircle2 className="w-3 h-3" />
              Connected!
            </motion.div>
          )}
        </AnimatePresence> */}

        <div className="flex items-center gap-2 px-3 py-1.5 bg-forge-surface rounded-lg border border-forge-border">
          <Image
            width={100}
            height={100}
            src={session.github.avatar}
            alt={session.github.username}
            className="w-5 h-5 rounded-full"
          />
          <span className="text-sm text-forge-text">{session.github.username}</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDisconnect}
          disabled={disconnecting}
          className="text-forge-muted hover:text-red-400"
        >
          {disconnecting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <LogOut className="w-4 h-4" />
          )}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Error display */}
      <AnimatePresence>
        {githubError && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/30"
          >
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
            {/* <span className="text-xs text-red-400 flex-1">{githubError.message}</span> */}
            {githubError.retryable && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRetry}
                disabled={githubLoading}
                className="h-6 px-2 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10"
              >
                <RefreshCw className="w-3 h-3 mr-1" />
                Retry
              </Button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Connect button */}
      {githubError?.retryable ? (
        <Button
          variant="outline"
          size="sm"
          onClick={handleRetry}
          disabled={githubLoading}
          className="gap-2 border-red-500/50 hover:border-red-400 text-red-400 hover:text-red-300"
        >
          {githubLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Connecting...
            </>
          ) : (
            <>
              <RefreshCw className="w-4 h-4" />
              Retry Connection
            </>
          )}
        </Button>
      ) : (
        <Button
          variant="outline"
          size="sm"
          onClick={handleConnect}
          disabled={githubLoading}
          className="gap-2 border-forge-border hover:border-accent-cyan hover:text-accent-cyan"
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
            </>
          )}
        </Button>
      )}
    </div>
  );
}

// Hook to check GitHub connection status - now uses store
export function useGitHubSession() {
  const {
    session,
    isGitHubConnected,
    isSyncing,
    githubError,
    githubLoading,
    githubSuccess,
  } = useAuthStore();

  return {
    session: {
      authenticated: isGitHubConnected,
      github: session.github
    },
    loading: isSyncing || githubLoading,
    isConnected: isGitHubConnected,
    error: githubError,
    success: githubSuccess,
  };
}

// Hook to require GitHub connection
export function useRequireGitHub() {
  const { isGitHubConnected, isWalletConnected, openAuthModal, githubError, githubLoading } = useAuthStore();

  const requireGitHub = (action: () => void): boolean => {
    if (!isWalletConnected || !isGitHubConnected) {
      openAuthModal(action);
      return false;
    }
    action();
    return true;
  };

  return {
    requireGitHub,
    isGitHubConnected,
    isWalletConnected,
    githubError,
    githubLoading,
  };
}
