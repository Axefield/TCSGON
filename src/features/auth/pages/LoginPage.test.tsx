/**
 * LoginPage tests.
 *
 * @see docs/plans/phase-1-core-infrastructure.md §51, §57
 */
import { configureStore } from '@reduxjs/toolkit';
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

import { LoginPage } from './LoginPage';

const testApiClient = createApiClient({ baseUrl: 'http://test.local' });

function createAuthStore(auth: AuthState) {
  return configureStore({ reducer: { auth: authReducer }, preloadedState: { auth } });
}

const alice = { id: asUserId('1'), email: 'a@b.com', name: 'Alice' };
const authedStore = createAuthStore({
  kind: 'authenticated',
  user: alice,
  session: { id: asSessionId('s-1'), token: 't'.repeat(20), expiresAt: '2027-01-01T00:00:00Z', user: alice },
});

function Wrapper({ store }: { store?: ReturnType<typeof createAuthStore> }): ReactElement {
  return (
    <ReduxProvider store={store ?? createAuthStore({ kind: 'anonymous' })}>
      <ApiClientProvider client={testApiClient}>
        <MemoryRouter initialEntries={['/login']}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/dashboard" element={<div>Dashboard</div>} />
          </Routes>
        </MemoryRouter>
      </ApiClientProvider>
    </ReduxProvider>
  );
}

describe('LoginPage', () => {
  it('renders sign-in heading', () => {
    render(<Wrapper />);
    expect(screen.getByRole('heading', { name: /sign in/i })).toBeInTheDocument();
  });

  it('renders email input', () => {
    render(<Wrapper />);
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
  });

  it('renders password input', () => {
    render(<Wrapper />);
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
  });

  it('renders sign-in submit button', () => {
    render(<Wrapper />);
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('redirects to /dashboard when already authenticated', () => {
    render(<Wrapper store={authedStore} />);
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });
});


