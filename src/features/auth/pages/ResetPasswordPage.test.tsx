/**
 * ResetPasswordPage tests.
 */
import { configureStore } from '@reduxjs/toolkit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { type ReactElement } from 'react';
import { Provider as ReduxProvider } from 'react-redux';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

import type { AuthState } from '@/features/auth/authState';
import { authReducer } from '@/features/auth/slice/authSlice';
import { ApiClientProvider } from '@/shared/api/ApiClientContext';
import { createApiClient } from '@/shared/api/client';
import { asSessionId, asUserId } from '@/shared/types/brand';

import { ResetPasswordPage } from './ResetPasswordPage';

// Mock useResetPassword so useAuth().resetPassword.mutateAsync resolves.
vi.mock('@/features/auth/api/authApi', async (importOriginal) => {
  const actual = await importOriginal<object>();
  return {
    ...actual,
    useResetPassword: () => ({
      resetPassword: {
        mutateAsync: vi.fn().mockResolvedValue({}),
        isPending: false,
        reset: vi.fn(),
      },
    }),
  };
});

const testApiClient = createApiClient({ baseUrl: 'http://test.local' });

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
});

function createAuthStore(auth: AuthState) {
  return configureStore({ reducer: { auth: authReducer }, preloadedState: { auth } });
}

const alice = { id: asUserId('1'), email: 'a@b.com', name: 'Alice' };
const authedStore = createAuthStore({
  kind: 'authenticated',
  user: alice,
  session: { id: asSessionId('s-1'), token: 't'.repeat(20), expiresAt: '2027-01-01T00:00:00Z', user: alice },
});

function Wrapper({
  store,
  initialEntries = ['/reset-password?token=valid-token-123'],
}: {
  store?: ReturnType<typeof createAuthStore>;
  initialEntries?: string[];
}): ReactElement {
  return (
    <ReduxProvider store={store ?? createAuthStore({ kind: 'anonymous' })}>
      <QueryClientProvider client={queryClient}>
        <ApiClientProvider client={testApiClient}>
          <MemoryRouter initialEntries={initialEntries}>
            <Routes>
              <Route path="/reset-password" element={<ResetPasswordPage />} />
              <Route path="/dashboard" element={<div>Dashboard</div>} />
            </Routes>
          </MemoryRouter>
        </ApiClientProvider>
      </QueryClientProvider>
    </ReduxProvider>
  );
}

describe('ResetPasswordPage', () => {
  it('renders "Reset password" heading with token query param', () => {
    render(<Wrapper />);
    expect(screen.getByRole('heading', { name: /reset password/i })).toBeInTheDocument();
  });

  it('renders password and confirm fields with token', () => {
    render(<Wrapper />);
    expect(screen.getByLabelText(/^new password$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm new password/i)).toBeInTheDocument();
  });

  it('renders "Invalid reset link" heading when no token', () => {
    render(<Wrapper initialEntries={['/reset-password']} />);
    expect(screen.getByRole('heading', { name: /invalid reset link/i })).toBeInTheDocument();
  });

  it('redirects to /dashboard when already authenticated', () => {
    render(<Wrapper store={authedStore} />);
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });

  it('shows success state after password reset', async () => {
    render(<Wrapper />);

    await userEvent.type(screen.getByLabelText(/^new password$/i), 'NewPass1!');
    await userEvent.tab();
    await userEvent.type(screen.getByLabelText(/confirm new password/i), 'NewPass1!');
    await userEvent.tab();

    await userEvent.click(screen.getByRole('button', { name: /reset password/i }));

    expect(
      await screen.findByRole('heading', { name: /password reset successful/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /sign in/i })).toBeInTheDocument();
  });
});
