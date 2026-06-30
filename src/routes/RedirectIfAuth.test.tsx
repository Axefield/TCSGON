/**
 * RedirectIfAuth tests.
 *
 * @see docs/plans/phase-1-core-infrastructure.md §10, §34
 */
import { render } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { Provider as ReduxProvider } from 'react-redux';
import { describe, expect, it } from 'vitest';

import { ApiClientProvider } from '@/shared/api/ApiClientContext';
import { createApiClient } from '@/shared/api/client';
import { store as appStore } from '@/store';

import { RedirectIfAuth } from './RedirectIfAuth';

const testApiClient = createApiClient({ baseUrl: 'http://test.local' });

describe('RedirectIfAuth', () => {
  it('renders null when anonymous', () => {
    const { container } = render(
      <ReduxProvider store={appStore}>
        <ApiClientProvider client={testApiClient}>
          <MemoryRouter initialEntries={['/login']}>
            <Routes>
              <Route path="/login" element={<RedirectIfAuth />} />
            </Routes>
          </MemoryRouter>
        </ApiClientProvider>
      </ReduxProvider>,
    );
    // Anonymous users should see nothing (not redirected away)
    expect(container.textContent).toBe('');
  });
});
