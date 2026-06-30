/**
 * useAuth hook tests.
 *
 * Behavior tests — asserts dispatched actions and returned state,
 * never internal implementation details.
 *
 * @see docs/plans/phase-1-core-infrastructure.md §9, §11, §51, §57
 */
import { configureStore } from '@reduxjs/toolkit';
import { act, renderHook, waitFor } from '@testing-library/react';
import type { ReactElement, ReactNode } from 'react';
import { Provider as ReduxProvider } from 'react-redux';
import { describe, expect, it, vi } from 'vitest';

import { authReducer } from '@/features/auth/slice/authSlice';
import { ApiClientProvider } from '@/shared/api/ApiClientContext';
import type { ApiClient } from '@/shared/api/client';
import { ApiError } from '@/shared/api/errors';
import type { AuthState } from '@/features/auth/authState';
import { asSessionId, asUserId } from '@/shared/types/brand';
import type { Session } from '@/shared/types/user';

import { useAuth } from './useAuth';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Create a Redux store containing only the auth slice. */
function createStore(preloadedState?: { auth: AuthState }) {
  return configureStore({
    reducer: { auth: authReducer },
    preloadedState,
  });
}

/** Create a mock ApiClient with a controllable `request` spy. */
function createMockClient(
  requestImpl: (...args: Parameters<ApiClient['request']>) => ReturnType<ApiClient['request']>,
): ApiClient {
  const request = vi.fn<typeof requestImpl>(requestImpl);
  return { request, setBaseUrl: vi.fn() };
}

/** Dummy that does nothing — used in selector-only tests. */
const nullClient = createMockClient(async () => ({ ok: false as const, error: new ApiError({ kind: 'network', message: 'unused', correlationId: 'test' }) }));

interface WrapperOptions {
  readonly auth?: AuthState;
  readonly client: ApiClient;
}

/** Build a renderHook wrapper with Redux + ApiClient providers. */
function createWrapper({ auth, client }: WrapperOptions) {
  const store = createStore(auth ? { auth } : undefined);
  return function Wrapper({ children }: { children: ReactNode }): ReactElement {
    return (
      <ReduxProvider store={store}>
        <ApiClientProvider client={client}>{children}</ApiClientProvider>
      </ReduxProvider>
    );
  };
}

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const testUserId = asUserId('u-1');
const testSessionId = asSessionId('sess-1');

const testUser = { id: testUserId, name: 'Alice', email: 'alice@example.com' };
const testSession: Session = {
  id: testSessionId,
  user: testUser,
  token: 'x'.repeat(20),
  expiresAt: '2099-06-01T00:00:00.000Z',
};

/** Raw data that passes SessionSchema.safeParse — before zod transforms. */
const validSessionData = {
  id: 'sess-1',
  user: { id: 'u-1', name: 'Alice', email: 'alice@example.com' },
  token: 'x'.repeat(20),
  expiresAt: '2099-06-01T00:00:00.000Z',
};

