/**
 * authApi — React Query hooks + type contracts for the Authentication Feature.
 *
 * @see docs/plans/phase-3-authentication.md
 *
 * Rules:
 *  - Every mutation calls `apiClient.request()` with a typed body and a Zod
 *    schema for response validation.
 *  - `onSuccess` dispatches to Redux `authSlice` via `useAppDispatch()` for
 *    synchronous access by route guards.
 *  - `useSession` syncs server state → Redux via `useEffect` (RQ v5 removed
 *    query-level side-effect callbacks).
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { UseMutationResult } from '@tanstack/react-query';
import { useEffect } from 'react';
import { type z } from 'zod';


import { clearAuth, saveAuth } from '@/features/auth/slice/authPersistence';
import { authActions } from '@/features/auth/slice/authSlice';
import { useApiClient } from '@/shared/api/ApiClientContext';
import { ApiError, apiErrorMessage } from '@/shared/api/errors';
import type {
  ForgotPasswordInput,
  ForgotPasswordResponse,
  LoginInput,
  ResetPasswordInput,
  Session,
  SignupInput,
} from '@/shared/types/user';
import {
  AuthResponseSchema,
  ForgotPasswordResponseSchema,
  SessionCheckSchema,
} from '@/shared/types/user';
import { useAppDispatch } from '@/store/hooks';

// ═══════════════════════════════════════════════════════════════════════════
// Query key factory
// ═══════════════════════════════════════════════════════════════════════════

/**
 * React Query key factory for auth domain.
 * Provides type-safe key generation for cache invalidation.
 *
 * @example
 * ```ts
 * authKeys.all        // ['auth']
 * authKeys.session()  // ['auth', 'session']
 * ```
 */
export const authKeys = {
  all: ['auth'] as const,
  session: () => ['auth', 'session'] as const,
} as const;

// ═══════════════════════════════════════════════════════════════════════════
// Hook result interfaces
// ═══════════════════════════════════════════════════════════════════════════

/** Return type of {@link useLogin}. */
export interface UseLoginResult {
  readonly login: UseMutationResult<Session, Error, LoginInput>;
}

/** Return type of {@link useSignup}. */
export interface UseSignupResult {
  readonly signup: UseMutationResult<Session, Error, SignupInput>;
}

/** Return type of {@link useLogout}. */
export interface UseLogoutResult {
  readonly logout: UseMutationResult<void, Error, void>;
}

/** Return type of {@link useResetPassword}. */
export interface UseResetPasswordResult {
  readonly resetPassword: UseMutationResult<Session, Error, ResetPasswordInput>;
}

/** Return type of {@link useForgotPassword}. */
export interface UseForgotPasswordResult {
  readonly forgotPassword: UseMutationResult<ForgotPasswordResponse, Error, ForgotPasswordInput>;
}

/** Return type of {@link useSession}. */
export interface UseSessionResult {
  readonly data: Session | undefined;
  readonly isLoading: boolean;
  readonly isError: boolean;
  readonly error: Error | null;
  readonly refetch: () => Promise<unknown>;
}

// ═══════════════════════════════════════════════════════════════════════════
// Mutations
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Login mutation.
 *
 * On success dispatches `loginFulfilled` to Redux and persists the session
 * to localStorage. Components should consume auth state via `useAuth()`.
 */
export function useLogin(): UseLoginResult {
  const apiClient = useApiClient();
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();

  const login = useMutation<Session, Error, LoginInput>({
    mutationFn: async (input: LoginInput): Promise<Session> => {
      const result = await apiClient.request<LoginInput, Session>({
        method: 'POST',
        path: '/api/auth/login',
        body: input,
        schema: AuthResponseSchema,
        skipAuth: true,
      });
      if (!result.ok) throw result.error;
      return result.data;
    },
    onMutate: (): void => {
      dispatch(authActions.loginRequested());
      // Cancel any in-flight anonymous session check so a stale 401
      // response doesn't revert Redux after login completes.
      void queryClient.cancelQueries({ queryKey: authKeys.session() });
    },
    onSuccess: (session: Session): void => {
      dispatch(authActions.loginFulfilled(session));
      saveAuth(session);
      // Refetch the session query with the new token so server state
      // is synced into Redux via the rehydrate effect.
      queryClient.invalidateQueries({ queryKey: authKeys.session() });
    },
    onError: (error: Error): void => {
      // RQv5 passes the thrown value to onError; guard against non-Error.
      const message = error instanceof ApiError
        ? apiErrorMessage(error)
        : (typeof error === 'object' && error !== null && 'message' in error)
          ? (error as { message: string }).message
          : 'Login failed.';
      dispatch(authActions.authFailed({ message, user: null }));
    },
  });

  return { login };
}

/**
 * Signup mutation.
 *
 * Creates a new account and returns a session (auto-login after signup).
 * On success dispatches `loginFulfilled` to Redux and persists the session.
 */
export function useSignup(): UseSignupResult {
  const apiClient = useApiClient();
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();

  const signup = useMutation<Session, Error, SignupInput>({
    mutationFn: async (input: SignupInput): Promise<Session> => {
      const result = await apiClient.request<SignupInput, Session>({
        method: 'POST',
        path: '/api/auth/signup',
        body: input,
        schema: AuthResponseSchema,
        skipAuth: true,
      });
      if (!result.ok) throw result.error;
      return result.data;
    },
    onMutate: (): void => {
      dispatch(authActions.loginRequested());
      void queryClient.cancelQueries({ queryKey: authKeys.session() });
    },
    onSuccess: (session: Session): void => {
      dispatch(authActions.loginFulfilled(session));
      saveAuth(session);
      queryClient.invalidateQueries({ queryKey: authKeys.session() });
    },
    onError: (error: Error): void => {
      const message = error instanceof ApiError
        ? apiErrorMessage(error)
        : (typeof error === 'object' && error !== null && 'message' in error)
          ? (error as { message: string }).message
          : 'Login failed.';
      dispatch(authActions.authFailed({ message, user: null }));
    },
  });

  return { signup };
}

