'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface AuthSession {
  walletAddress: string | null;
  github: {
    id: string;
    username: string;
    avatar: string;
  } | null;
}

interface AuthState {
  session: AuthSession;
  isWalletConnected: boolean;
  isGitHubConnected: boolean;
  isFullyAuthenticated: boolean;
  showAuthModal: boolean;
  authModalStep: 'wallet' | 'github' | 'complete';
  pendingAction: (() => void) | null;
  isSyncing: boolean;
  isInitialized: boolean;

  // Actions
  setWalletConnected: (address: string | null) => void;
  setGitHubSession: (github: AuthSession['github']) => void;
  disconnectGitHub: () => Promise<void>;
  openAuthModal: (pendingAction?: () => void) => void;
  closeAuthModal: () => void;
  setAuthModalStep: (step: 'wallet' | 'github' | 'complete') => void;
  executePendingAction: () => void;
  clearSession: () => void;
  syncWithDatabase: (walletAddress: string) => Promise<void>;
  checkDatabaseAuth: (walletAddress: string) => Promise<{ hasWallet: boolean; hasGitHub: boolean }>;
  checkActiveGitHubSession: () => Promise<boolean>;
  checkFullAuthStatus: (walletAddress: string) => Promise<{ hasWallet: boolean; hasGitHub: boolean; hasActiveSession: boolean }>;
  initializeFromDatabase: (walletAddress: string) => Promise<void>;
}

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
      authModalStep: 'wallet',
      pendingAction: null,
      isSyncing: false,
      isInitialized: false,

      setWalletConnected: (address) => {
        set((state) => ({
          session: { ...state.session, walletAddress: address },
          isWalletConnected: !!address,
          isFullyAuthenticated: !!address && state.isGitHubConnected,
          authModalStep: address ? 'github' : 'wallet',
        }));
      },

      setGitHubSession: (github) => {
        set((state) => ({
          session: { ...state.session, github },
          isGitHubConnected: !!github,
          isFullyAuthenticated: state.isWalletConnected && !!github,
          authModalStep: github ? 'complete' : state.authModalStep,
        }));
      },

      openAuthModal: async (pendingAction) => {
        const { isWalletConnected, isGitHubConnected, session } = get();
        
        // If wallet is connected, check BOTH database AND active session
        if (isWalletConnected && session.walletAddress) {
          const fullAuth = await get().checkFullAuthStatus(session.walletAddress);
          
          // Only skip modal if: wallet exists in DB + GitHub in DB + active GitHub session
          if (fullAuth.hasWallet && fullAuth.hasGitHub && fullAuth.hasActiveSession) {
            // User is fully authenticated with active session, execute action if provided
            if (pendingAction) {
              pendingAction();
            }
            return;
          }
          
          // Determine which step to show based on what's missing
          let step: 'wallet' | 'github' | 'complete' = 'complete';
          if (!fullAuth.hasWallet) {
            step = 'wallet';
          } else if (!fullAuth.hasGitHub || !fullAuth.hasActiveSession) {
            // Need GitHub connection (either not in DB or session expired)
            step = 'github';
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
          authModalStep: !isWalletConnected ? 'wallet' : !isGitHubConnected ? 'github' : 'complete',
        });
      },

      closeAuthModal: () => {
        set({ showAuthModal: false, pendingAction: null });
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
        set({
          session: { walletAddress: null, github: null },
          isWalletConnected: false,
          isGitHubConnected: false,
          isFullyAuthenticated: false,
          showAuthModal: false,
          authModalStep: 'wallet',
          pendingAction: null,
        });
      },

      // Disconnect GitHub - only clears local session, does NOT delete from database
      disconnectGitHub: async () => {
        try {
          // Only clear the session cookie, don't touch database
          await fetch('/api/auth/session', { method: 'DELETE' });
          
          // Clear GitHub from local state only
          set((state) => ({
            session: { ...state.session, github: null },
            isGitHubConnected: false,
            isFullyAuthenticated: false,
            authModalStep: state.isWalletConnected ? 'github' : 'wallet',
          }));
        } catch (error) {
          console.error('Error disconnecting GitHub:', error);
        }
      },

      syncWithDatabase: async (walletAddress: string) => {
        set({ isSyncing: true });
        try {
          // Check database for user
          const response = await fetch(`/api/auth/user?walletAddress=${encodeURIComponent(walletAddress)}`);
          if (response.ok) {
            const data = await response.json();
            const user = data.user;
            
            if (user) {
              set((state) => ({
                session: {
                  walletAddress: user.walletAddress,
                  github: user.githubId
                    ? {
                        id: user.githubId,
                        username: user.githubUsername || '',
                        avatar: user.githubAvatar || '',
                      }
                    : null,
                },
                isWalletConnected: !!user.walletAddress,
                isGitHubConnected: !!user.githubId,
                isFullyAuthenticated: !!user.walletAddress && !!user.githubId,
              }));
            }
          }
        } catch (error) {
          console.error('Error syncing with database:', error);
        } finally {
          set({ isSyncing: false });
        }
      },

      checkDatabaseAuth: async (walletAddress: string) => {
        try {
          const response = await fetch(`/api/auth/user?walletAddress=${encodeURIComponent(walletAddress)}`);
          if (response.ok) {
            const data = await response.json();
            const user = data.user;
            return {
              hasWallet: !!user?.walletAddress,
              hasGitHub: !!user?.githubId,
            };
          }
        } catch (error) {
          console.error('Error checking database auth:', error);
        }
        return { hasWallet: false, hasGitHub: false };
      },

      // Check if there's an active GitHub session (cookie-based)
      checkActiveGitHubSession: async () => {
        try {
          const response = await fetch('/api/auth/session');
          const data = await response.json();
          return data.authenticated && !!data.github;
        } catch (error) {
          console.error('Error checking GitHub session:', error);
          return false;
        }
      },

      // Comprehensive auth check: database + active session
      checkFullAuthStatus: async (walletAddress: string) => {
        try {
          // Check database for user record
          const dbResponse = await fetch(`/api/auth/user?walletAddress=${encodeURIComponent(walletAddress)}`);
          let hasWallet = false;
          let hasGitHubInDb = false;
          
          if (dbResponse.ok) {
            const data = await dbResponse.json();
            const user = data.user;
            hasWallet = !!user?.walletAddress;
            hasGitHubInDb = !!user?.githubId;
          }
          
          // Check for active GitHub session (cookie)
          const sessionResponse = await fetch('/api/auth/session');
          const sessionData = await sessionResponse.json();
          const hasActiveSession = sessionData.authenticated && !!sessionData.github;
          
          return {
            hasWallet,
            hasGitHub: hasGitHubInDb,
            hasActiveSession,
          };
        } catch (error) {
          console.error('Error checking full auth status:', error);
          return { hasWallet: false, hasGitHub: false, hasActiveSession: false };
        }
      },

      // Initialize state from database on app load
      initializeFromDatabase: async (walletAddress: string) => {
        const { isInitialized } = get();
        if (isInitialized) return;
        
        set({ isSyncing: true });
        try {
          // First check database for persisted user data
          const response = await fetch(`/api/auth/user?walletAddress=${encodeURIComponent(walletAddress)}`);
          if (response.ok) {
            const data = await response.json();
            const user = data.user;
            
            if (user) {
              // Check if there's an active GitHub session (cookie)
              const sessionResponse = await fetch('/api/auth/session');
              const sessionData = await sessionResponse.json();
              const hasActiveSession = sessionData.authenticated && sessionData.github;
              
              set({
                session: {
                  walletAddress: user.walletAddress,
                  github: user.githubId && hasActiveSession
                    ? {
                        id: user.githubId,
                        username: user.githubUsername || '',
                        avatar: user.githubAvatar || '',
                      }
                    : null,
                },
                isWalletConnected: !!user.walletAddress,
                // Only mark as GitHub connected if both database AND active session exist
                isGitHubConnected: !!user.githubId && hasActiveSession,
                isFullyAuthenticated: !!user.walletAddress && !!user.githubId && hasActiveSession,
                isInitialized: true,
              });
            } else {
              set({ isInitialized: true });
            }
          } else {
            set({ isInitialized: true });
          }
        } catch (error) {
          console.error('Error initializing from database:', error);
          set({ isInitialized: true });
        } finally {
          set({ isSyncing: false });
        }
      },
    }),
    {
      name: 'cradle-auth-storage',
      partialize: (state) => ({
        session: state.session,
        isWalletConnected: state.isWalletConnected,
        isGitHubConnected: state.isGitHubConnected,
        isFullyAuthenticated: state.isFullyAuthenticated,
      }),
    }
  )
);
