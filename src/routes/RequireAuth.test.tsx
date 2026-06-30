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
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { Provider as ReduxProvider } from 'react-redux';
import { describe, expect, it } from 'vitest';

import { ApiClientProvider } from '@/shared/api/ApiClientContext';
import { createApiClient } from '@/shared/api/client';
import { store as appStore } from '@/store';

import { RequireAuth } from './RequireAuth';

const testApiClient = createApiClient({ baseUrl: 'http://test.local' });

describe('RequireAuth', () => {
  it('redirects anonymous users to /login', () => {
    render(
      <ReduxProvider store={appStore}>
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

    // In anonymous state, we should be redirected to /login.
    expect(screen.getByTestId('login-page')).toBeInTheDocument();
  });
});
