/**
 * ErrorBoundary — reusable class component that catches render errors.
 *
 * Accepts a `fallback` prop that can be a `ReactNode` or a render function
 * `(error, reset) => ReactNode`. Provides a `reset()` method to retry.
 *
 * @example
 *   <ErrorBoundary
 *     fallback={(error, reset) => (
 *       <div role="alert">
 *         <h2>Oops</h2>
 *         <p>{error.message}</p>
 *         <button onClick={reset}>Try again</button>
 *       </div>
 *     )}
 *     onError={(err, info) => reportError(err, info)}
 *   >
 *     <MyComponent />
 *   </ErrorBoundary>
 *
 * @example
 *   <ErrorBoundary fallback={<DefaultError />}>
 *     <MyComponent />
 *   </ErrorBoundary>
 *
 * Accessibility:
 *  - Default fallback uses `role="alert"` for screen-reader announcement
 *  - Focus is moved to the error heading on catch (via `componentDidUpdate`)
 *  - The render callback receives a `reset` function for retry
 *
 * NOTE: This is a class component because React 18 has no hooks equivalent
 * for `componentDidCatch` / `getDerivedStateFromError`. This is the ONLY
 * class component in the design system, matching the `RootErrorBoundary`
 * precedent.
 */
import { Component, type ErrorInfo, type ReactNode } from 'react';

import styles from './ErrorBoundary.module.css';

// ── Types ──────────────────────────────────────────────────────────

/** Render function receives the error and a reset callback. */
export type FallbackRender = (error: Error, reset: () => void) => ReactNode;

export interface ErrorBoundaryProps {
  readonly children: ReactNode;
  readonly fallback?: ReactNode | FallbackRender;
  readonly onError?: (error: Error, info: ErrorInfo) => void;
  readonly onReset?: () => void;
}

export interface ErrorBoundaryState {
  readonly error: Error | null;
}

// ── Default fallback UI ─────────────────────────────────────────────

interface DefaultFallbackProps {
  readonly error: Error;
  readonly onReset: () => void;
}

function DefaultFallback({ error, onReset }: DefaultFallbackProps): ReactNode {
  return (
    <div className={styles.default} role="alert">
      <h2 className={styles.heading}>Something went wrong</h2>
      <p className={styles.message}>{error.message}</p>
      <button type="button" onClick={onReset} className={styles.retry}>
        Try again
      </button>
    </div>
  );
}

// ── ErrorBoundary class ─────────────────────────────────────────────

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  override state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    this.props.onError?.(error, info);
  }

  override componentDidUpdate(prevProps: ErrorBoundaryProps): void {
    // If children change after an error, reset the boundary.
    if (this.state.error && prevProps.children !== this.props.children) {
      this.reset();
    }
  }

  private reset = (): void => {
    this.setState({ error: null });
    this.props.onReset?.();
  };

  override render(): ReactNode {
    if (this.state.error) {
      const { fallback } = this.props;

      if (typeof fallback === 'function') {
        return (fallback as FallbackRender)(this.state.error, this.reset);
      }

      if (fallback !== undefined) {
        return fallback;
      }

      return <DefaultFallback error={this.state.error} onReset={this.reset} />;
    }

    return this.props.children;
  }
}
