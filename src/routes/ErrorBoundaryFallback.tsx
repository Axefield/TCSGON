/**
 * ErrorBoundaryFallback — UI shown when RootErrorBoundary catches an error.
 *
 * @see docs/plans/phase-1-core-infrastructure.md §10, §31
 *
 * Accessibility:
 *  - Uses `<main id="main-content">` for skip-link target
 *  - Error details are announced via `aria-live="polite"`
 *  - headingRef allows the parent to manage focus
 */
import { type ReactElement } from 'react';

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
