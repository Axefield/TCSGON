/**
 * App smoke tests — Phase 1.
 *
 * Verifies:
 *  1. App renders without crashing via RouterProvider.
 *
 * Uses `createMemoryRouter` to avoid browser API dependencies (AbortSignal
 * incompatibility between Node.js undici and jsdom).
 */
import { screen } from '@testing-library/react';
import { createMemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';

import { App } from '@/App';
import { renderWithProviders } from '@/test-utils';

describe('App — Phase 1 smoke', () => {
  it('renders without crashing (RouterProvider + RootErrorBoundary)', () => {
    const router = createMemoryRouter([
      { path: '/', element: <div data-testid="test-root">Hello</div> },
    ]);

    renderWithProviders(<App router={router} />);

    expect(screen.getByTestId('test-root')).toBeInTheDocument();
  });
});
