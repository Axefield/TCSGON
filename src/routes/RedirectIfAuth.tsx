/**
 * RedirectIfAuth — redirects authenticated users away from public-only pages.
 *
 * @see docs/plans/phase-1-core-infrastructure.md §10, §34
 */
import { type ReactElement } from 'react';
import { Navigate, Outlet } from 'react-router-dom';

import { useAuth } from '@/features/auth/hooks/useAuth';

export function RedirectIfAuth(): ReactElement | null {
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
