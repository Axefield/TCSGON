/**
 * useAuth — auth state and actions for any component.
 *
 * @see docs/plans/phase-1-core-infrastructure.md §11, §9 (Risk 9)
 *
 * Composite hook over authSlice selectors + action dispatchers.
 * Selectors compute during render — never `useEffect` for derived state.
 *
 * Usage:
 * ```tsx
 * const { status, user, login, logout } = useAuth();
 * if (status === 'authenticated') return <Dashboard />;
 * ```
 */
import { useCallback } from 'react';

import type { AuthState } from '@/features/auth/authState';
import {
  authActions,
  selectAuthError,
  selectAuthState,
  selectCurrentUser,
  selectIsAuthenticated,
} from '@/features/auth/slice/authSlice';
import { useApiClient } from '@/shared/api/ApiClientContext';
import { SessionSchema, type LoginInput, type Session, type User } from '@/shared/types/user';
import { useAppDispatch, useAppSelector } from '@/store/hooks';

/**
 * Minimal login function type — can be swapped to a full RQ mutation later.
 * At this stage we dispatch synchronously; real network calls land in Commit 5.
 */
export type LoginFn = (input: LoginInput) => Promise<void>;
export type LogoutFn = () => Promise<void>;
export type RefreshFn = () => Promise<void>;

export interface UseAuthResult {
  readonly status: AuthState['kind'];
  readonly user: User | null;
  readonly session: Session | null;
  readonly error: string | null;
  readonly isAuthenticated: boolean;
  readonly login: LoginFn;
  readonly logout: LogoutFn;
  readonly refresh: RefreshFn;
}

export function useAuth(): UseAuthResult {
  const state = useAppSelector(selectAuthState);
  const user = useAppSelector(selectCurrentUser);
  const error = useAppSelector(selectAuthError);
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const dispatch = useAppDispatch();
  const apiClient = useApiClient();

  const login = useCallback(
    async (input: LoginInput): Promise<void> => {
      dispatch(authActions.loginRequested());
      try {
        const result = await apiClient.request({
          method: 'POST',
          path: '/api/auth/login',
          body: input,
        });
        if (result.ok) {
          const parsed = SessionSchema.safeParse(result.data);
          if (parsed.success) {
            dispatch(authActions.loginFulfilled(parsed.data));
          } else {
            dispatch(
              authActions.authFailed({
                message: 'Invalid session response.',
                user: null,
              }),
            );
          }
        } else {
          dispatch(
            authActions.authFailed({
              message: result.error.message,
              user: null,
            }),
          );
        }
      } catch (err) {
        dispatch(
          authActions.authFailed({
            message: err instanceof Error ? err.message : 'Login failed.',
            user: null,
          }),
        );
      }
    },
    [dispatch, apiClient],
  );

  const logout = useCallback(async (): Promise<void> => {
    try {
      await apiClient.request({ method: 'POST', path: '/api/auth/logout' });
    } catch {
      // Best-effort — clear local state regardless.
    }
    dispatch(authActions.logout());
  }, [dispatch, apiClient]);

  const refresh = useCallback(async (): Promise<void> => {
    try {
      const result = await apiClient.request({ method: 'GET', path: '/api/auth/session' });
      if (result.ok) {
        const parsed = SessionSchema.safeParse(result.data);
        if (parsed.success) {
          dispatch(authActions.rehydrate(parsed.data));
        } else {
          dispatch(authActions.sessionExpired());
        }
      } else if (result.error.kind === 'unauthorized') {
        dispatch(authActions.sessionExpired());
      }
    } catch {
      dispatch(authActions.sessionExpired());
    }
  }, [dispatch, apiClient]);

  return {
    status: state.kind,
    user,
    session: state.kind === 'authenticated' ? state.session : null,
    error,
    isAuthenticated,
    login,
    logout,
    refresh,
  };
}
