/**
 * DashboardPage — placeholder dashboard for authenticated users.
 *
 * @see docs/plans/phase-1-core-infrastructure.md §10
 */
import { type ReactElement } from 'react';

import { useAuth } from '@/features/auth/hooks/useAuth';

export function DashboardPage(): ReactElement {
  const { user } = useAuth();

  return (
    <section>
      <h1 style={{ margin: '0 0 0.5rem' }}>Dashboard</h1>
      <p
        style={{
          color: 'var(--color-fg-muted, #64748b)',
          fontSize: 'var(--font-size-lg, 1.125rem)',
        }}
      >
        Welcome, {user?.name ?? 'User'}.
      </p>
    </section>
  );
}
