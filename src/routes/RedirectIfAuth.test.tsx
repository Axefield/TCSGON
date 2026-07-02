/**
 * RedirectIfAuth tests.
 *
 * @see docs/plans/phase-1-core-infrastructure.md §10, §34
 */
import { configureStore } from '@reduxjs/toolkit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { type ReactElement } from 'react';
import { Provider as ReduxProvider } from 'react-redux';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it } from 'vitest';

import type { AuthState } from '@/features/auth/authState';
import { authReducer } from '@/features/auth/slice/authSlice';
import { ApiClientProvider } from '@/shared/api/ApiClientContext';
import { createApiClient } from '@/shared/api/client';
import { asSessionId, asUserId } from '@/shared/types/brand';

import { RedirectIfAuth } from './RedirectIfAuth';

const testApiClient = createApiClient({ baseUrl: 'http://test.local' });

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
});

function createAuthStore(auth: AuthState) {
  return configureStore({ reducer: { auth: authReducer }, preloadedState: { auth } });
}

function TestWrapper({ store, children }: { store: ReturnType<typeof createAuthStore>; children: ReactElement }): ReactElement {
  return (
    <ReduxProvider store={store}>
      <QueryClientProvider client={queryClient}>
        <ApiClientProvider client={testApiClient}>
          {children}
        </ApiClientProvider>
      </QueryClientProvider>
    </ReduxProvider>
  );
}

describe('RedirectIfAuth', () => {
  it('renders outlet content when anonymous', () => {
    const store = createAuthStore({ kind: 'anonymous' });

    render(
      <TestWrapper store={store}>
        <MemoryRouter initialEntries={['/login']}>
          <Routes>
            <Route path="/login" element={<RedirectIfAuth />}>
              <Route index element={<div data-testid="login-content">Login Page</div>} />
            </Route>
          </Routes>
        </MemoryRouter>
      </TestWrapper>,
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
      <TestWrapper store={store}>
        <MemoryRouter initialEntries={['/login']}>
          <Routes>
            <Route path="/login" element={<RedirectIfAuth />}>
              <Route index element={<div data-testid="login-content">Login Page</div>} />
            </Route>
            <Route path="/dashboard" element={<div data-testid="dashboard-page">Dashboard</div>} />
          </Routes>
        </MemoryRouter>
      </TestWrapper>,
    );
    expect(screen.getByTestId('dashboard-page')).toBeInTheDocument();
    expect(screen.queryByTestId('login-content')).not.toBeInTheDocument();
  });
});
