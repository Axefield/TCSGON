/**
 * Tests for user API hooks (useProfileQuery, useUpdateProfile, useChangePassword,
 * useNotificationPreferences, useUpdateNotificationPreferences).
 *
 * @phase Phase 6 — Testing & A11y Hardening
 * @see docs/plans/phase-3-authentication.md
 * @see docs/plans/phase-5-settings.md
 */
import { configureStore } from '@reduxjs/toolkit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { type ReactNode } from 'react';
import { Provider as ReduxProvider } from 'react-redux';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { authReducer } from '@/features/auth/slice/authSlice';
import { ApiClientProvider } from '@/shared/api/ApiClientContext';
import { createApiClient } from '@/shared/api/client';
import { buildFetchResponse } from '@/shared/test/mockFetch';
import { uiReducer } from '@/store/slices/uiSlice';

import {
  useChangePassword,
  useNotificationPreferences,
  useProfileQuery,
  useUpdateNotificationPreferences,
  useUpdateProfile,
} from './userApi';

const testApiClient = createApiClient({ baseUrl: '/api' });

function createTestStore() {
  return configureStore({
    reducer: { auth: authReducer, ui: uiReducer },
    middleware: (getDefault) => getDefault(),
  });
}

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

const MOCK_PROFILE = {
  id: 'u-1',
  name: 'Alice',
  email: 'alice@example.com',
  avatarUrl: 'https://example.com/avatar.png',
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-06-01T00:00:00Z',
};

const MOCK_PREFERENCES = {
  id: 'pref-1',
  userId: 'u-1',
  emailNotifications: true,
  pushNotifications: false,
  inAppNotifications: true,
  dailyDigest: true,
  marketingEmails: false,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-06-01T00:00:00Z',
};

// ═══════════════════════════════════════════════════════════════════════════
// useProfileQuery
// ═══════════════════════════════════════════════════════════════════════════

describe('useProfileQuery', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns loading state initially', () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      buildFetchResponse(MOCK_PROFILE),
    );

    const { result } = renderHook(() => useProfileQuery(), { wrapper: createWrapper() });

    expect(result.current.isLoading).toBe(true);
    expect(result.current.profile).toBeUndefined();
    expect(result.current.isError).toBe(false);
  });

  it('returns profile on success', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      buildFetchResponse(MOCK_PROFILE),
    );

    const { result } = renderHook(() => useProfileQuery(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.isError).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.profile).toBeDefined();
    expect(result.current.profile?.name).toBe('Alice');
    expect(result.current.profile?.email).toBe('alice@example.com');
  });

  it('returns error state on server failure', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      buildFetchResponse({ error: 'Server error' }, { status: 500 }),
    );

    const { result } = renderHook(() => useProfileQuery(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.isError).toBe(true);
    expect(result.current.error).not.toBeNull();
    expect(result.current.profile).toBeUndefined();
  });

  it('handles 401 unauthorized', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      buildFetchResponse({ error: 'Unauthorized' }, { status: 401 }),
    );

    const { result } = renderHook(() => useProfileQuery(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.isError).toBe(true);
  });

  it('handles network error', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useProfileQuery(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.isError).toBe(true);
  });

  it('refetches when refetch is called', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    fetchSpy.mockResolvedValue(buildFetchResponse(MOCK_PROFILE));

    const { result } = renderHook(() => useProfileQuery(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(fetchSpy).toHaveBeenCalledTimes(1);

    await result.current.refetch();
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// useUpdateProfile
// ═══════════════════════════════════════════════════════════════════════════

describe('useUpdateProfile', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('updates profile successfully', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      buildFetchResponse({
        id: 'u-1',
        name: 'Alice Updated',
        email: 'alice@example.com',
        avatarUrl: null,
      }),
    );

    const { result } = renderHook(() => useUpdateProfile(), { wrapper: createWrapper() });

    result.current.updateProfile.mutate({
      name: 'Alice Updated',
      email: 'alice@example.com',
    });

    await waitFor(() => expect(result.current.updateProfile.isSuccess).toBe(true));
    expect(result.current.updateProfile.data?.name).toBe('Alice Updated');
  });

  it('returns error on validation failure', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      buildFetchResponse({ error: 'Validation failed' }, { status: 422 }),
    );

    const { result } = renderHook(() => useUpdateProfile(), { wrapper: createWrapper() });

    result.current.updateProfile.mutate({
      name: '',
      email: 'invalid',
    });

    await waitFor(() => expect(result.current.updateProfile.isError).toBe(true));
  });

  it('returns error on server failure', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      buildFetchResponse({ error: 'Server error' }, { status: 500 }),
    );

    const { result } = renderHook(() => useUpdateProfile(), { wrapper: createWrapper() });

    result.current.updateProfile.mutate({
      name: 'Alice',
      email: 'alice@example.com',
    });

    await waitFor(() => expect(result.current.updateProfile.isError).toBe(true));
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// useChangePassword
// ═══════════════════════════════════════════════════════════════════════════

