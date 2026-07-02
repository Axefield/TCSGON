/**
 * Auth API barrel — exposes all hooks and query keys.
 *
 * @see docs/plans/phase-3-authentication.md
 */
export { authKeys, useLogin, useSignup, useLogout, useResetPassword, useForgotPassword, useSession } from './authApi';
export type {
  UseLoginResult,
  UseSignupResult,
  UseLogoutResult,
  UseResetPasswordResult,
  UseForgotPasswordResult,
  UseSessionResult,
} from './authApi';
export { userKeys, useProfileQuery, useUpdateProfile, useChangePassword } from './userApi';
export type { UseProfileResult, UseUpdateProfileResult, UseChangePasswordResult } from './userApi';
