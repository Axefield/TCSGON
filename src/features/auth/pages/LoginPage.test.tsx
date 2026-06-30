/**
 * LoginPage tests.
 *
 * @see docs/plans/phase-1-core-infrastructure.md §51, §57
 */
import { render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { type ReactElement } from 'react';
import { Provider as ReduxProvider } from 'react-redux';
import { describe, expect, it } from 'vitest';

import { ApiClientProvider } from '@/shared/api/ApiClientContext';
import { createApiClient } from '@/shared/api/client';
import { store as appStore } from '@/store';

import { LoginPage } from './LoginPage';

const testApiClient = createApiClient({ baseUrl: 'http://test.local' });

function Wrapper(): ReactElement {
  const router = createMemoryRouter(
    [
      {
        path: '/login',
        element: <LoginPage />,
      },
      {
        path: '/dashboard',
        element: <div>Dashboard</div>,
      },
    ],
    { initialEntries: ['/login'] },
  );

  return (
    <ReduxProvider store={appStore}>
      <ApiClientProvider client={testApiClient}>
        <RouterProvider router={router} />
      </ApiClientProvider>
    </ReduxProvider>
  );
}

describe('LoginPage', () => {
  it('renders sign-in heading', () => {
    render(<Wrapper />);
    expect(screen.getByRole('heading', { name: /sign in/i })).toBeInTheDocument();
  });

  it('renders email input', () => {
    render(<Wrapper />);
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
  });

  it('renders password input', () => {
    render(<Wrapper />);
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
  });

  it('renders sign-in submit button', () => {
    render(<Wrapper />);
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });
});
