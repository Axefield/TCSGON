/**
 * RouteErrorElement — displayed when a route loader/action throws.
 *
 * @see docs/plans/phase-1-core-infrastructure.md §10, §31
 *
 * Accessibility:
 *  - Focus is moved to the error heading on mount (WCAG SC 2.4.3, SC 4.1.3)
 *  - Uses `<main id="main-content">` for skip-link target
 */
import { useEffect, useRef, type ReactElement } from 'react';
import { isRouteErrorResponse, useRouteError } from 'react-router-dom';

export function RouteErrorElement(): ReactElement {
  const error = useRouteError();
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  let message = 'An unexpected error occurred.';

  if (isRouteErrorResponse(error)) {
    message = error.statusText ?? `${error.status}`;
  } else if (error instanceof Error) {
    message = error.message;
  }

  return (
    <main
      id="main-content"
      style={{
        padding: '2rem',
        maxWidth: '32rem',
        margin: '0 auto',
        textAlign: 'center',
      }}
    >
      <h1
        ref={headingRef}
        tabIndex={-1}
        style={{ fontSize: 'var(--font-size-2xl, 1.5rem)', marginBottom: '1rem' }}
      >
        Page error
      </h1>
      <p style={{ color: 'var(--color-fg-muted, #64748b)', marginBottom: '1.5rem' }}>
        {message}
      </p>
      <a
        href="/"
        style={{
          color: 'var(--color-primary, #0b3d91)',
          textDecoration: 'underline',
        }}
      >
        Go to home
      </a>
    </main>
  );
}
