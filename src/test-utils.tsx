import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, type RenderOptions, type RenderResult } from '@testing-library/react';
import { type ReactElement } from 'react';
import { Provider as ReduxProvider } from 'react-redux';

import { store } from '@/store';

/**
 * Custom RTL render that wraps the UI in all providers.
 *
 * Phase 0 wraps with Redux + RQ. Router wraps in Phase 1.
 * Each test gets a fresh QueryClient to avoid cache bleed.
 *
 * @example
 *   import { renderWithProviders, screen } from '@/test-utils';
 *   test('renders heading', () => {
 *     renderWithProviders(<App />);
 *     expect(screen.getByRole('heading', { name: /tcsgon/i })).toBeInTheDocument();
 *   });
 */
export function renderWithProviders(
  ui: ReactElement,
  options?: RenderOptions,
): RenderResult {
  const testQueryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <ReduxProvider store={store}>
      <QueryClientProvider client={testQueryClient}>{ui}</QueryClientProvider>
    </ReduxProvider>,
    options,
  );
}

// Re-export everything RTL gives us so test files only import from this module.
export * from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';