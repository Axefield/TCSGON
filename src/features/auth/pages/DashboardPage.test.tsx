/**
 * DashboardPage tests.
 *
 * @see docs/plans/phase-1-core-infrastructure.md §51, §57
 */
import { render, screen } from '@testing-library/react';
import { type ReactElement, type ReactNode } from 'react';
import { Provider as ReduxProvider } from 'react-redux';
import { describe, expect, it } from 'vitest';

import { ApiClientProvider } from '@/shared/api/ApiClientContext';
import { createApiClient } from '@/shared/api/client';
import { store as appStore } from '@/store';

import { DashboardPage } from './DashboardPage';

const testApiClient = createApiClient({ baseUrl: 'http://test.local' });

function Wrapper({ children }: { children: ReactNode }): ReactElement {
  return (
    <ReduxProvider store={appStore}>
      <ApiClientProvider client={testApiClient}>{children}</ApiClientProvider>
    </ReduxProvider>
  );
}

describe('DashboardPage', () => {
  it('renders the dashboard heading', () => {
    render(<DashboardPage />, { wrapper: Wrapper });
    expect(screen.getByRole('heading', { name: /dashboard/i })).toBeInTheDocument();
  });

  it('shows a welcome message referencing the user', () => {
    // In anonymous state the user is null so it falls back to "User".
    render(<DashboardPage />, { wrapper: Wrapper });
    expect(screen.getByText(/welcome/i)).toBeInTheDocument();
  });
});
