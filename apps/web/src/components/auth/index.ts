// Auth components - reusable authentication components for wallet and GitHub
export {
  WalletConnectButton,
  useRequireWallet,
  useWalletEvents,
} from "./wallet-connect-button";
export { AuthFlowModal, useAuthFlow } from "./auth-flow-modal";
export {
  AuthGuard,
  AuthOverlay,
  AuthStatusBadge,
  useAuthGuard,
  withAuthGuard,
} from "./auth-guard";
export {
  GitHubConnect,
  useGitHubSession,
  useRequireGitHub,
} from "./github-connect";

// Re-export auth store types and helpers for convenience
export {
  useAuthStore,
  createAuthError,
  useConnectionStateMessage,
  type AuthSession,
  type AuthError,
  type AuthErrorType,
  type ConnectionState,
} from "@/store/auth";