describe('useChangePassword', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('changes password successfully', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      buildFetchResponse({ message: 'Password changed successfully' }),
    );

    const { result } = renderHook(() => useChangePassword(), { wrapper: createWrapper() });

    result.current.changePassword.mutate({
      currentPassword: 'OldP@ss1',
      newPassword: 'NewP@ss1',
    });

    await waitFor(() => expect(result.current.changePassword.isSuccess).toBe(true));
    expect(result.current.changePassword.data?.message).toContain('success');
  });

  it('returns error on wrong current password', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      buildFetchResponse({ error: 'Current password is incorrect' }, { status: 401 }),
    );

    const { result } = renderHook(() => useChangePassword(), { wrapper: createWrapper() });

    result.current.changePassword.mutate({
      currentPassword: 'WrongP@ss1',
      newPassword: 'NewP@ss1',
    });

    await waitFor(() => expect(result.current.changePassword.isError).toBe(true));
  });

  it('returns error on weak new password', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      buildFetchResponse({ error: 'New password does not meet strength requirements' }, { status: 422 }),
    );

    const { result } = renderHook(() => useChangePassword(), { wrapper: createWrapper() });

    result.current.changePassword.mutate({
      currentPassword: 'OldP@ss1',
      newPassword: 'weak',
    });

    await waitFor(() => expect(result.current.changePassword.isError).toBe(true));
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// useNotificationPreferences
// ═══════════════════════════════════════════════════════════════════════════

describe('useNotificationPreferences', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns loading state initially', () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      buildFetchResponse(MOCK_PREFERENCES),
    );

    const { result } = renderHook(() => useNotificationPreferences(), { wrapper: createWrapper() });

    expect(result.current.isLoading).toBe(true);
    expect(result.current.preferences).toBeUndefined();
  });

  it('returns preferences on success', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      buildFetchResponse(MOCK_PREFERENCES),
    );

    const { result } = renderHook(() => useNotificationPreferences(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.isError).toBe(false);
    expect(result.current.preferences).toBeDefined();
    expect(result.current.preferences?.emailNotifications).toBe(true);
    expect(result.current.preferences?.pushNotifications).toBe(false);
  });

  it('returns error on server failure', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      buildFetchResponse({ error: 'Server error' }, { status: 500 }),
    );

    const { result } = renderHook(() => useNotificationPreferences(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.isError).toBe(true);
    expect(result.current.preferences).toBeUndefined();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// useUpdateNotificationPreferences
// ═══════════════════════════════════════════════════════════════════════════

describe('useUpdateNotificationPreferences', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('updates preferences successfully', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      buildFetchResponse({ ...MOCK_PREFERENCES, emailNotifications: false }),
    );

    const { result } = renderHook(() => useUpdateNotificationPreferences(), { wrapper: createWrapper() });

    result.current.updatePreferences.mutate({ emailNotifications: false });

    await waitFor(() => expect(result.current.updatePreferences.isSuccess).toBe(true));
    expect(result.current.updatePreferences.data?.emailNotifications).toBe(false);
  });

  it('returns error on server failure', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      buildFetchResponse({ error: 'Server error' }, { status: 500 }),
    );

    const { result } = renderHook(() => useUpdateNotificationPreferences(), { wrapper: createWrapper() });

    result.current.updatePreferences.mutate({ emailNotifications: false });

    await waitFor(() => expect(result.current.updatePreferences.isError).toBe(true));
  });
});
