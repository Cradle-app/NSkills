"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface AuthSession {
  walletAddress: string | null;
  github: {
    id: string;
    username: string;
    avatar: string;
  } | null;
}

export type AuthErrorType =
  | "wallet_rejected"
  | "wallet_disconnected"
  | "wallet_network_error"
  | "wallet_switch_error"
  | "github_popup_closed"
  | "github_auth_failed"
  | "github_session_expired"
  | "github_network_error"
  | "network_error"
  | "unknown_error";

export interface AuthError {
  type: AuthErrorType;
  message: string;
  retryable: boolean;
}

export type ConnectionState =
  | "both_connected" // Full access
  | "wallet_only" // Wallet connected, GitHub not connected
  | "github_only" // GitHub connected, Wallet not connected
  | "none_connected"; // Neither connected

interface AuthState {
  session: AuthSession;
  isWalletConnected: boolean;
  isGitHubConnected: boolean;
  isFullyAuthenticated: boolean;
  showAuthModal: boolean;
  authModalStep: "wallet" | "github" | "complete";
  pendingAction: (() => void) | null;
  isSyncing: boolean;
  isInitialized: boolean;

  // Loading states
  walletLoading: boolean;
  githubLoading: boolean;

  // Error states
  walletError: AuthError | null;
  githubError: AuthError | null;

  // Success states
  walletSuccess: boolean;
  githubSuccess: boolean;

  // Session monitoring
  lastSessionCheck: number | null;
  sessionCheckInterval: number | null;

  // Computed connection state
  getConnectionState: () => ConnectionState;

  // Actions
  setWalletConnected: (address: string | null) => void;
  setGitHubSession: (github: AuthSession["github"]) => void;
  disconnectGitHub: () => Promise<void>;
  openAuthModal: (pendingAction?: () => void) => void;
  closeAuthModal: () => void;
  setAuthModalStep: (step: "wallet" | "github" | "complete") => void;
  executePendingAction: () => void;
  clearSession: () => void;
  syncWithDatabase: (walletAddress: string) => Promise<void>;
  checkDatabaseAuth: (
    walletAddress: string
  ) => Promise<{ hasWallet: boolean; hasGitHub: boolean }>;
  checkActiveGitHubSession: () => Promise<boolean>;
  checkFullAuthStatus: (
    walletAddress: string
  ) => Promise<{
    hasWallet: boolean;
    hasGitHub: boolean;
    hasActiveSession: boolean;
  }>;
  initializeFromDatabase: (walletAddress: string) => Promise<void>;

  // Loading state actions
  setWalletLoading: (loading: boolean) => void;
  setGitHubLoading: (loading: boolean) => void;

  // Error handling actions
  setWalletError: (error: AuthError | null) => void;
  setGitHubError: (error: AuthError | null) => void;
  clearAllErrors: () => void;

  // Success state actions
  setWalletSuccess: (success: boolean) => void;
  setGitHubSuccess: (success: boolean) => void;
  resetSuccessStates: () => void;

  // Session monitoring actions
  startSessionMonitoring: () => void;
  stopSessionMonitoring: () => void;
  handleWalletDisconnect: () => void;
  handleGitHubSessionExpiry: () => void;
  handleWalletAccountChange: (newAddress: string) => void;

  // Retry actions
  retryWalletConnection: () => void;
  retryGitHubConnection: () => void;
}

