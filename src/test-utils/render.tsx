import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, type RenderOptions, type RenderResult } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { type ReactElement } from 'react';
import { Provider as ReduxProvider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';

import { ApiClientProvider } from '@/shared/api/ApiClientContext';
import { createApiClient } from '@/shared/api/client';
import { store } from '@/store';

import type { RenderWithProvidersOptions } from './types';

const testApiClient = createApiClient({ baseUrl: '/api' });

/**
 * Custom RTL render that wraps the UI in all application providers.
 *
 * Provider nesting (outermost → innermost):
 *   ApiClientProvider → ReduxProvider → QueryClientProvider → MemoryRouter → wrapper → UI
 *
 * Each call creates a fresh QueryClient to prevent cache bleed between tests.
 *
 * @param ui - The React element to render.
 * @param options - Customisation options (initial route, preloaded state, query config, wrapper).
 *
 * @example
 *   import { renderWithProviders, screen } from '@/test-utils';
 *
 *   test('renders dashboard heading', () => {
 *     renderWithProviders(<DashboardPage />, { initialEntries: ['/dashboard'] });
 *     expect(screen.getByRole('heading', { name: /dashboard/i })).toBeInTheDocument();
 *   });
 */
export function renderWithProviders(
  ui: ReactElement,
  options?: RenderWithProvidersOptions & Omit<RenderOptions, 'wrapper'>,
): RenderResult {
  const {
    initialEntries,
    queryClientOptions,
    wrapper: CustomWrapper,
    ...renderOptions
  } = options ?? {};

  const testQueryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      ...queryClientOptions?.defaultOptions,
    },
  });

  function Wrapper({ children }: { children: React.ReactNode }) {
    let content = children;

    if (CustomWrapper) {
      content = <CustomWrapper>{content}</CustomWrapper>;
    }

    // Wrap in MemoryRouter only when initialEntries is explicitly provided
    // (avoids double-router errors when tests or components already provide a router)
    const withProviders = (
      <ApiClientProvider client={testApiClient}>
        <ReduxProvider store={store}>
          <QueryClientProvider client={testQueryClient}>
            {initialEntries ? (
              <MemoryRouter initialEntries={initialEntries}>{content}</MemoryRouter>
            ) : (
              content
            )}
          </QueryClientProvider>
        </ReduxProvider>
      </ApiClientProvider>
    );

    return withProviders;
  }

  return render(ui, { wrapper: Wrapper, ...renderOptions });
}

export { userEvent };
