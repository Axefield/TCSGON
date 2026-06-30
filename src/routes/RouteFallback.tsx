/**
 * RouteFallback — Suspense fallback for route-level lazy loading.
 *
 * @see docs/plans/phase-1-core-infrastructure.md §10, §30
 */
import { type ReactElement } from 'react';

import { Spinner } from '@/shared/components/Spinner';

export function RouteFallback(): ReactElement {
  return (
    <main
      id="main-content"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '50vh',
      }}
    >
      <Spinner size="lg" label="Loading page…" />
    </main>
  );
}
