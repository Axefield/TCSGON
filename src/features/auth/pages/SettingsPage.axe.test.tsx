/**
 * axe-core a11y audit — SettingsPage
 *
 * SettingsPage uses Redux (useAuth) and Router (navigate) and fetches
 * profile and notification-preference data on mount. We provide an
 * authenticated store and mock fetch responses so that the populated
 * page (with profile form, password section, and notification toggles)
 * can be audited.
 *
 * @phase Phase 6 — Testing & A11y Hardening
 */

import { configureStore } from '@reduxjs/toolkit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { type ReactElement } from 'react';
import { Provider as ReduxProvider } from 'react-redux';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { AuthState } from '@/features/auth/authState';
import { authReducer } from '@/features/auth/slice/authSlice';
import { ApiClientProvider } from '@/shared/api/ApiClientContext';
import { createApiClient } from '@/shared/api/client';
import { buildFetchResponse } from '@/shared/test/mockFetch';
import { asSessionId, asUserId } from '@/shared/types/brand';
import { uiReducer } from '@/store/slices/uiSlice';
import { testA11y } from '@/test-utils';

import { SettingsPage } from './SettingsPage';

const testBaseUrl = 'http://test.local';
const testApiClient = createApiClient({ baseUrl: testBaseUrl });

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
});

const alice = {
  id: asUserId('user-001'),
  email: 'admin@tcsgon.dev',
  name: 'Admin User',
};

const authedState: AuthState = {
  kind: 'authenticated',
  user: alice,
  session: {
    id: asSessionId('s-1'),
    token: 't'.repeat(20),
    expiresAt: '2027-01-01T00:00:00Z',
    user: alice,
  },
};

const authenticatedStore = configureStore({
  reducer: { auth: authReducer, ui: uiReducer },
  preloadedState: {
    auth: authedState,
    ui: { theme: 'light' as const, sidebar: 'closed' as const, toasts: [], modals: [], reducedMotion: false },
  },
});

const PROFILE_RESPONSE = {
  id: 'user-001',
  email: 'admin@tcsgon.dev',
  name: 'Admin User',
  avatarUrl: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-06-01T00:00:00.000Z',
};

const NOTIFICATION_PREFS_RESPONSE = {
  id: 'np-1',
  userId: 'user-001',
  emailNotifications: true,
  pushNotifications: true,
  inAppNotifications: true,
  dailyDigest: true,
  marketingEmails: false,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-06-01T00:00:00.000Z',
};

function Wrapper(): ReactElement {
  return (
    <ReduxProvider store={authenticatedStore}>
      <QueryClientProvider client={queryClient}>
        <ApiClientProvider client={testApiClient}>
          <MemoryRouter initialEntries={['/settings']}>
            <Routes>
              <Route path="/settings" element={<SettingsPage />} />
            </Routes>
          </MemoryRouter>
        </ApiClientProvider>
      </QueryClientProvider>
    </ReduxProvider>
  );
}

describe('SettingsPage a11y', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    queryClient.clear();
  });

  it('default settings page has no a11y violations', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    fetchSpy
      .mockResolvedValueOnce(buildFetchResponse(PROFILE_RESPONSE))
      .mockResolvedValueOnce(buildFetchResponse(NOTIFICATION_PREFS_RESPONSE));

    const { container } = render(<Wrapper />);

    // Wait for the page to settle with populated data before auditing
    expect(await screen.findByRole('heading', { name: /^settings$/i, level: 1 })).toBeInTheDocument();

    await testA11y(container);
  });
});
