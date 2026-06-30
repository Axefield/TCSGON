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

import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  authActions,
  selectAuthError,
  selectAuthState,
  selectCurrentUser,
  selectIsAuthenticated,
} from '@/features/auth/slice/authSlice';
import type { AuthState } from '@/features/auth/authState';
import type { LoginInput, Session, User } from '@/shared/types/user';
import type { ApiClient } from '@/shared/api/client';

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

let _apiClient: ApiClient | null = null;

/**
 * Inject the API client for login/logout/refresh calls.
 * Called once at app boot from `main.tsx`.
 */
export function injectAuthApiClient(client: ApiClient): void {
  _apiClient = client;
}

function getClient(): ApiClient {
  if (!_apiClient) {
    throw new Error(
      'injectAuthApiClient() must be called before useAuth() is invoked.',
    );
  }
  return _apiClient;
}

export function useAuth(): UseAuthResult {
  const state = useAppSelector(selectAuthState);
  const user = useAppSelector(selectCurrentUser);
  const error = useAppSelector(selectAuthError);
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const dispatch = useAppDispatch();

  const login = useCallback(
    async (input: LoginInput): Promise<void> => {
      dispatch(authActions.loginRequested());
      try {
        const client = getClient();
        const result = await client.request({
          method: 'POST',
          path: '/api/auth/login',
          body: input,
        });
        if (result.ok) {
          // `result.data` is the session from the API.
          // A Zod schema would validate it; for now we trust the client.
          dispatch(authActions.loginFulfilled(result.data as unknown as Session));
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
    [dispatch],
  );

  const logout = useCallback(async (): Promise<void> => {
    try {
      const client = getClient();
      await client.request({ method: 'POST', path: '/api/auth/logout' });
    } catch {
      // Best-effort — clear local state regardless.
    }
    dispatch(authActions.logout());
  }, [dispatch]);

  const refresh = useCallback(async (): Promise<void> => {
    try {
      const client = getClient();
      const result = await client.request({ method: 'GET', path: '/api/auth/session' });
      if (result.ok) {
        dispatch(authActions.rehydrate(result.data as unknown as Session));
      } else if (result.error.kind === 'unauthorized') {
        dispatch(authActions.sessionExpired());
      }
    } catch {
      dispatch(authActions.sessionExpired());
    }
  }, [dispatch]);

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
