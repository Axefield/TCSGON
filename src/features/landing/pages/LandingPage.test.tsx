/**
 * LandingPage — unit & integration tests.
 *
 * Covers: unauthenticated render (hero, features, footer, CTAs),
 * authenticated redirect via `<Navigate>`, and edge-case auth states.
 *
 * Uses `renderWithProviders` (default = anonymous) for unauthenticated
 * tests and a custom store wrapper for authenticated/edge-case tests.
 */
import { configureStore } from '@reduxjs/toolkit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { type ReactElement } from 'react';
import { Provider as ReduxProvider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';

import type { AuthState } from '@/features/auth/authState';
import { authReducer } from '@/features/auth/slice/authSlice';
import { ApiClientProvider } from '@/shared/api/ApiClientContext';
import { createApiClient } from '@/shared/api/client';
import { asSessionId, asUserId } from '@/shared/types/brand';
import { renderWithProviders } from '@/test-utils';

import { LandingPage } from './LandingPage';

const testApiClient = createApiClient({ baseUrl: 'http://test.local' });

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
});

const mockAlice = { id: asUserId('u1'), name: 'Alice', email: 'alice@example.com' };

function createAuthStore(auth: AuthState) {
  return configureStore({ reducer: { auth: authReducer }, preloadedState: { auth } });
}

function AuthWrapper({
  store,
  children,
}: {
  store: ReturnType<typeof createAuthStore>;
  children: ReactElement;
}): ReactElement {
  return (
    <ReduxProvider store={store}>
      <QueryClientProvider client={queryClient}>
        <ApiClientProvider client={testApiClient}>
          <MemoryRouter>{children}</MemoryRouter>
        </ApiClientProvider>
      </QueryClientProvider>
    </ReduxProvider>
  );
}

describe('LandingPage', () => {
  // ── Unauthenticated (default store) ──────────────────────────────────

  it('renders the hero section with heading and tagline', () => {
    renderWithProviders(<LandingPage />);

    expect(screen.getByRole('heading', { level: 1, name: 'TCSgon' })).toBeInTheDocument();
    expect(
      screen.getByText(/modern, accessible project management platform/i),
    ).toBeInTheDocument();
  });

  it('renders Get started and Sign in CTA buttons', () => {
    renderWithProviders(<LandingPage />);

    expect(screen.getByRole('link', { name: /get started/i })).toHaveAttribute('href', '/signup');
    expect(screen.getByRole('link', { name: /sign in/i })).toHaveAttribute('href', '/login');
  });

  it('renders the features section with three feature cards', () => {
    renderWithProviders(<LandingPage />);

    expect(screen.getByRole('heading', { level: 2, name: /everything you need/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 3, name: 'Dashboard' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 3, name: 'Projects' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 3, name: 'Settings' })).toBeInTheDocument();
  });

  it('renders the footer with copyright', () => {
    renderWithProviders(<LandingPage />);

    const year = new Date().getFullYear();
    expect(screen.getByText(new RegExp(String.raw`©\s*${year}\s*TCSgon`))).toBeInTheDocument();
  });

  // ── Authenticated redirect ──────────────────────────────────────────

  it('redirects to /dashboard when authenticated', () => {
    const store = createAuthStore({
      kind: 'authenticated',
      user: mockAlice,
      session: {
        id: asSessionId('s1'),
        token: 'tok_'.padEnd(20, 'x'),
        expiresAt: new Date(Date.now() + 86_400_000).toISOString(),
        user: mockAlice,
      },
    });

    const { container } = render(
      <AuthWrapper store={store}>
        <LandingPage />
      </AuthWrapper>,
    );

    // Landing content should NOT be rendered (Navigate replaces it)
    expect(screen.queryByRole('heading', { level: 1, name: 'TCSgon' })).not.toBeInTheDocument();
    // Navigate renders nothing visible
    expect(container.innerHTML).toBe('');
  });

  it('renders landing content when auth state is authenticating (no redirect)', () => {
    const store = createAuthStore({ kind: 'authenticating' });

    render(
      <AuthWrapper store={store}>
        <LandingPage />
      </AuthWrapper>,
    );

    // Not authenticated -> shows landing content
    expect(screen.getByRole('heading', { level: 1, name: 'TCSgon' })).toBeInTheDocument();
  });

  it('renders landing content when auth state is error (no redirect)', () => {
    const store = createAuthStore({ kind: 'error', error: 'Session expired', user: null });

    render(
      <AuthWrapper store={store}>
        <LandingPage />
      </AuthWrapper>,
    );

    // Error state is not authenticated -> shows landing content
    expect(screen.getByRole('heading', { level: 1, name: 'TCSgon' })).toBeInTheDocument();
  });
});