// Helper function to create error objects
export const createAuthError = (
  type: AuthErrorType,
  customMessage?: string
): AuthError => {
  const errorMessages: Record<
    AuthErrorType,
    { message: string; retryable: boolean }
  > = {
    wallet_rejected: {
      message: "Wallet connection was rejected. Please try again.",
      retryable: true,
    },
    wallet_disconnected: {
      message: "Wallet was disconnected. Please reconnect.",
      retryable: true,
    },
    wallet_network_error: {
      message:
        "Network error while connecting wallet. Please check your connection.",
      retryable: true,
    },
    wallet_switch_error: {
      message: "Error switching wallet accounts. Please try again.",
      retryable: true,
    },
    github_popup_closed: {
      message: "GitHub authentication window was closed. Please try again.",
      retryable: true,
    },
    github_auth_failed: {
      message: "GitHub authentication failed. Please try again.",
      retryable: true,
    },
    github_session_expired: {
      message: "Your GitHub session has expired. Please reconnect.",
      retryable: true,
    },
    github_network_error: {
      message: "Network error during GitHub authentication. Please try again.",
      retryable: true,
    },
    network_error: {
      message:
        "Network error occurred. Please check your connection and try again.",
      retryable: true,
    },
    unknown_error: {
      message: "An unexpected error occurred. Please try again.",
      retryable: true,
    },
  };

  const errorInfo = errorMessages[type];
  return {
    type,
    message: customMessage || errorInfo.message,
    retryable: errorInfo.retryable,
  };
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      session: {
        walletAddress: null,
        github: null,
      },
      isWalletConnected: false,
      isGitHubConnected: false,
      isFullyAuthenticated: false,
      showAuthModal: false,
      authModalStep: "wallet",
      pendingAction: null,
      isSyncing: false,
      isInitialized: false,

      // Loading states
      walletLoading: false,
      githubLoading: false,

      // Error states
      walletError: null,
      githubError: null,

      // Success states
      walletSuccess: false,
      githubSuccess: false,

      // Session monitoring
      lastSessionCheck: null,
      sessionCheckInterval: null,

      // Computed connection state
      getConnectionState: () => {
        const { isWalletConnected, isGitHubConnected } = get();
        if (isWalletConnected && isGitHubConnected) return "both_connected";
        if (isWalletConnected && !isGitHubConnected) return "wallet_only";
        if (!isWalletConnected && isGitHubConnected) return "github_only";
        return "none_connected";
      },

      setWalletConnected: (address) => {
        const wasConnected = get().isWalletConnected;
        set((state) => ({
          session: { ...state.session, walletAddress: address },
          isWalletConnected: !!address,
          isFullyAuthenticated: !!address && state.isGitHubConnected,
          authModalStep: address ? "github" : "wallet",
          walletLoading: false,
          walletError: null,
          // Only set success if transitioning from disconnected to connected
          walletSuccess: !wasConnected && !!address,
        }));

        // Clear success after delay
        if (!wasConnected && !!address) {
          setTimeout(() => {
            set({ walletSuccess: false });
          }, 2000);
        }
      },

      setGitHubSession: (github) => {
        const wasConnected = get().isGitHubConnected;
        set((state) => ({
          session: { ...state.session, github },
          isGitHubConnected: !!github,
          isFullyAuthenticated: state.isWalletConnected && !!github,
          authModalStep: github ? "complete" : state.authModalStep,
          githubLoading: false,
          githubError: null,
          // Only set success if transitioning from disconnected to connected
          githubSuccess: !wasConnected && !!github,
        }));

        // Clear success after delay
        if (!wasConnected && !!github) {
          setTimeout(() => {
            set({ githubSuccess: false });
          }, 2000);
        }
      },

      openAuthModal: async (pendingAction) => {
        const { isWalletConnected, isGitHubConnected, session } = get();

        // Clear any previous errors when opening modal
        set({ walletError: null, githubError: null });

        // If wallet is connected, check BOTH database AND active session
        if (isWalletConnected && session.walletAddress) {
          const fullAuth = await get().checkFullAuthStatus(
            session.walletAddress
          );

          // Only skip modal if: wallet exists in DB + GitHub in DB + active GitHub session
          if (
            fullAuth.hasWallet &&
            fullAuth.hasGitHub &&
            fullAuth.hasActiveSession
          ) {
            // User is fully authenticated with active session, execute action if provided
            if (pendingAction) {
              pendingAction();
            }
            return;
          }

          // Determine which step to show based on what's missing
          let step: "wallet" | "github" | "complete" = "complete";
          if (!fullAuth.hasWallet) {
            step = "wallet";
          } else if (!fullAuth.hasGitHub || !fullAuth.hasActiveSession) {
            // Need GitHub connection (either not in DB or session expired)
            step = "github";
          }

          set({
            showAuthModal: true,
            pendingAction: pendingAction || null,
            authModalStep: step,
          });
          return;
        }

        // Wallet not connected - show wallet step
        set({
          showAuthModal: true,
          pendingAction: pendingAction || null,
          authModalStep: !isWalletConnected
            ? "wallet"
            : !isGitHubConnected
            ? "github"
            : "complete",
        });
      },

      closeAuthModal: () => {
        set({
          showAuthModal: false,
          pendingAction: null,
          // Clear success states when closing
          walletSuccess: false,
          githubSuccess: false,
        });
      },

      setAuthModalStep: (step) => {
        set({ authModalStep: step });
      },

      executePendingAction: () => {
        const { pendingAction, isFullyAuthenticated } = get();
        if (isFullyAuthenticated && pendingAction) {
          pendingAction();
          set({ pendingAction: null, showAuthModal: false });
        }
      },

      clearSession: () => {
        get().stopSessionMonitoring();
        set({
          session: { walletAddress: null, github: null },
          isWalletConnected: false,
          isGitHubConnected: false,
          isFullyAuthenticated: false,
          showAuthModal: false,
          authModalStep: "wallet",
          pendingAction: null,
          walletLoading: false,
          githubLoading: false,
          walletError: null,
          githubError: null,
          walletSuccess: false,
          githubSuccess: false,
        });
      },

      // Disconnect GitHub - only clears local session, does NOT delete from database
      disconnectGitHub: async () => {
        try {
          set({ githubLoading: true });
          // Only clear the session cookie, don't touch database
          await fetch("/api/auth/session", { method: "DELETE" });

          // Clear GitHub from local state only
          set((state) => ({
            session: { ...state.session, github: null },
            isGitHubConnected: false,
            isFullyAuthenticated: false,
            authModalStep: state.isWalletConnected ? "github" : "wallet",
            githubLoading: false,
          }));
        } catch (error) {
          console.error("Error disconnecting GitHub:", error);
          set({
            githubLoading: false,
            githubError: createAuthError("network_error"),
          });
        }
      },

      syncWithDatabase: async (walletAddress: string) => {
        set({ isSyncing: true });
        try {
          // Check database for user
          const response = await fetch(
            `/api/auth/user?walletAddress=${encodeURIComponent(walletAddress)}`
          );
          if (response.ok) {
            const data = await response.json();
            const user = data.user;

            if (user) {
              // Only set GitHub if there's an active session (cookie); otherwise
              // we'd show GitHub as connected from DB after user logged out.
              const sessionResponse = await fetch("/api/auth/session");
              const sessionData = await sessionResponse.json();
              const hasActiveSession =
                sessionData.authenticated && !!sessionData.github;

              set((state) => ({
                session: {
                  walletAddress: user.walletAddress,
                  github:
                    user.githubId && hasActiveSession
                      ? {
                          id: user.githubId,
                          username: user.githubUsername || "",
                          avatar: user.githubAvatar || "",
                        }
                      : null,
                },
                isWalletConnected: !!user.walletAddress,
                isGitHubConnected: !!user.githubId && hasActiveSession,
                isFullyAuthenticated:
                  !!user.walletAddress && !!user.githubId && hasActiveSession,
              }));
            }
          }
        } catch (error) {
          console.error("Error syncing with database:", error);
        } finally {
          set({ isSyncing: false });
        }
      },

      checkDatabaseAuth: async (walletAddress: string) => {
        try {
          const response = await fetch(
            `/api/auth/user?walletAddress=${encodeURIComponent(walletAddress)}`
          );
          if (response.ok) {
            const data = await response.json();
            const user = data.user;
            return {
              hasWallet: !!user?.walletAddress,
              hasGitHub: !!user?.githubId,
            };
          }
        } catch (error) {
          console.error("Error checking database auth:", error);
        }
        return { hasWallet: false, hasGitHub: false };
      },

      // Check if there's an active GitHub session (cookie-based)
      checkActiveGitHubSession: async () => {
        try {
          const response = await fetch("/api/auth/session");
          const data = await response.json();
          const hasSession = data.authenticated && !!data.github;

          set({ lastSessionCheck: Date.now() });

          // If session expired, update state
          if (!hasSession && get().isGitHubConnected) {
            get().handleGitHubSessionExpiry();
          }

          return hasSession;
        } catch (error) {
          console.error("Error checking GitHub session:", error);
          return false;
        }
      },

      // Comprehensive auth check: database + active session
      checkFullAuthStatus: async (walletAddress: string) => {
        try {
          // Check database user record and session in parallel to reduce latency
          const [dbResponse, sessionResponse] = await Promise.all([
            fetch(
              `/api/auth/user?walletAddress=${encodeURIComponent(
                walletAddress
              )}`
            ),
            fetch("/api/auth/session"),
          ]);

          let hasWallet = false;
          let hasGitHubInDb = false;

          if (dbResponse.ok) {
            const data = await dbResponse.json();
            const user = data.user;
            hasWallet = !!user?.walletAddress;
            hasGitHubInDb = !!user?.githubId;
          }

          const sessionData = await sessionResponse.json();
          const hasActiveSession =
            sessionData.authenticated && !!sessionData.github;

          set({ lastSessionCheck: Date.now() });

          return {
            hasWallet,
            hasGitHub: hasGitHubInDb,
            hasActiveSession,
          };
        } catch (error) {
          console.error("Error checking full auth status:", error);
          return {
            hasWallet: false,
            hasGitHub: false,
            hasActiveSession: false,
          };
        }
      },

      // Initialize state from database on app load
      initializeFromDatabase: async (walletAddress: string) => {
        const { isInitialized } = get();
        if (isInitialized) return;

        set({ isSyncing: true });
        try {
          // First check database for persisted user data
          const response = await fetch(
            `/api/auth/user?walletAddress=${encodeURIComponent(walletAddress)}`
          );
          if (response.ok) {
            const data = await response.json();
            const user = data.user;

            if (user) {
              // Check if there's an active GitHub session (cookie)
              const sessionResponse = await fetch("/api/auth/session");
              const sessionData = await sessionResponse.json();
              const hasActiveSession =
                sessionData.authenticated && sessionData.github;

              set({
                session: {
                  walletAddress: user.walletAddress,
                  github:
                    user.githubId && hasActiveSession
                      ? {
                          id: user.githubId,
                          username: user.githubUsername || "",
                          avatar: user.githubAvatar || "",
                        }
                      : null,
                },
                isWalletConnected: !!user.walletAddress,
                // Only mark as GitHub connected if both database AND active session exist
                isGitHubConnected: !!user.githubId && hasActiveSession,
                isFullyAuthenticated:
                  !!user.walletAddress && !!user.githubId && hasActiveSession,
                isInitialized: true,
                lastSessionCheck: Date.now(),
              });

              // Start session monitoring
              get().startSessionMonitoring();
            } else {
              set({ isInitialized: true });
            }
          } else {
            set({ isInitialized: true });
          }
        } catch (error) {
          console.error("Error initializing from database:", error);
          set({ isInitialized: true });
        } finally {
          set({ isSyncing: false });
        }
      },

      // Loading state actions
      setWalletLoading: (loading) => {
        set({ walletLoading: loading });
      },

      setGitHubLoading: (loading) => {
        set({ githubLoading: loading });
      },

      // Error handling actions
      setWalletError: (error) => {
        set({ walletError: error, walletLoading: false });
      },

      setGitHubError: (error) => {
        set({ githubError: error, githubLoading: false });
      },

      clearAllErrors: () => {
        set({ walletError: null, githubError: null });
      },

      // Success state actions
      setWalletSuccess: (success) => {
        set({ walletSuccess: success });
        if (success) {
          setTimeout(() => {
            set({ walletSuccess: false });
          }, 2000);
        }
      },

      setGitHubSuccess: (success) => {
        set({ githubSuccess: success });
        if (success) {
          setTimeout(() => {
            set({ githubSuccess: false });
          }, 2000);
        }
      },

      resetSuccessStates: () => {
        set({ walletSuccess: false, githubSuccess: false });
      },

      // Session monitoring actions
      startSessionMonitoring: () => {
        const { sessionCheckInterval } = get();

        // Clear existing interval if any
        if (sessionCheckInterval) {
          clearInterval(sessionCheckInterval);
        }

        // Check session every 5 minutes
        const interval = setInterval(() => {
          get().checkActiveGitHubSession();
        }, 5 * 60 * 1000) as unknown as number;

        set({ sessionCheckInterval: interval });
      },

      stopSessionMonitoring: () => {
        const { sessionCheckInterval } = get();
        if (sessionCheckInterval) {
          clearInterval(sessionCheckInterval);
          set({ sessionCheckInterval: null });
        }
      },

      handleWalletDisconnect: () => {
        set((state) => ({
          session: { ...state.session, walletAddress: null },
          isWalletConnected: false,
          isFullyAuthenticated: false,
          walletError: createAuthError("wallet_disconnected"),
          authModalStep: "wallet",
        }));
      },

      handleGitHubSessionExpiry: () => {
        set((state) => ({
          session: { ...state.session, github: null },
          isGitHubConnected: false,
          isFullyAuthenticated: false,
          githubError: createAuthError("github_session_expired"),
          authModalStep: state.isWalletConnected ? "github" : "wallet",
        }));
      },

      handleWalletAccountChange: (newAddress: string) => {
        const { session } = get();

        // If switching to a different account, clear GitHub session
        if (
          session.walletAddress &&
          session.walletAddress.toLowerCase() !== newAddress.toLowerCase()
        ) {
          set({
            session: { walletAddress: newAddress, github: null },
            isWalletConnected: true,
            isGitHubConnected: false,
            isFullyAuthenticated: false,
            isInitialized: false, // Re-initialize from database for new account
          });

          // Re-initialize from database for new account
          get().initializeFromDatabase(newAddress);
        } else {
          set((state) => ({
            session: { ...state.session, walletAddress: newAddress },
            isWalletConnected: true,
          }));
        }
      },

      // Retry actions
      retryWalletConnection: () => {
        set({ walletError: null, walletLoading: false });
      },

      retryGitHubConnection: () => {
        set({ githubError: null, githubLoading: false });
      },
    }),
    {
      name: "cradle-auth-storage",
      partialize: (state) => ({
        session: state.session,
        isWalletConnected: state.isWalletConnected,
        isGitHubConnected: state.isGitHubConnected,
        isFullyAuthenticated: state.isFullyAuthenticated,
      }),
    }
  )
);

// Hook to get human-readable connection state message
export function useConnectionStateMessage() {
  const { getConnectionState, isWalletConnected, isGitHubConnected } =
    useAuthStore();
  const state = getConnectionState();

  const messages: Record<
    ConnectionState,
    { title: string; description: string }
  > = {
    both_connected: {
      title: "Fully Authenticated",
      description: "You have full access to all platform features.",
    },
    wallet_only: {
      title: "Wallet Connected",
      description: "Connect your GitHub account to unlock all features.",
    },
    github_only: {
      title: "GitHub Connected",
      description: "Connect your wallet to complete authentication.",
    },
    none_connected: {
      title: "Not Authenticated",
      description: "Connect your wallet and GitHub to access the platform.",
    },
  };

  return {
    state,
    isWalletConnected,
    isGitHubConnected,
    ...messages[state],
  };
}
