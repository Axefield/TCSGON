/**
 * ForgotPasswordPage tests.
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

import { ForgotPasswordPage } from './ForgotPasswordPage';

// Mock useForgotPassword so useAuth().forgotPassword.mutateAsync resolves.
vi.mock('@/features/auth/api/authApi', async (importOriginal) => {
  const actual = await importOriginal<object>();
  return {
    ...actual,
    useForgotPassword: () => ({
      forgotPassword: {
        mutateAsync: vi.fn().mockResolvedValue({ message: 'Email sent' }),
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

function Wrapper({ store }: { store?: ReturnType<typeof createAuthStore> }): ReactElement {
  return (
    <ReduxProvider store={store ?? createAuthStore({ kind: 'anonymous' })}>
      <QueryClientProvider client={queryClient}>
        <ApiClientProvider client={testApiClient}>
          <MemoryRouter initialEntries={['/forgot-password']}>
            <Routes>
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/dashboard" element={<div>Dashboard</div>} />
            </Routes>
          </MemoryRouter>
        </ApiClientProvider>
      </QueryClientProvider>
    </ReduxProvider>
  );
}

describe('ForgotPasswordPage', () => {
  it('renders "Forgot password" heading when anonymous', () => {
    render(<Wrapper />);
    expect(screen.getByRole('heading', { name: /forgot password/i })).toBeInTheDocument();
  });

  it('renders email field', () => {
    render(<Wrapper />);
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
  });

  it('renders "Send reset link" button', () => {
    render(<Wrapper />);
    expect(screen.getByRole('button', { name: /send reset link/i })).toBeInTheDocument();
  });

  it('redirects to /dashboard when already authenticated', () => {
    render(<Wrapper store={authedStore} />);
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });

  it('shows "Check your email" success state after form submit', async () => {
    render(<Wrapper />);
    await userEvent.type(screen.getByLabelText(/email address/i), 'test@example.com');
    await userEvent.click(screen.getByRole('button', { name: /send reset link/i }));
    expect(await screen.findByText(/check your email/i)).toBeInTheDocument();
  });
});
