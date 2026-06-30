/**
 * RedirectIfAuth tests.
 *
 * @see docs/plans/phase-1-core-infrastructure.md §10, §34
 */
import { render, screen } from '@testing-library/react';
import { configureStore } from '@reduxjs/toolkit';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { Provider as ReduxProvider } from 'react-redux';
import { describe, expect, it } from 'vitest';

import { authReducer } from '@/features/auth/slice/authSlice';
import type { AuthState } from '@/features/auth/authState';
import { ApiClientProvider } from '@/shared/api/ApiClientContext';
import { createApiClient } from '@/shared/api/client';
import { asSessionId, asUserId } from '@/shared/types/brand';

import { RedirectIfAuth } from './RedirectIfAuth';

const testApiClient = createApiClient({ baseUrl: 'http://test.local' });

function createAuthStore(auth: AuthState) {
  return configureStore({ reducer: { auth: authReducer }, preloadedState: { auth } });
}

describe('RedirectIfAuth', () => {
  it('renders outlet content when anonymous', () => {
    const store = createAuthStore({ kind: 'anonymous' });

    render(
      <ReduxProvider store={store}>
        <ApiClientProvider client={testApiClient}>
          <MemoryRouter initialEntries={['/login']}>
            <Routes>
              <Route path="/login" element={<RedirectIfAuth />}>
                <Route index element={<div data-testid="login-content">Login Page</div>} />
              </Route>
            </Routes>
          </MemoryRouter>
        </ApiClientProvider>
      </ReduxProvider>,
    );
    // Anonymous users should see the nested route content via Outlet
    expect(screen.getByTestId('login-content')).toBeInTheDocument();
  });

  it('redirects authenticated user to /dashboard', () => {
    const alice = { id: asUserId('1'), email: 'a@b.com', name: 'Alice' };
    const store = createAuthStore({
      kind: 'authenticated',
      user: alice,
      session: {
        id: asSessionId('sess-1'),
        token: 't'.repeat(20),
        expiresAt: '2027-01-01T00:00:00Z',
        user: alice,
      },
    });

    render(
      <ReduxProvider store={store}>
        <ApiClientProvider client={testApiClient}>
          <MemoryRouter initialEntries={['/login']}>
            <Routes>
              <Route path="/login" element={<RedirectIfAuth />}>
                <Route index element={<div data-testid="login-content">Login Page</div>} />
              </Route>
              <Route path="/dashboard" element={<div data-testid="dashboard-page">Dashboard</div>} />
            </Routes>
          </MemoryRouter>
        </ApiClientProvider>
      </ReduxProvider>,
    );
    expect(screen.getByTestId('dashboard-page')).toBeInTheDocument();
    expect(screen.queryByTestId('login-content')).not.toBeInTheDocument();
  });
});
