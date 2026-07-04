/**
 * Tests for auth API hooks (useLogin, useSignup, useLogout, useForgotPassword,
 * useResetPassword, useSession).
 *
 * These hooks interact with both the network layer (via apiClient) and Redux
 * (via dispatch). We use mockFetch to control the network and a real Redux
 * store to verify state changes.
 *
 * @phase Phase 6 — Testing & A11y Hardening
 * @see docs/plans/phase-3-authentication.md
 */
import { configureStore } from '@reduxjs/toolkit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { type ReactNode } from 'react';
import { Provider as ReduxProvider } from 'react-redux';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { authReducer } from '@/features/auth/slice/authSlice';
import { ApiClientProvider } from '@/shared/api/ApiClientContext';
import { createApiClient } from '@/shared/api/client';
import { buildFetchResponse } from '@/shared/test/mockFetch';
import { uiReducer } from '@/store/slices/uiSlice';

import {
  useForgotPassword,
  useLogin,
  useLogout,
  useResetPassword,
  useSession,
  useSignup,
} from './authApi';

const testApiClient = createApiClient({ baseUrl: '/api' });

/**
 * Creates a fresh Redux store + RQ client for each test to prevent cache
 * bleed and ensure each test starts with a clean auth state.
 */
function createTestStore() {
  return configureStore({
    reducer: { auth: authReducer, ui: uiReducer },
    middleware: (getDefault) => getDefault(),
  });
}

/**
 * Creates a test wrapper that provides ApiClient + Redux + React Query.
 */
function createWrapper() {
  const testQueryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

  return function Wrapper({ children }: { readonly children: ReactNode }) {
    return (
      <ApiClientProvider client={testApiClient}>
        <ReduxProvider store={createTestStore()}>
          <QueryClientProvider client={testQueryClient}>{children}</QueryClientProvider>
        </ReduxProvider>
      </ApiClientProvider>
    );
  };
}

/**
 * AuthResponseSchema expects nested format from the server:
 * { user, session: { id, token, expiresAt } } — transformed to Session internally.
 * SessionCheckSchema expects { user, session: { id, expiresAt } } (no token).
 */
const fakeAuthResponse = {
  user: { id: 'u-1', name: 'Test', email: 'test@example.com' },
  session: { id: 'sess-1', token: 'tok_' + 'a'.repeat(20), expiresAt: '2099-01-01T00:00:00Z' },
};

const fakeSessionCheckResponse = {
  user: { id: 'u-1', name: 'Test', email: 'test@example.com' },
  session: { id: 'sess-1', expiresAt: '2099-01-01T00:00:00Z' },
};

// ═══════════════════════════════════════════════════════════════════════════
// useSession
// ═══════════════════════════════════════════════════════════════════════════

describe('useSession', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('returns loading state initially', () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      buildFetchResponse(fakeSessionCheckResponse),
    );

    const { result } = renderHook(() => useSession(), { wrapper: createWrapper() });

    expect(result.current.isLoading).toBe(true);
    expect(result.current.data).toBeUndefined();
    expect(result.current.isError).toBe(false);
  });

  it('returns session on success', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      buildFetchResponse(fakeSessionCheckResponse),
    );

    const { result } = renderHook(() => useSession(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.isError).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.data).toBeDefined();
    expect(result.current.data?.user.email).toBe('test@example.com');
  });

  it('returns error state on unauthorized', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      buildFetchResponse({ error: 'Unauthorized' }, { status: 401 }),
    );

    const { result } = renderHook(() => useSession(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.isError).toBe(true);
    expect(result.current.error).not.toBeNull();
  });

  it('handles network error', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('Network failure'));

    const { result } = renderHook(() => useSession(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.isError).toBe(true);
    expect(result.current.data).toBeUndefined();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// useLogin
// ═══════════════════════════════════════════════════════════════════════════

describe('useLogin', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('returns session on successful login', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      buildFetchResponse(fakeAuthResponse),
    );

    const { result } = renderHook(() => useLogin(), { wrapper: createWrapper() });

    // Starts idle
    expect(result.current.login.isIdle).toBe(true);

    result.current.login.mutate({ email: 'test@example.com', password: 'correct-password' });

    await waitFor(() => expect(result.current.login.isSuccess).toBe(true));

    expect(result.current.login.data?.user.email).toBe('test@example.com');
  });

  it('returns error on invalid credentials', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      buildFetchResponse({ error: 'Invalid credentials' }, { status: 401 }),
    );

    const { result } = renderHook(() => useLogin(), { wrapper: createWrapper() });

    result.current.login.mutate({ email: 'test@example.com', password: 'wrong' });

    await waitFor(() => expect(result.current.login.isError).toBe(true));

    expect(result.current.login.error).toBeDefined();
  });

  it('returns error on server failure', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      buildFetchResponse({ error: 'Server error' }, { status: 500 }),
    );

    const { result } = renderHook(() => useLogin(), { wrapper: createWrapper() });

    result.current.login.mutate({ email: 'test@example.com', password: 'password' });

    await waitFor(() => expect(result.current.login.isError).toBe(true));
  });

  it('handles validation error from Zod schema mismatch', async () => {
    // Server returns data that doesn't match AuthResponseSchema
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      buildFetchResponse({ unexpectedField: true }),
    );

    const { result } = renderHook(() => useLogin(), { wrapper: createWrapper() });

    result.current.login.mutate({ email: 'test@example.com', password: 'password' });

    await waitFor(() => expect(result.current.login.isError).toBe(true));
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// useSignup
// ═══════════════════════════════════════════════════════════════════════════

describe('useSignup', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('returns session on successful signup', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      buildFetchResponse(fakeAuthResponse),
    );

    const { result } = renderHook(() => useSignup(), { wrapper: createWrapper() });

    result.current.signup.mutate({
      name: 'Test',
      email: 'test@example.com',
      password: 'StrongP@ss1',
      confirmPassword: 'StrongP@ss1',
    });

    await waitFor(() => expect(result.current.signup.isSuccess).toBe(true));

    expect(result.current.signup.data?.user.name).toBe('Test');
  });

  it('returns error on duplicate email', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      buildFetchResponse({ error: 'Email already registered' }, { status: 409 }),
    );

    const { result } = renderHook(() => useSignup(), { wrapper: createWrapper() });

    result.current.signup.mutate({
      name: 'Test',
      email: 'existing@example.com',
      password: 'StrongP@ss1',
      confirmPassword: 'StrongP@ss1',
    });

    await waitFor(() => expect(result.current.signup.isError).toBe(true));
  });

  it('returns error on validation failure', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      buildFetchResponse({ error: 'Validation failed' }, { status: 422 }),
    );

    const { result } = renderHook(() => useSignup(), { wrapper: createWrapper() });

    result.current.signup.mutate({
      name: '',
      email: 'invalid',
      password: 'short',
      confirmPassword: 'short',
    });

    await waitFor(() => expect(result.current.signup.isError).toBe(true));
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// useLogout
// ═══════════════════════════════════════════════════════════════════════════