/**
 * Logout mutation — best-effort network call.
 *
 * Local state (Redux + localStorage) is always cleared regardless of
 * the server response via `onSettled`. Auth queries are invalidated to
 * force a fresh state on next mount.
 */
export function useLogout(): UseLogoutResult {
  const apiClient = useApiClient();
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();

  const logout = useMutation<void, Error, void>({
    mutationFn: async (): Promise<void> => {
      try {
        const result = await apiClient.request({
          method: 'POST',
          path: '/api/auth/logout',
        });
        if (!result.ok) {
          // Log but don't throw — local state is cleared regardless.
           
          console.warn('Logout API returned error:', result.error.message);
        }
      } catch {
        // Best-effort — network errors should not prevent local logout.
      }
    },
    onSettled: (): void => {
      dispatch(authActions.logout());
      clearAuth();
      // Invalidate all auth queries so they refetch with no credentials.
      queryClient.invalidateQueries({ queryKey: authKeys.all });
    },
  });

  return { logout };
}

/**
 * Reset-password mutation.
 *
 * Validates the reset token + new password on the server and returns a
 * fresh session (user is logged in after successful reset).
 */
export function useResetPassword(): UseResetPasswordResult {
  const apiClient = useApiClient();
  const dispatch = useAppDispatch();

  const resetPassword = useMutation<Session, Error, ResetPasswordInput>({
    mutationFn: async (input: ResetPasswordInput): Promise<Session> => {
      const result = await apiClient.request<ResetPasswordInput, Session>({
        method: 'POST',
        path: '/api/auth/reset-password',
        body: input,
        schema: AuthResponseSchema,
        skipAuth: true,
      });
      if (!result.ok) throw result.error;
      return result.data;
    },
    onSuccess: (session: Session): void => {
      dispatch(authActions.loginFulfilled(session));
      saveAuth(session);
    },
    onError: (error: Error): void => {
      const message = error instanceof ApiError
        ? apiErrorMessage(error)
        : (typeof error === 'object' && error !== null && 'message' in error)
          ? (error as { message: string }).message
          : 'Login failed.';
      dispatch(authActions.authFailed({ message, user: null }));
    },
  });

  return { resetPassword };
}

/**
 * Forgot-password mutation.
 *
 * Triggers a password-reset email. The server always returns 200 to
 * prevent email enumeration. No Redux state changes.
 */
export function useForgotPassword(): UseForgotPasswordResult {
  const apiClient = useApiClient();

  const forgotPassword = useMutation<ForgotPasswordResponse, Error, ForgotPasswordInput>({
    mutationFn: async (input: ForgotPasswordInput): Promise<ForgotPasswordResponse> => {
      const result = await apiClient.request({
        method: 'POST',
        path: '/api/auth/forgot-password',
        body: input,
        schema: ForgotPasswordResponseSchema,
        skipAuth: true,
      });
      if (!result.ok) throw result.error;
      return result.data;
    },
  });

  return { forgotPassword };
}

// ═══════════════════════════════════════════════════════════════════════════
// Queries
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Session query — checks the current server-side session.
 *
 * Intended to be mounted once in `<SessionCheck>` inside `AppShell`.
 * Syncs to Redux so route guards (`RequireAuth`, `RedirectIfAuth`) can
 * read auth state synchronously without awaiting the query.
 *
 * **Side effects:**
 *  - `data` → dispatches `rehydrate` to Redux
 *  - `unauthorized` error → dispatches `sessionExpired` to Redux
 *
 * @param staleTime — 5 minutes by default; background refetch never blocks
 *                    the UI because Redux holds the synchronous cache.
 */
export function useSession(): UseSessionResult {
  const apiClient = useApiClient();
  const dispatch = useAppDispatch();

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<Session>({
    queryKey: authKeys.session(),
    queryFn: async ({ signal }): Promise<Session> => {
      const result = await apiClient.request<void, z.infer<typeof SessionCheckSchema>>({
        method: 'GET',
        path: '/api/auth/session',
        schema: SessionCheckSchema,
        signal,
      });
      if (!result.ok) throw result.error;
      // Server returns { user, session: { id, expiresAt } } — no token.
      // Merge with existing token from Redux (hydrated from localStorage)
      // to construct a complete Session for downstream consumers.
      const state = (await import('@/store/index')).store.getState();
      const existingToken = state.auth.kind === 'authenticated' ? state.auth.session.token : '';
      return {
        id: result.data.session.id,
        user: result.data.user,
        token: existingToken,
        expiresAt: result.data.session.expiresAt,
      };
    },
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  // ── Side effects: sync React Query → Redux ──────────────────────────
  // RQ v5 removed onSuccess/onError from useQuery. useEffect is the
  // canonical replacement for side effects derived from query state.

  useEffect(() => {
    if (data) {
      dispatch(authActions.rehydrate(data));
    }
  }, [data, dispatch]);

  useEffect(() => {
    if (isError && error instanceof ApiError && error.kind === 'unauthorized') {
      dispatch(authActions.sessionExpired());
    }
  }, [isError, error, dispatch]);

  return {
    data,
    isLoading,
    isError,
    error: error ?? null,
    refetch,
  };
}
