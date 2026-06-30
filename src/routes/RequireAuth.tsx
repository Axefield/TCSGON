/**
 * RequireAuth — redirects unauthenticated users to /login?next=<current-path>.
 *
 * @see docs/plans/phase-1-core-infrastructure.md §10, §34, §40
 */
import { type ReactElement } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';

import { useAuth } from '@/features/auth/hooks/useAuth';

export function RequireAuth(): ReactElement {
  const { isAuthenticated, status } = useAuth();
  const location = useLocation();

  if (status === 'anonymous' && !isAuthenticated) {
    const next = encodeURIComponent(location.pathname + location.search + location.hash);
    return <Navigate to={`/login?next=${next}`} replace />;
  }

  return <Outlet />;
}