const loginInput = { email: 'alice@example.com', password: 'welcome1welcome1' };

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useAuth', () => {
  // -----------------------------------------------------------------------
  // login()
  // -----------------------------------------------------------------------

  describe('login', () => {
    it('dispatches loginRequested then loginFulfilled on success', async () => {
      const request = vi.fn<(...args: Parameters<ApiClient['request']>) => ReturnType<ApiClient['request']>>().mockResolvedValue({
        ok: true as const,
        data: validSessionData,
        status: 200,
      });
      const wrapper = createWrapper({ client: { request, setBaseUrl: vi.fn() } });
      const { result } = renderHook(() => useAuth(), { wrapper });

      expect(result.current.status).toBe('anonymous');

      await act(async () => {
        await result.current.login(loginInput);
      });

      expect(request).toHaveBeenCalledWith({
        method: 'POST',
        path: '/api/auth/login',
        body: loginInput,
      });
      await waitFor(() => {
        expect(result.current.status).toBe('authenticated');
      });
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.user).toEqual(testUser);
      expect(result.current.session).toEqual(testSession);
      expect(result.current.error).toBeNull();
    });

    it('dispatches authFailed on API error (result.ok === false)', async () => {
      const request = vi.fn<(...args: Parameters<ApiClient['request']>) => ReturnType<ApiClient['request']>>().mockResolvedValue({
        ok: false as const,
        error: new ApiError({
          kind: 'http',
          status: 400,
          body: null,
          message: 'Invalid credentials.',
          correlationId: 'test',
        }),
      });
      const wrapper = createWrapper({ client: { request, setBaseUrl: vi.fn() } });
      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        await result.current.login(loginInput);
      });

      await waitFor(() => {
        expect(result.current.status).toBe('error');
      });
      expect(result.current.error).toBe('Invalid credentials.');
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBeNull();
    });

    it('dispatches authFailed on thrown exception', async () => {
      const request = vi.fn<(...args: Parameters<ApiClient['request']>) => ReturnType<ApiClient['request']>>().mockRejectedValue(
        new Error('Network failure'),
      );
      const wrapper = createWrapper({ client: { request, setBaseUrl: vi.fn() } });
      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        await result.current.login(loginInput);
      });

      await waitFor(() => {
        expect(result.current.status).toBe('error');
      });
      expect(result.current.error).toBe('Network failure');
    });

    it('dispatches authFailed with generic message on non-Error thrown value', async () => {
      const request = vi.fn<(...args: Parameters<ApiClient['request']>) => ReturnType<ApiClient['request']>>().mockRejectedValue(
        'string error',
      );
      const wrapper = createWrapper({ client: { request, setBaseUrl: vi.fn() } });
      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        await result.current.login(loginInput);
      });

      await waitFor(() => {
        expect(result.current.status).toBe('error');
      });
      expect(result.current.error).toBe('Login failed.');
    });

    it('dispatches authFailed when session parse fails after ok response', async () => {
      const request = vi.fn<(...args: Parameters<ApiClient['request']>) => ReturnType<ApiClient['request']>>().mockResolvedValue({
        ok: true as const,
        data: { incomplete: true },
        status: 200,
      });
      const wrapper = createWrapper({ client: { request, setBaseUrl: vi.fn() } });
      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        await result.current.login(loginInput);
      });

      await waitFor(() => {
        expect(result.current.status).toBe('error');
      });
      expect(result.current.error).toBe('Invalid session response.');
    });

    it('transitions through authenticating state before resolving', async () => {
      let resolvePromise!: (value: unknown) => void;
      const request = vi.fn<(...args: Parameters<ApiClient['request']>) => ReturnType<ApiClient['request']>>().mockReturnValue(
        new Promise((resolve) => {
          resolvePromise = resolve;
        }),
      );
      const wrapper = createWrapper({ client: { request, setBaseUrl: vi.fn() } });
      const { result } = renderHook(() => useAuth(), { wrapper });

      // Start login (synchronous dispatch of loginRequested happens first).
      let loginPromise: Promise<void>;
      await act(async () => {
        loginPromise = result.current.login(loginInput);
      });

      // After the synchronous dispatch the store should show authenticating.
      await waitFor(() => {
        expect(result.current.status).toBe('authenticating');
      });

      // Resolve the API call and wait for the async function to complete.
      await act(async () => {
        resolvePromise({ ok: true as const, data: validSessionData, status: 200 });
        await loginPromise;
      });

      await waitFor(() => {
        expect(result.current.status).toBe('authenticated');
      });
    });
  });

  // -----------------------------------------------------------------------
  // logout()
  // -----------------------------------------------------------------------

  describe('logout', () => {
    it('dispatches logout on API success', async () => {
      const request = vi.fn<(...args: Parameters<ApiClient['request']>) => ReturnType<ApiClient['request']>>().mockResolvedValue({
        ok: true as const,
        data: undefined,
        status: 204,
      });
      const wrapper = createWrapper({ client: { request, setBaseUrl: vi.fn() } });
      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        await result.current.logout();
      });

      expect(request).toHaveBeenCalledWith({
        method: 'POST',
        path: '/api/auth/logout',
      });
      await waitFor(() => {
        expect(result.current.status).toBe('anonymous');
      });
      expect(result.current.isAuthenticated).toBe(false);
    });

    it('dispatches logout on API error (best-effort)', async () => {
      const request = vi.fn<(...args: Parameters<ApiClient['request']>) => ReturnType<ApiClient['request']>>().mockRejectedValue(
        new Error('Server is down'),
      );
      const wrapper = createWrapper({ client: { request, setBaseUrl: vi.fn() } });
      const { result } = renderHook(() => useAuth(), { wrapper });

      // Should not throw — the catch swallows the error.
      await act(async () => {
        await expect(result.current.logout()).resolves.toBeUndefined();
      });

      await waitFor(() => {
        expect(result.current.status).toBe('anonymous');
      });
      expect(result.current.isAuthenticated).toBe(false);
    });
  });

  // -----------------------------------------------------------------------
  // refresh()
  // -----------------------------------------------------------------------

  describe('refresh', () => {
    it('dispatches rehydrate on valid session', async () => {
      const request = vi.fn<(...args: Parameters<ApiClient['request']>) => ReturnType<ApiClient['request']>>().mockResolvedValue({
        ok: true as const,
        data: validSessionData,
        status: 200,
      });
      const wrapper = createWrapper({ client: { request, setBaseUrl: vi.fn() } });
      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        await result.current.refresh();
      });

      expect(request).toHaveBeenCalledWith({
        method: 'GET',
        path: '/api/auth/session',
      });
      await waitFor(() => {
        expect(result.current.status).toBe('authenticated');
      });
      expect(result.current.session).toEqual(testSession);
    });

    it('dispatches sessionExpired on 401 response', async () => {
      const request = vi.fn<(...args: Parameters<ApiClient['request']>) => ReturnType<ApiClient['request']>>().mockResolvedValue({
        ok: false as const,
        error: new ApiError({
          kind: 'unauthorized',
          message: 'Authentication required.',
          correlationId: 'test',
        }),
      });
      const wrapper = createWrapper({ client: { request, setBaseUrl: vi.fn() } });
      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        await result.current.refresh();
      });

      await waitFor(() => {
        expect(result.current.status).toBe('anonymous');
      });
      expect(result.current.isAuthenticated).toBe(false);
    });

    it('dispatches sessionExpired when session parse fails', async () => {
      const request = vi.fn<(...args: Parameters<ApiClient['request']>) => ReturnType<ApiClient['request']>>().mockResolvedValue({
        ok: true as const,
        data: { bad: 'payload' },
        status: 200,
      });
      const wrapper = createWrapper({ client: { request, setBaseUrl: vi.fn() } });
      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        await result.current.refresh();
      });

      await waitFor(() => {
        expect(result.current.status).toBe('anonymous');
      });
    });

    it('dispatches sessionExpired on exception', async () => {
      const request = vi.fn<(...args: Parameters<ApiClient['request']>) => ReturnType<ApiClient['request']>>().mockRejectedValue(
        new Error('Network error'),
      );
      const wrapper = createWrapper({ client: { request, setBaseUrl: vi.fn() } });
      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        await result.current.refresh();
      });

      await waitFor(() => {
        expect(result.current.status).toBe('anonymous');
      });
    });

    it('does nothing on non-401 non-ok response (silently ignored)', async () => {
      const auth: AuthState = {
        kind: 'authenticated',
        user: testUser,
        session: testSession,
      };
      const request = vi.fn<(...args: Parameters<ApiClient['request']>) => ReturnType<ApiClient['request']>>().mockResolvedValue({
        ok: false as const,
        error: new ApiError({
          kind: 'http',
          status: 500,
          body: null,
          message: 'Server error.',
          correlationId: 'test',
        }),
      });
      const wrapper = createWrapper({ auth, client: { request, setBaseUrl: vi.fn() } });
      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        await result.current.refresh();
      });

      // State should remain authenticated — only 401 triggers sessionExpired.
      await waitFor(() => {
        expect(result.current.status).toBe('authenticated');
      });
    });
  });

  // -----------------------------------------------------------------------
  // Selectors / return values
  // -----------------------------------------------------------------------

  describe('returned state values', () => {
    it('status reflects state.kind', () => {
      const auth: AuthState = { kind: 'authenticating' };
      const wrapper = createWrapper({ auth, client: nullClient });
      const { result } = renderHook(() => useAuth(), { wrapper });

      expect(result.current.status).toBe('authenticating');
    });

    it('session is null when not authenticated', () => {
      const auth: AuthState = { kind: 'anonymous' };
      const wrapper = createWrapper({ auth, client: nullClient });
      const { result } = renderHook(() => useAuth(), { wrapper });

      expect(result.current.session).toBeNull();
    });

    it('session is null when in error state', () => {
      const auth: AuthState = { kind: 'error', error: 'fail', user: null };
      const wrapper = createWrapper({ auth, client: nullClient });
      const { result } = renderHook(() => useAuth(), { wrapper });

      expect(result.current.session).toBeNull();
    });

    it('user is null when anonymous', () => {
      const wrapper = createWrapper({ client: nullClient });
      const { result } = renderHook(() => useAuth(), { wrapper });

      expect(result.current.user).toBeNull();
    });

    it('user is null when authenticating', () => {
      const auth: AuthState = { kind: 'authenticating' };
      const wrapper = createWrapper({ auth, client: nullClient });
      const { result } = renderHook(() => useAuth(), { wrapper });

      expect(result.current.user).toBeNull();
    });

    it('user is available in error state when error has a user', () => {
      const auth: AuthState = { kind: 'error', error: 'Unauthorized', user: testUser };
      const wrapper = createWrapper({ auth, client: nullClient });
      const { result } = renderHook(() => useAuth(), { wrapper });

      expect(result.current.user).toEqual(testUser);
    });

    it('isAuthenticated is true only for authenticated kind', () => {
      const authenticated: AuthState = {
        kind: 'authenticated',
        user: testUser,
        session: testSession,
      };
      const wrapper = createWrapper({ auth: authenticated, client: nullClient });
      const { result } = renderHook(() => useAuth(), { wrapper });

      expect(result.current.isAuthenticated).toBe(true);
    });

    it('isAuthenticated is false for anonymous', () => {
      const wrapper = createWrapper({ client: nullClient });
      const { result } = renderHook(() => useAuth(), { wrapper });

      expect(result.current.isAuthenticated).toBe(false);
    });

    it('isAuthenticated is false for authenticating', () => {
      const auth: AuthState = { kind: 'authenticating' };
      const wrapper = createWrapper({ auth, client: nullClient });
      const { result } = renderHook(() => useAuth(), { wrapper });

      expect(result.current.isAuthenticated).toBe(false);
    });

    it('isAuthenticated is false for error', () => {
      const auth: AuthState = { kind: 'error', error: 'fail', user: null };
      const wrapper = createWrapper({ auth, client: nullClient });
      const { result } = renderHook(() => useAuth(), { wrapper });

      expect(result.current.isAuthenticated).toBe(false);
    });

    it('returns error text in error state', () => {
      const auth: AuthState = { kind: 'error', error: 'Something went wrong', user: null };
      const wrapper = createWrapper({ auth, client: nullClient });
      const { result } = renderHook(() => useAuth(), { wrapper });

      expect(result.current.error).toBe('Something went wrong');
    });

    it('returns null error when not in error state', () => {
      const wrapper = createWrapper({ client: nullClient });
      const { result } = renderHook(() => useAuth(), { wrapper });

      expect(result.current.error).toBeNull();
    });
  });
});
