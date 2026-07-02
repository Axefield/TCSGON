/**
 * useAuth — enriched auth hook (Phase 3).
 *
 * @see docs/plans/phase-1-core-infrastructure.md §11, §9 (Risk 9)
 * @see docs/plans/phase-3-authentication.md § Use Auth Result
 *
 * Composite hook over Redux auth selectors + React Query auth mutations.
 * Selectors compute during render — never `useEffect` for derived state.
 *
 * **State decision (per ADR):**
 *  - Synchronous auth state (user, session, status) read from Redux so route
 *    guards (`RequireAuth`, `RedirectIfAuth`) never await a network fetch.
 *  - Mutations (login, signup, logout, reset, forgot) delegate to React Query
 *    hooks which dispatch back to Redux on success/error. This keeps the RQ
 *    layer responsible for network state while Redux owns the synchronous cache.
 *
 * Usage:
 * ```tsx
 * const { status, user, login, logout, isAuthenticated } = useAuth();
 * if (status === 'authenticated') return <Dashboard />;
 * const { mutate: doLogin, isPending } = login;
 * ```
 */
import { useCallback, useRef } from 'react';
import { z } from 'zod';

import type { AuthState } from '@/features/auth/authState';
import { useForgotPassword, useLogin, useLogout, useResetPassword, useSignup } from '@/features/auth/api/authApi';
import type { UseForgotPasswordResult, UseLoginResult, UseLogoutResult, UseResetPasswordResult, UseSignupResult } from '@/features/auth/api/authApi';
import {
  authActions,
  selectAuthError,
  selectAuthState,
  selectCurrentUser,
  selectIsAuthenticated,
} from '@/features/auth/slice/authSlice';
import { useApiClient } from '@/shared/api/ApiClientContext';
import { ApiError } from '@/shared/api/errors';
import type { Session, User } from '@/shared/types/user';
import { SessionCheckSchema } from '@/shared/types/user';
import { useAppDispatch, useAppSelector } from '@/store/hooks';

// ═══════════════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Enriched return type for `useAuth()`.
 *
 * @remarks
 * - `status`, `user`, `session`, `error`, `isAuthenticated` — synchronous
 *   selectors from Redux (no network dependency).
 * - `login`, `signup`, `logout`, `resetPassword`, `forgotPassword` — React
 *   Query mutation objects. Each exposes `.mutate()`, `.mutateAsync()`,
 *   `.isPending`, `.isError`, `.error`, `.data`, `.reset()`.
 * - `refresh` — invalidates the session query so a background refetch occurs
 *   and syncs back to Redux via `rehydrate` dispatch.
 */
export interface UseAuthResult {
  /** Synchronous auth status from Redux. */
  readonly status: AuthState['kind'];
  /** Current user object, or `null` if not authenticated. */
  readonly user: User | null;
  /** Current session object, or `null` if not authenticated. */
  readonly session: Session | null;
  /** Auth error message, or `null` when no error. */
  readonly error: string | null;
  /** `true` when `status === 'authenticated'`. */
  readonly isAuthenticated: boolean;

  // ── Mutations (React Query) ────────────────────────────────────────────

  /** Login mutation — call `login.mutate(input)` or `login.mutateAsync(input)`. */
  readonly login: UseLoginResult['login'];
  /** Signup mutation — creates account + auto-logs in. */
  readonly signup: UseSignupResult['signup'];
  /** Logout mutation — best-effort network; always clears local state. */
  readonly logout: UseLogoutResult['logout'];
  /** Reset-password mutation — validates token + new password. */
  readonly resetPassword: UseResetPasswordResult['resetPassword'];
  /** Forgot-password mutation — triggers reset email. */
  readonly forgotPassword: UseForgotPasswordResult['forgotPassword'];

  // ── Queries ────────────────────────────────────────────────────────────

  /** Invalidates the session query so it refetches in the background. */
  readonly refresh: () => Promise<unknown>;
}

// ═══════════════════════════════════════════════════════════════════════════
// Hook
// ═══════════════════════════════════════════════════════════════════════════

/**
 * useAuth — single-entry auth hook for any component.
 *
 * Composes Redux selectors (synchronous) with React Query mutations.
 * Callers get instant auth reads plus mutation primitives.
 */
export function useAuth(): UseAuthResult {
  // ── Synchronous Redux selectors ──────────────────────────────────────
  const state = useAppSelector(selectAuthState);
  const user = useAppSelector(selectCurrentUser);
  const error = useAppSelector(selectAuthError);
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const apiClient = useApiClient();
  const dispatch = useAppDispatch();

  // Keep a ref to the latest auth state so refresh() always reads the
  // current token without a stale closure.
  const stateRef = useRef(state);
  stateRef.current = state;

  // ── React Query mutations ────────────────────────────────────────────
  // Composed from authApi hooks. Each dispatches back to Redux on
  // success/error, keeping the slice state in sync with server state.
  const { login } = useLogin();
  const { signup } = useSignup();
  const { logout } = useLogout();
  const { resetPassword } = useResetPassword();
  const { forgotPassword } = useForgotPassword();

  // ── Refresh — verify session with server and sync to Redux ──────────
  // Unlike query invalidation, this does NOT depend on an active
  // `useSession` observer. It directly calls the API and dispatches
  // the result, making it safe to call from any component.
  const refresh = useCallback(async (): Promise<void> => {
    try {
      const result = await apiClient.request<void, z.infer<typeof SessionCheckSchema>>({
        method: 'GET',
        path: '/api/auth/session',
        schema: SessionCheckSchema,
      });
      if (!result.ok) {
        if (result.error instanceof ApiError && result.error.kind === 'unauthorized') {
          dispatch(authActions.sessionExpired());
        }
        return;
      }
      // Server returns { user, session: { id, expiresAt } } — no token.
      // Merge with existing token from Redux state to construct a complete
      // Session for downstream consumers.
      const current = stateRef.current;
      const existingToken = current.kind === 'authenticated' ? current.session.token : '';
      const session: Session = {
        id: result.data.session.id,
        user: result.data.user,
        token: existingToken,
        expiresAt: result.data.session.expiresAt,
      };
      dispatch(authActions.rehydrate(session));
    } catch {
      dispatch(authActions.sessionExpired());
    }
  }, [apiClient, dispatch]);

  return {
    status: state.kind,
    user,
    session: state.kind === 'authenticated' ? state.session : null,
    error,
    isAuthenticated,
    login,
    signup,
    logout,
    resetPassword,
    forgotPassword,
    refresh,
  };
}
