/**
 * SignupPage tests.
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

import { SignupPage } from './SignupPage';

// Mock useSignup so useAuth().signup.mutateAsync resolves.
vi.mock('@/features/auth/api/authApi', async (importOriginal) => {
  const actual = await importOriginal<object>();
  return {
    ...actual,
    useSignup: () => ({
      signup: {
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

function Wrapper({ store }: { store?: ReturnType<typeof createAuthStore> }): ReactElement {
  return (
    <ReduxProvider store={store ?? createAuthStore({ kind: 'anonymous' })}>
      <QueryClientProvider client={queryClient}>
        <ApiClientProvider client={testApiClient}>
          <MemoryRouter initialEntries={['/signup']}>
            <Routes>
              <Route path="/signup" element={<SignupPage />} />
              <Route path="/dashboard" element={<div>Dashboard</div>} />
            </Routes>
          </MemoryRouter>
        </ApiClientProvider>
      </QueryClientProvider>
    </ReduxProvider>
  );
}

describe('SignupPage', () => {
  it('renders "Create an account" heading', () => {
    render(<Wrapper />);
    expect(screen.getByRole('heading', { name: /create an account/i })).toBeInTheDocument();
  });

  it('renders name, email, password, confirm fields', () => {
    render(<Wrapper />);
    expect(screen.getByLabelText(/^name$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^email$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
  });

  it('renders "Create account" button', () => {
    render(<Wrapper />);
    expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
  });

  it('redirects to /dashboard when already authenticated', () => {
    render(<Wrapper store={authedStore} />);
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });

  it('navigates to /dashboard on successful signup', async () => {
    render(<Wrapper />);

    await userEvent.type(screen.getByLabelText(/^name$/i), 'Test User');
    await userEvent.type(screen.getByLabelText(/^email$/i), 'test@example.com');
    await userEvent.type(screen.getByLabelText(/^password$/i), 'ValidPass1');
    await userEvent.type(screen.getByLabelText(/confirm password/i), 'ValidPass1');

    await userEvent.click(screen.getByRole('button', { name: /create account/i }));

    expect(await screen.findByText('Dashboard')).toBeInTheDocument();
  });
});
