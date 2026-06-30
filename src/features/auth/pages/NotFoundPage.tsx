/**
 * NotFoundPage — 404 catch-all route.
 *
 * @see docs/plans/phase-1-core-infrastructure.md §10
 */
import { type ReactElement } from 'react';
import { Link } from 'react-router-dom';

export function NotFoundPage(): ReactElement {
  return (
    <section style={{ textAlign: 'center', padding: '4rem 1rem' }}>
      <h1 style={{ fontSize: 'var(--font-size-4xl, 3rem)', margin: '0 0 0.5rem' }}>
        404
      </h1>
      <p
        style={{
          color: 'var(--color-fg-muted, #64748b)',
          fontSize: 'var(--font-size-lg, 1.125rem)',
          marginBottom: '2rem',
        }}
      >
        This page could not be found.
      </p>
      <Link
        to="/"
        style={{
          color: 'var(--color-primary, #0b3d91)',
          textDecoration: 'underline',
        }}
      >
        Go home
      </Link>
    </section>
  );
}
