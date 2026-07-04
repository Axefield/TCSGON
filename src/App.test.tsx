/**
 * App smoke tests — Phase 1.
 *
 * Verifies:
 *  1. App renders without crashing via RouterProvider.
 *  2. App renders with default router when no router prop provided (covers
 *     the `router ?? createAppRouter()` branch).
 *
 * Uses `createMemoryRouter` to avoid browser API dependencies (AbortSignal
 * incompatibility between Node.js undici and jsdom).
 */
import { screen } from '@testing-library/react';
import { createMemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

import { App } from '@/App';
import { renderWithProviders } from '@/test-utils';

// Mock createAppRouter to return a simple memory router so tests avoid the
// AbortSignal incompatibility between Node.js undici and jsdom that MSW's
// interceptor triggers when a data router creates internal fetch requests.
vi.mock('@/routes', async () => {
  const actual = await vi.importActual<Record<string, unknown>>('@/routes');
  return {
    ...actual,
    createAppRouter: () =>
      createMemoryRouter([
        { path: '/', element: <div data-testid="default-router">Default Router</div> },
      ]),
  };
});

describe('App — Phase 1 smoke', () => {
  it('renders without crashing (RouterProvider + RootErrorBoundary)', () => {
    const router = createMemoryRouter([
      { path: '/', element: <div data-testid="test-root">Hello</div> },
    ]);

    renderWithProviders(<App router={router} />);

    expect(screen.getByTestId('test-root')).toBeInTheDocument();
  });

  it('renders with default router when no router prop provided', () => {
    // Without a router prop, createAppRouter() is used (mocked above).
    renderWithProviders(<App />);

    expect(screen.getByTestId('default-router')).toBeInTheDocument();
  });
});
