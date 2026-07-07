/**
 * TopBar component tests.
 *
 * @see docs/plans/phase-1-core-infrastructure.md §10, §34, §35
 */
import { configureStore } from '@reduxjs/toolkit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen } from '@testing-library/react';
import { type ReactElement, type ReactNode } from 'react';
import { Provider as ReduxProvider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

import type { AuthState } from '@/features/auth/authState';
import { authReducer } from '@/features/auth/slice/authSlice';
import { ApiClientProvider } from '@/shared/api/ApiClientContext';
import { createApiClient } from '@/shared/api/client';
import { asSessionId, asUserId } from '@/shared/types/brand';

import { TopBar } from './TopBar';

const testApiClient = createApiClient({ baseUrl: 'http://test.local' });
const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
});

describe('TopBar', () => {
  function createAuthStore(auth: AuthState) {
    return configureStore({ reducer: { auth: authReducer }, preloadedState: { auth } });
  }

  function Wrapper({ children }: { children: ReactNode }): ReactElement {
    return (
      <ReduxProvider store={createAuthStore({ kind: 'anonymous' })}>
        <QueryClientProvider client={queryClient}>
          <ApiClientProvider client={testApiClient}>
            <BrowserRouter>
              {children}
            </BrowserRouter>
          </ApiClientProvider>
        </QueryClientProvider>
      </ReduxProvider>
    );
  }

  function createAuthedWrapper(): (props: { children: ReactNode }) => ReactElement {
    const alice = { id: asUserId('1'), email: 'a@b.com', name: 'Alice' };
    const store = createAuthStore({
      kind: 'authenticated',
      user: alice,
      session: { id: asSessionId('sess-1'), token: 't'.repeat(20), expiresAt: '2027-01-01T00:00:00Z', user: alice },
    });
    return function AuthedWrapper({ children }: { children: ReactNode }): ReactElement {
      return (
        <ReduxProvider store={store}>
          <QueryClientProvider client={queryClient}>
            <ApiClientProvider client={testApiClient}>
              <BrowserRouter>
                {children}
              </BrowserRouter>
            </ApiClientProvider>
          </QueryClientProvider>
        </ReduxProvider>
      );
    };
  }

  it('renders the title', () => {
    render(<TopBar title="Dashboard" />, { wrapper: Wrapper });
    expect(screen.getByRole('heading', { name: /dashboard/i })).toBeInTheDocument();
  });

  it('renders menu button when authenticated', () => {
    const AuthedWrapper = createAuthedWrapper();
    render(<TopBar title="Dashboard" />, { wrapper: AuthedWrapper });
    const menuBtn = screen.getByRole('button', { name: /open navigation menu/i });
    expect(menuBtn).toBeInTheDocument();
  });

  it('calls onMenuClick when menu button clicked', () => {
    const AuthedWrapper = createAuthedWrapper();
    const onMenuClick = vi.fn();
    render(<TopBar title="Dashboard" onMenuClick={onMenuClick} />, { wrapper: AuthedWrapper });
    fireEvent.click(screen.getByRole('button', { name: /open navigation menu/i }));
    expect(onMenuClick).toHaveBeenCalledOnce();
  });

  it('renders theme toggle with correct aria-pressed for light theme', () => {
    render(<TopBar title="Dashboard" theme="light" />, { wrapper: Wrapper });
    const toggle = screen.getByRole('button', { name: /switch to dark theme/i });
    expect(toggle).toHaveAttribute('aria-pressed', 'false');
  });

  it('renders theme toggle with correct aria-pressed for dark theme', () => {
    render(<TopBar title="Dashboard" theme="dark" />, { wrapper: Wrapper });
    const toggle = screen.getByRole('button', { name: /switch to light theme/i });
    expect(toggle).toHaveAttribute('aria-pressed', 'true');
  });

  it('calls onThemeToggle when theme toggle clicked', () => {
    const onThemeToggle = vi.fn();
    render(<TopBar title="Dashboard" onThemeToggle={onThemeToggle} />, { wrapper: Wrapper });
    fireEvent.click(screen.getByRole('button', { name: /switch to dark theme/i }));
    expect(onThemeToggle).toHaveBeenCalledOnce();
  });

  it('displays "Sign in" link when anonymous', () => {
    render(<TopBar title="Dashboard" />, { wrapper: Wrapper });
    expect(screen.getByRole('link', { name: /sign in/i })).toBeInTheDocument();
  });

  it('displays ProfileMenu avatar when authenticated', () => {
    const AuthedWrapper = createAuthedWrapper();
    render(<TopBar title="Dashboard" />, { wrapper: AuthedWrapper });
    // ProfileMenu shows the user's initial as the avatar
    expect(screen.getByText('A')).toBeInTheDocument();
  });
});
