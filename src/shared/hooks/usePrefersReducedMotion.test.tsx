/**
 * usePrefersReducedMotion tests.
 *
 * @see docs/plans/phase-1-core-infrastructure.md §11, §39
 */
import { render, screen } from '@testing-library/react';
import { type ReactElement, type ReactNode } from 'react';
import { Provider as ReduxProvider } from 'react-redux';
import { describe, expect, it, vi } from 'vitest';

import { store as appStore } from '@/store';

import { usePrefersReducedMotion } from './usePrefersReducedMotion';

function TestConsumer(): ReactElement {
  const prefersReduced = usePrefersReducedMotion();
  return <div data-testid="output">{prefersReduced ? 'reduced' : 'no-preference'}</div>;
}

function Wrapper({ children }: { children: ReactNode }): ReactElement {
  return <ReduxProvider store={appStore}>{children}</ReduxProvider>;
}

describe('usePrefersReducedMotion', () => {
  it('returns false when matchMedia says no preference', () => {
    // Mock matchMedia to return matches: false
    vi.spyOn(window, 'matchMedia').mockReturnValue({
      matches: false,
      media: '(prefers-reduced-motion: reduce)',
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    } as unknown as MediaQueryList);

    render(<TestConsumer />, { wrapper: Wrapper });
    expect(screen.getByTestId('output')).toHaveTextContent('no-preference');
  });

  it('returns true when matchMedia says reduced', () => {
    vi.spyOn(window, 'matchMedia').mockReturnValue({
      matches: true,
      media: '(prefers-reduced-motion: reduce)',
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    } as unknown as MediaQueryList);

    render(<TestConsumer />, { wrapper: Wrapper });
    expect(screen.getByTestId('output')).toHaveTextContent('reduced');
  });

  it('responds to matchMedia change event', () => {
    const listeners: Record<string, Array<(e: { matches: boolean }) => void>> = {};
    vi.spyOn(window, 'matchMedia').mockReturnValue({
      matches: false,
      media: '(prefers-reduced-motion: reduce)',
      onchange: null,
      addEventListener: vi.fn((event: string, handler: (e: { matches: boolean }) => void) => {
        listeners[event] = listeners[event] ?? [];
        listeners[event].push(handler);
      }),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    } as unknown as MediaQueryList);

    const { rerender } = render(<TestConsumer />, { wrapper: Wrapper });
    expect(screen.getByTestId('output')).toHaveTextContent('no-preference');

    // Simulate the matchMedia change event
    listeners['change']?.forEach((handler) => handler({ matches: true }));

    // Re-render to pick up the new state from the store
    rerender(<TestConsumer />);
    expect(screen.getByTestId('output')).toHaveTextContent('reduced');
  });

  it('cleans up event listener on unmount', () => {
    const removeEventListener = vi.fn();
    vi.spyOn(window, 'matchMedia').mockReturnValue({
      matches: false,
      media: '(prefers-reduced-motion: reduce)',
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener,
      dispatchEvent: vi.fn(),
    } as unknown as MediaQueryList);

    const { unmount } = render(<TestConsumer />, { wrapper: Wrapper });
    unmount();

    expect(removeEventListener).toHaveBeenCalledWith('change', expect.any(Function));
  });
});
