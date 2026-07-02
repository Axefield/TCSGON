/**
 * Auth feature barrel — Phase 1 + Phase 3.
 *
 * @see docs/plans/phase-1-core-infrastructure.md §2
 * @see docs/plans/phase-3-authentication.md
 */
export { authInitialState, isAuthenticated, isAuthenticating } from './authState';
export type { AuthState } from './authState';

export { authSlice, authActions, authReducer, setSession } from './slice/authSlice';
export type { AuthFailurePayload } from './slice/authSlice';

export { loadAuth, saveAuth, clearAuth } from './slice/authPersistence';

export { useAuth } from './hooks';
export type { UseAuthResult } from './hooks';

export {
  authKeys,
  useLogin,
  useSignup,
  useLogout,
  useResetPassword,
  useForgotPassword,
  useSession,
} from './api';
export type {
  UseLoginResult,
  UseSignupResult,
  UseLogoutResult,
  UseResetPasswordResult,
  UseForgotPasswordResult,
  UseSessionResult,
} from './api';

export { ForgotPasswordForm } from './components/ForgotPasswordForm';
export type { ForgotPasswordFormProps } from './components/ForgotPasswordForm';
export { LoginForm } from './components/LoginForm';
export type { LoginFormProps } from './components/LoginForm';
export { PasswordStrengthIndicator } from './components/PasswordStrengthIndicator';
export type { PasswordStrengthIndicatorProps, PasswordStrength } from './components/PasswordStrengthIndicator';
export { ProfileMenu } from './components/ProfileMenu';
export type { ProfileMenuProps } from './components/ProfileMenu';
export { ResetPasswordForm } from './components/ResetPasswordForm';
export type { ResetPasswordFormProps } from './components/ResetPasswordForm';
export { SessionCheck } from './components/SessionCheck';
export { SignupForm } from './components/SignupForm';
export type { SignupFormProps } from './components/SignupForm';
export {
  ForgotPasswordPage,
  LoginPage,
  NotFoundPage,
  ResetPasswordPage,
  SettingsPage,
  SignupPage,
} from './pages';
