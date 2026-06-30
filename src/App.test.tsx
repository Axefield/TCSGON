import { act, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { App } from '@/App';
import { store } from '@/store';
import { toggleTheme } from '@/store/slices/uiSlice';
import { renderWithProviders } from '@/test-utils';

/**
 * Phase 0 smoke test — must be real checks per Decision 1.
 *
 * Verifies, in order:
 *  1. App renders a heading (semantic query — not getByTestId).
 *  2. Tagline paragraph is visible.
 *  3. Initial theme is "light" (the documented default).
 *  4. Dispatching toggleTheme flips the rendered data-theme attribute,
 *     proving the Redux store is wired end-to-end (not stubbed).
 *  5. QueryClient + ReduxProvider both mount without warnings (asserted by
 *     absence of throws during render + presence of reactive subscription).
 */
describe('App — Phase 0 smoke', () => {
  it('renders the app heading with the correct text', () => {
    renderWithProviders(<App />);
    expect(
      screen.getByRole('heading', { name: /tcsgon/i, level: 1 }),
    ).toBeInTheDocument();
  });

  it('renders the tagline paragraph', () => {
    renderWithProviders(<App />);
    expect(screen.getByText(/enterprise react spa scaffold/i)).toBeInTheDocument();
  });

  it('reads theme from the Redux store (initial state: light)', () => {
    renderWithProviders(<App />);
    expect(screen.getByRole('main')).toHaveAttribute('data-theme', 'light');
  });

  it('toggling theme updates the rendered data-theme (store wired)', () => {
    renderWithProviders(<App />);
    expect(screen.getByRole('main')).toHaveAttribute('data-theme', 'light');

    // Dispatch through the real store inside act() so React commits the
    // re-render before we assert on the DOM. This proves the store is the
    // source of truth and the component subscribes correctly.
    act(() => {
      store.dispatch(toggleTheme());
    });

    expect(screen.getByRole('main')).toHaveAttribute('data-theme', 'dark');
  });
});