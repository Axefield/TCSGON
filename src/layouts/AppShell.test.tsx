/**
 * AppShell component tests.
 *
 * @see docs/plans/phase-1-core-infrastructure.md §8, §10, §34
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { type ReactElement, type ReactNode } from 'react';
import { Provider as ReduxProvider } from 'react-redux';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it } from 'vitest';

import { authActions } from '@/features/auth/slice/authSlice';
import { ApiClientProvider } from '@/shared/api/ApiClientContext';
import { createApiClient } from '@/shared/api/client';
import { asSessionId, asUserId } from '@/shared/types/brand';
import { store as appStore } from '@/store';

import { AppShell } from './AppShell';

/** A minimal valid session for tests that need an authenticated user. */
const TEST_SESSION = {
  id: asSessionId('session-test-1'),
  user: {
    id: asUserId('user-test-1'),
    name: 'Test User',
    email: 'test@example.com',
  },
  token: 'test-token-00000000000000000000',
  expiresAt: '2030-01-01T00:00:00.000Z',
};

const testApiClient = createApiClient({ baseUrl: 'http://test.local' });
const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
});

/** Wraps children in all providers EXCEPT router — caller provides MemoryRouter. */
function Providers({ children }: { children: ReactNode }): ReactElement {
  return (
    <ReduxProvider store={appStore}>
      <QueryClientProvider client={queryClient}>
        <ApiClientProvider client={testApiClient}>
          {children}
        </ApiClientProvider>
      </QueryClientProvider>
    </ReduxProvider>
  );
}

/** Convenience: Providers + MemoryRouter with optional initialEntries. */
function renderInShell(ui: ReactNode, initialEntries?: string[]): void {
  render(
    <Providers>
      <MemoryRouter initialEntries={initialEntries ?? ['/']}>
        <Routes>
          <Route element={<AppShell />}>
            <Route index element={ui} />
          </Route>
        </Routes>
      </MemoryRouter>
    </Providers>,
  );
}

describe('AppShell', () => {
  it('renders skip link', () => {
    renderInShell(<div>Content</div>);
    expect(screen.getByRole('link', { name: /skip to content/i })).toBeInTheDocument();
  });

  it('renders main content area with id for skip-link target', () => {
    renderInShell(<div data-testid="page-content">Hello</div>);
    const main = document.getElementById('main-content');
    expect(main).toBeInTheDocument();
    expect(screen.getByTestId('page-content')).toBeInTheDocument();
  });

  it('renders toast region', () => {
    renderInShell(<div>Content</div>);
    expect(screen.getByLabelText('Notifications')).toBeInTheDocument();
    expect(screen.getByLabelText('Error notifications')).toBeInTheDocument();
  });

  it('renders sidebar aside element when authenticated', () => {
    // Log in so the sidebar renders.
    appStore.dispatch(authActions.loginFulfilled(TEST_SESSION));
    renderInShell(<div>Content</div>);
    expect(screen.getByRole('complementary')).toBeInTheDocument();
    // Reset auth state for other tests.
    appStore.dispatch(authActions.logout());
  });
});
