/**
 * RequireAuth route guard tests.
 *
 * @see docs/plans/phase-1-core-infrastructure.md §51, §57
 *
 * NOTE: We use MemoryRouter (non-data router) instead of createMemoryRouter
 * to avoid an AbortSignal incompatibility between jsdom and Node.js undici
 * that occurs when @remix-run/router creates Request objects internally.
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

import { RequireAuth } from './RequireAuth';

const testApiClient = createApiClient({ baseUrl: 'http://test.local' });

function createAuthStore(auth: AuthState) {
  return configureStore({ reducer: { auth: authReducer }, preloadedState: { auth } });
}

describe('RequireAuth', () => {
  it('redirects anonymous users to /login', () => {
    const store = createAuthStore({ kind: 'anonymous' });

    render(
      <ReduxProvider store={store}>
        <ApiClientProvider client={testApiClient}>
          <MemoryRouter initialEntries={['/']}>
            <Routes>
              <Route element={<RequireAuth />}>
                <Route index element={<div data-testid="protected">Secret</div>} />
              </Route>
              <Route path="/login" element={<div data-testid="login-page">Login</div>} />
            </Routes>
          </MemoryRouter>
        </ApiClientProvider>
      </ReduxProvider>,
    );

    expect(screen.getByTestId('login-page')).toBeInTheDocument();
  });

  it('shows spinner while authenticating', () => {
    const store = createAuthStore({ kind: 'authenticating' });

    render(
      <ReduxProvider store={store}>
        <ApiClientProvider client={testApiClient}>
          <MemoryRouter initialEntries={['/']}>
            <Routes>
              <Route element={<RequireAuth />}>
                <Route index element={<div data-testid="protected">Secret</div>} />
              </Route>
              <Route path="/login" element={<div data-testid="login-page">Login</div>} />
            </Routes>
          </MemoryRouter>
        </ApiClientProvider>
      </ReduxProvider>,
    );

    expect(screen.getByRole('status', { name: /verifying session/i })).toBeInTheDocument();
    expect(screen.queryByTestId('protected')).not.toBeInTheDocument();
  });

  it('redirects error state to /login', () => {
    const store = createAuthStore({ kind: 'error', error: 'Network error', user: null });

    render(
      <ReduxProvider store={store}>
        <ApiClientProvider client={testApiClient}>
          <MemoryRouter initialEntries={['/']}>
            <Routes>
              <Route element={<RequireAuth />}>
                <Route index element={<div data-testid="protected">Secret</div>} />
              </Route>
              <Route path="/login" element={<div data-testid="login-page">Login</div>} />
            </Routes>
          </MemoryRouter>
        </ApiClientProvider>
      </ReduxProvider>,
    );

    expect(screen.getByTestId('login-page')).toBeInTheDocument();
  });

  it('renders outlet when authenticated', () => {
    const alice = { id: asUserId('1'), email: 'a@b.com', name: 'Alice' };
    const store = createAuthStore({
      kind: 'authenticated',
      user: alice,
      session: { id: asSessionId('sess-1'), token: 't'.repeat(20), expiresAt: '2027-01-01T00:00:00Z', user: alice },
    });

    render(
      <ReduxProvider store={store}>
        <ApiClientProvider client={testApiClient}>
          <MemoryRouter initialEntries={['/']}>
            <Routes>
              <Route element={<RequireAuth />}>
                <Route index element={<div data-testid="protected">Secret</div>} />
              </Route>
              <Route path="/login" element={<div data-testid="login-page">Login</div>} />
            </Routes>
          </MemoryRouter>
        </ApiClientProvider>
      </ReduxProvider>,
    );

    expect(screen.getByTestId('protected')).toBeInTheDocument();
    expect(screen.queryByTestId('login-page')).not.toBeInTheDocument();
  });
});
