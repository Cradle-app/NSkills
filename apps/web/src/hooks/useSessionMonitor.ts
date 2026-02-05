"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { useAccount } from "wagmi";
import { useAuthStore, createAuthError } from "@/store/auth";

interface SessionMonitorOptions {
  // How often to check GitHub session (in milliseconds)
  sessionCheckInterval?: number;
  // Whether to show auth modal when session expires
  showModalOnExpiry?: boolean;
  // Callback when wallet disconnects
  onWalletDisconnect?: () => void;
  // Callback when GitHub session expires
  onGitHubExpiry?: () => void;
  // Callback when wallet account changes
  onAccountChange?: (newAddress: string, oldAddress: string) => void;
}

const DEFAULT_SESSION_CHECK_INTERVAL = 5 * 60 * 1000; // 5 minutes

/**
 * Hook to monitor authentication session state
 * Detects: wallet disconnect, GitHub session expiry, account switching
 */
export function useSessionMonitor(options: SessionMonitorOptions = {}) {
  const {
    sessionCheckInterval = DEFAULT_SESSION_CHECK_INTERVAL,
    showModalOnExpiry = true,
    onWalletDisconnect,
    onGitHubExpiry,
    onAccountChange,
  } = options;

  const { address, isConnected } = useAccount();
  const {
    session,
    isGitHubConnected,
    handleWalletDisconnect,
    handleGitHubSessionExpiry,
    handleWalletAccountChange,
    checkActiveGitHubSession,
    openAuthModal,
    setGitHubError,
  } = useAuthStore();

  const previousAddressRef = useRef<string | null>(null);
  const sessionCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isInitializedRef = useRef(false);
  const [isMounted, setIsMounted] = useState(false);

  // Ensure we only run on client
  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  // Check GitHub session
  const checkSession = useCallback(async () => {
    if (!isGitHubConnected || !isMounted) return;

    try {
      const hasActiveSession = await checkActiveGitHubSession();

      if (!hasActiveSession && isGitHubConnected) {
        // Session expired
        handleGitHubSessionExpiry();
        setGitHubError(createAuthError("github_session_expired"));
        onGitHubExpiry?.();

        if (showModalOnExpiry) {
          openAuthModal();
        }
      }
    } catch (error) {
      console.error("Error checking GitHub session:", error);
    }
  }, [
    isGitHubConnected,
    isMounted,
    checkActiveGitHubSession,
    handleGitHubSessionExpiry,
    setGitHubError,
    onGitHubExpiry,
    showModalOnExpiry,
    openAuthModal,
  ]);

  // Handle wallet connection changes
  useEffect(() => {
    if (!isMounted) return;

    // Skip initial render
    if (!isInitializedRef.current) {
      if (address) {
        previousAddressRef.current = address;
      }
      isInitializedRef.current = true;
      return;
    }

    if (isConnected && address) {
      if (
        previousAddressRef.current &&
        previousAddressRef.current !== address
      ) {
        // Account changed
        const oldAddress = previousAddressRef.current;
        handleWalletAccountChange(address);
        onAccountChange?.(address, oldAddress);
      }
      previousAddressRef.current = address;
    } else if (!isConnected && previousAddressRef.current) {
      // Wallet disconnected
      handleWalletDisconnect();
      onWalletDisconnect?.();
      previousAddressRef.current = null;
    }
  }, [
    isConnected,
    address,
    isMounted,
    handleWalletDisconnect,
    handleWalletAccountChange,
    onWalletDisconnect,
    onAccountChange,
  ]);

  // Set up periodic session check
  useEffect(() => {
    if (!isMounted) return;

    // Clear existing interval
    if (sessionCheckIntervalRef.current) {
      clearInterval(sessionCheckIntervalRef.current);
    }

    // Only start checking if GitHub is connected
    if (isGitHubConnected && isConnected) {
      // Check after a short delay (not immediately to avoid SSR issues)
      const timeoutId = setTimeout(() => {
        checkSession();
      }, 1000);

      // Set up interval
      sessionCheckIntervalRef.current = setInterval(
        checkSession,
        sessionCheckInterval
      );

      return () => {
        clearTimeout(timeoutId);
        if (sessionCheckIntervalRef.current) {
          clearInterval(sessionCheckIntervalRef.current);
        }
      };
    }

    return () => {
      if (sessionCheckIntervalRef.current) {
        clearInterval(sessionCheckIntervalRef.current);
      }
    };
  }, [
    isGitHubConnected,
    isConnected,
    isMounted,
    checkSession,
    sessionCheckInterval,
  ]);

  // Check session on window focus (user returns to tab)
  useEffect(() => {
    if (!isMounted || typeof window === "undefined") return;

    const handleFocus = () => {
      if (isGitHubConnected && isConnected) {
        checkSession();
      }
    };

    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [isGitHubConnected, isConnected, isMounted, checkSession]);

  // Check session on network reconnect
  useEffect(() => {
    if (!isMounted || typeof window === "undefined") return;

    const handleOnline = () => {
      if (isGitHubConnected && isConnected) {
        checkSession();
      }
    };

    window.addEventListener("online", handleOnline);
    return () => window.removeEventListener("online", handleOnline);
  }, [isGitHubConnected, isConnected, isMounted, checkSession]);

  return {
    isWalletConnected: isConnected,
    isGitHubConnected,
    walletAddress: address,
    githubUser: session.github,
    checkSession,
    isMounted,
  };
}

/**
 * Hook to get the current authentication state with all details
 * Safe for SSR - returns default values during server render
 */
export function useAuthState() {
  const { address, isConnected, isConnecting, isReconnecting } = useAccount();
  const {
    session,
    isWalletConnected,
    isGitHubConnected,
    isFullyAuthenticated,
    walletLoading,
    githubLoading,
    walletError,
    githubError,
    walletSuccess,
    githubSuccess,
    getConnectionState,
    isSyncing,
    isInitialized,
  } = useAuthStore();

  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Return safe defaults during SSR
  if (!isMounted) {
    return {
      // Connection states
      isWalletConnected: false,
      isGitHubConnected: false,
      isFullyAuthenticated: false,
      connectionState: "none_connected" as const,

      // Wallet details
      walletAddress: null,

      // GitHub details
      githubUser: null,

      // Loading states
      isLoading: true,
      walletLoading: false,
      githubLoading: false,
      isSyncing: false,
      isInitialized: false,

      // Error states
      walletError: null,
      githubError: null,
      hasError: false,

      // Success states
      walletSuccess: false,
      githubSuccess: false,

      // Computed states
      needsWallet: true,
      needsGitHub: false,
      isPartiallyAuthenticated: false,
    };
  }

  const connectionState = getConnectionState();

  return {
    // Connection states
    isWalletConnected: isConnected || isWalletConnected,
    isGitHubConnected,
    isFullyAuthenticated,
    connectionState,

    // Wallet details
    walletAddress: address || session.walletAddress,

    // GitHub details
    githubUser: session.github,

    // Loading states
    isLoading:
      walletLoading ||
      githubLoading ||
      isSyncing ||
      isConnecting ||
      isReconnecting,
    walletLoading: walletLoading || isConnecting || isReconnecting,
    githubLoading,
    isSyncing,
    isInitialized,

    // Error states
    walletError,
    githubError,
    hasError: !!walletError || !!githubError,

    // Success states
    walletSuccess,
    githubSuccess,

    // Computed states
    needsWallet: !isConnected && !isWalletConnected,
    needsGitHub: (isConnected || isWalletConnected) && !isGitHubConnected,
    isPartiallyAuthenticated:
      (isConnected || isWalletConnected) && !isGitHubConnected,
  };
}

/**
 * Provider component to wrap your app with session monitoring
 * Use this in your layout or root component
 */
export function SessionMonitorProvider({
  children,
  options,
}: {
  children: React.ReactNode;
  options?: SessionMonitorOptions;
}): React.ReactNode {
  useSessionMonitor(options);
  return children;
}
