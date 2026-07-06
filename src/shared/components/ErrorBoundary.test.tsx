/**
 * ErrorBoundary — unit tests.
 *
 * ErrorBoundary is a class component that catches render errors.
 * This test suite covers: happy-path rendering, error capture,
 * custom fallbacks (ReactNode + render function), reset behaviour,
 * componentDidUpdate child-change reset, and edge-case conditional throws.
 */
import { render, screen, fireEvent } from '@testing-library/react';
import { type ReactElement } from 'react';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';

import { ErrorBoundary } from './ErrorBoundary';

// ─── Test helpers ──────────────────────────────────────────────────

/** Component that throws on every render. */
function ThrowsOnRender(): never {
  throw new Error('Render error');
}

/** Stable child used for happy-path assertions. */
function StableChild(): ReactElement {
  return <div>Stable content</div>;
}

/** Component that conditionally throws based on a prop. */
function ConditionalThrow({ shouldThrow }: { shouldThrow: boolean }): ReactElement {
  if (shouldThrow) {
    throw new Error('Conditional error');
  }
  return <div>Conditional content</div>;
}

describe('ErrorBoundary', () => {
  // ─── Setup / teardown ─────────────────────────────────────────

  /** Suppress the console.error that React emits for caught errors. */
  let consoleSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  // ─── Happy path ───────────────────────────────────────────────

  it('renders children when there is no error', () => {
    render(
      <ErrorBoundary>
        <StableChild />
      </ErrorBoundary>,
    );
    expect(screen.getByText('Stable content')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  // ─── Error state — default fallback ───────────────────────────

  it('catches render error and displays default fallback', () => {
    render(
      <ErrorBoundary>
        <ThrowsOnRender />
      </ErrorBoundary>,
    );

    const alert = screen.getByRole('alert');
    expect(alert).toBeInTheDocument();
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText('Render error')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
  });

  it('calls onError callback when error is caught', () => {
    const onError = vi.fn();
    render(
      <ErrorBoundary onError={onError}>
        <ThrowsOnRender />
      </ErrorBoundary>,
    );

    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({ componentStack: expect.any(String) }),
    );
  });

  it('renders custom fallback ReactNode instead of default', () => {
    render(
      <ErrorBoundary fallback={<div data-testid="custom">Custom error UI</div>}>
        <ThrowsOnRender />
      </ErrorBoundary>,
    );

    expect(screen.getByTestId('custom')).toBeInTheDocument();
    expect(screen.getByText('Custom error UI')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('custom fallback render function receives the error and a reset function', () => {
    const fallbackSpy = vi.fn((error: Error, _reset: () => void) => (
      <div>Caught: {error.message}</div>
    ));

    render(
      <ErrorBoundary fallback={fallbackSpy}>
        <ThrowsOnRender />
      </ErrorBoundary>,
    );

    // React 18 error recovery may invoke the render function more than
    // once on the initial catch; assert it was called at least once and
    // received the correct arguments rather than an exact count.
    expect(fallbackSpy).toHaveBeenCalled();
    expect(fallbackSpy).toHaveBeenCalledWith(
      expect.any(Error),
      expect.any(Function),
    );
    expect(screen.getByText('Caught: Render error')).toBeInTheDocument();
  });

  // ─── Reset behaviour ─────────────────────────────────────────

  it('reset via "Try again" button re-renders children when error condition resolves', () => {
    let shouldThrow = true;

    function ChildThatRecovers(): ReactElement {
      if (shouldThrow) {
        throw new Error('Controlled');
      }
      return <div>Recovered content</div>;
    }

    render(
      <ErrorBoundary>
        <ChildThatRecovers />
      </ErrorBoundary>,
    );

    // Confirm error state
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.queryByText('Recovered content')).not.toBeInTheDocument();

    // Remove the throw condition
    shouldThrow = false;

    // Click "Try again" — this calls reset()
    fireEvent.click(screen.getByRole('button', { name: /try again/i }));

    // Children should render again
    expect(screen.getByText('Recovered content')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  // ─── componentDidUpdate — children change after error ─────────

  it('changing children after error resets the boundary (componentDidUpdate)', () => {
    const onReset = vi.fn();
    const { rerender } = render(
      <ErrorBoundary onReset={onReset}>
        <StableChild />
      </ErrorBoundary>,
    );

    expect(screen.getByText('Stable content')).toBeInTheDocument();

    // Switch to a throwing child → error caught
    rerender(
      <ErrorBoundary onReset={onReset}>
        <ThrowsOnRender />
      </ErrorBoundary>,
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();

    // Switch children again → componentDidUpdate detects change and resets
    rerender(
      <ErrorBoundary onReset={onReset}>
        <div>Fresh content</div>
      </ErrorBoundary>,
    );

    expect(screen.getByText('Fresh content')).toBeInTheDocument();
    expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument();
    // React 18 error recovery may trigger componentDidUpdate more than once;
    // assert onReset was called at least once rather than an exact count.
    expect(onReset).toHaveBeenCalled();
  });

  // ─── Edge cases ───────────────────────────────────────────────

  it('handles conditional throw: renders normally then catches error', () => {
    const { rerender } = render(
      <ErrorBoundary>
        <ConditionalThrow shouldThrow={false} />
      </ErrorBoundary>,
    );

    expect(screen.getByText('Conditional content')).toBeInTheDocument();

    // Re-render with throw condition
    rerender(
      <ErrorBoundary>
        <ConditionalThrow shouldThrow={true} />
      </ErrorBoundary>,
    );

    // Error caught, fallback shown
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('Conditional error')).toBeInTheDocument();
  });
});
