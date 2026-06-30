/**
 * RequireAuth — guards protected routes.
 *
 * - Authenticated: renders <Outlet /> (protected content).
 * - Authenticating: shows a loading spinner to prevent flash.
 * - Anonymous / Error: redirects to /login?next=<current-path>.
 *
 * @see docs/plans/phase-1-core-infrastructure.md §10, §34, §40
 */
import { type ReactElement } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';

import { useAuth } from '@/features/auth/hooks/useAuth';
import { Spinner } from '@/shared/components/Spinner';

export function RequireAuth(): ReactElement {
  const { status } = useAuth();
  const location = useLocation();

  if (status === 'authenticated') {
    return <Outlet />;
  }

  if (status === 'authenticating') {
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
        <Spinner label="Verifying session…" />
      </main>
    );
  }

  // Anonymous or error — redirect to login
  const next = encodeURIComponent(location.pathname + location.search + location.hash);
  return <Navigate to={`/login?next=${next}`} replace />;
}
