/**
 * RootErrorBoundary — catches render errors at the route level.
 *
 * Uses a class component because React 18 Error Boundaries require
 * `componentDidCatch` / `getDerivedStateFromError` — no hooks equivalent exists.
 *
 * @see docs/plans/phase-1-core-infrastructure.md §10, §31
 *
 * Accessibility:
 *  - Uses `<main id="main-content">` for skip-link target
 *  - Error details are announced via `aria-live="polite"`
 *  - Focus is moved to the error heading on mount
 */
import { Component, type ErrorInfo, type ReactNode } from 'react';

import { ErrorBoundaryFallback } from './ErrorBoundaryFallback';

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
