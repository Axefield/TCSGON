/**
 * RootErrorBoundary — catches render errors at the route level.
 *
 * @see docs/plans/phase-1-core-infrastructure.md §10, §31
 *
 * Accessibility:
 *  - Uses `<main id="main-content">` for skip-link target
 *  - Error details are announced via `aria-live="polite"`
 *  - Focus is moved to the error heading on mount
 */
import { Component, type ErrorInfo, type ReactElement, type ReactNode } from 'react';

export interface RootErrorBoundaryProps {
  readonly children: ReactNode;
}

export interface RootErrorBoundaryState {
  readonly error: Error | null;
}

export class RootErrorBoundary extends Component<RootErrorBoundaryProps, RootErrorBoundaryState> {
  override state: RootErrorBoundaryState = { error: null };
  private headingEl: HTMLHeadingElement | null = null;

  static getDerivedStateFromError(error: Error): RootErrorBoundaryState {
    return { error };
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('[RootErrorBoundary]', error, info.componentStack);
  }

  override componentDidUpdate(_prevProps: RootErrorBoundaryProps, prevState: RootErrorBoundaryState): void {
    if (!prevState.error && this.state.error) {
      this.headingEl?.focus();
    }
  }

  private handleHeadingRef = (el: HTMLHeadingElement | null): void => {
    this.headingEl = el;
  };

  override render(): ReactNode {
    if (this.state.error) {
      return (
        <ErrorBoundaryFallback
          error={this.state.error}
          onReset={() => this.setState({ error: null })}
          headingRef={this.handleHeadingRef}
        />
      );
    }

    return this.props.children;
  }
}

export interface ErrorBoundaryFallbackProps {
  readonly error: Error;
  readonly onReset: () => void;
  readonly headingRef: (el: HTMLHeadingElement | null) => void;
}

export function ErrorBoundaryFallback({
  error,
  onReset,
  headingRef,
}: ErrorBoundaryFallbackProps): ReactElement {
  return (
    <main
      id="main-content"
      style={{
        padding: '2rem',
        maxWidth: '32rem',
        margin: '0 auto',
        textAlign: 'center',
      }}
      aria-live="polite"
    >
      <h1
        ref={headingRef}
        tabIndex={-1}
        style={{ fontSize: 'var(--font-size-2xl, 1.5rem)', marginBottom: '1rem' }}
      >
        Something went wrong
      </h1>
      <p style={{ color: 'var(--color-fg-muted, #64748b)', marginBottom: '1.5rem' }}>
        {error.message}
      </p>
      <button
        type="button"
        onClick={onReset}
        style={{
          padding: '0.5rem 1rem',
          background: 'var(--color-primary, #0b3d91)',
          color: '#ffffff',
          border: 'none',
          borderRadius: 'var(--radius-md, 0.5rem)',
          cursor: 'pointer',
        }}
      >
        Try again
      </button>
    </main>
  );
}
