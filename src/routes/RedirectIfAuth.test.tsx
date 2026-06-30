/**
 * RedirectIfAuth tests.
 *
 * @see docs/plans/phase-1-core-infrastructure.md §10, §34
 */
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { Provider as ReduxProvider } from 'react-redux';
import { describe, expect, it } from 'vitest';

import { ApiClientProvider } from '@/shared/api/ApiClientContext';
import { createApiClient } from '@/shared/api/client';
import { store as appStore } from '@/store';

import { RedirectIfAuth } from './RedirectIfAuth';

const testApiClient = createApiClient({ baseUrl: 'http://test.local' });

describe('RedirectIfAuth', () => {
  it('renders outlet content when anonymous', () => {
    render(
      <ReduxProvider store={appStore}>
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
});