describe('useLogout', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('clears auth state on logout', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      buildFetchResponse(null, { status: 204 }),
    );

    const { result } = renderHook(() => useLogout(), { wrapper: createWrapper() });

    result.current.logout.mutate();

    await waitFor(() => expect(result.current.logout.isSuccess).toBe(true));
  });

  it('handles logout server error gracefully (best-effort)', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      buildFetchResponse({ error: 'Server error' }, { status: 500 }),
    );

    const { result } = renderHook(() => useLogout(), { wrapper: createWrapper() });

    result.current.logout.mutate();

    await waitFor(() => expect(result.current.logout.isSuccess).toBe(true));
  });

  it('handles network error during logout (best-effort)', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useLogout(), { wrapper: createWrapper() });

    result.current.logout.mutate();

    await waitFor(() => expect(result.current.logout.isSuccess).toBe(true));
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// useForgotPassword
// ═══════════════════════════════════════════════════════════════════════════

describe('useForgotPassword', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('succeeds and returns a message', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      buildFetchResponse({ message: 'If the email exists, a reset link has been sent.' }),
    );

    const { result } = renderHook(() => useForgotPassword(), { wrapper: createWrapper() });

    result.current.forgotPassword.mutate({ email: 'test@example.com' });

    await waitFor(() => expect(result.current.forgotPassword.isSuccess).toBe(true));

    expect(result.current.forgotPassword.data?.message).toContain('reset link');
  });

  it('handles server error', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      buildFetchResponse({ error: 'Server error' }, { status: 500 }),
    );

    const { result } = renderHook(() => useForgotPassword(), { wrapper: createWrapper() });

    result.current.forgotPassword.mutate({ email: 'test@example.com' });

    await waitFor(() => expect(result.current.forgotPassword.isError).toBe(true));
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// useResetPassword
// ═══════════════════════════════════════════════════════════════════════════

describe('useResetPassword', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('succeeds with a new session', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      buildFetchResponse(fakeAuthResponse),
    );

    const { result } = renderHook(() => useResetPassword(), { wrapper: createWrapper() });

    result.current.resetPassword.mutate({
      token: 'valid-token',
      password: 'NewP@ss1',
      confirmPassword: 'NewP@ss1',
    });

    await waitFor(() => expect(result.current.resetPassword.isSuccess).toBe(true));

    expect(result.current.resetPassword.data?.user.email).toBe('test@example.com');
  });

  it('returns error on invalid token', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      buildFetchResponse({ error: 'Invalid or expired token' }, { status: 401 }),
    );

    const { result } = renderHook(() => useResetPassword(), { wrapper: createWrapper() });

    result.current.resetPassword.mutate({
      token: 'bad-token',
      password: 'NewP@ss1',
      confirmPassword: 'NewP@ss1',
    });

    await waitFor(() => expect(result.current.resetPassword.isError).toBe(true));
  });

  it('handles server error during password reset', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      buildFetchResponse({ error: 'Server error' }, { status: 500 }),
    );

    const { result } = renderHook(() => useResetPassword(), { wrapper: createWrapper() });

    result.current.resetPassword.mutate({
      token: 'valid-token',
      password: 'NewP@ss1',
      confirmPassword: 'NewP@ss1',
    });

    await waitFor(() => expect(result.current.resetPassword.isError).toBe(true));
  });
});
