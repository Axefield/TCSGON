/**
 * Router definitions — Phase 1.
 *
 * @see docs/plans/phase-1-core-infrastructure.md §10, §30
 *
 * Route tree:
 * ```
 * <RootErrorBoundary>
 *   <AppShell>                              ← layout route
 *     <RequireAuth>                         ← auth guard
 *       /dashboard  → DashboardPage (lazy)
 *       /settings   → SettingsPageStub (lazy)
 *     </RequireAuth>
 *     /login     → LoginPage (lazy)
 *     /          → redirect to /dashboard
 *     *          → NotFoundPage (lazy)
 *   </AppShell>
 * </RootErrorBoundary>
 * ```
 *
 * Rationale for layout route pattern (plan §10):
 * - AppShell wraps all pages in the same shell (TopBar, Sidebar, SkipLink)
 * - RequireAuth as a layout element prevents flash of authed pages
 * - Route-level Suspense via `lazy` — no manual Suspense boundaries needed
 * - RouteErrorElement for loader/action errors on each branch
 */

import { createBrowserRouter, type RouteObject } from 'react-router-dom';

import { AppShell } from '@/layouts/AppShell';

import { RequireAuth } from './RequireAuth';
import { RouteErrorElement } from './RouteErrorElement';
import { RouteFallback } from './RouteFallback';

const ROUTES = {
  root: '/',
  login: '/login',
  dashboard: '/dashboard',
  settings: '/settings',
} as const;

export type RoutePath = (typeof ROUTES)[keyof typeof ROUTES];

const authedRoutes: RouteObject[] = [
  {
    path: ROUTES.dashboard,
    lazy: () => import('@/features/dashboard/pages/DashboardPage').then((m) => ({ Component: m.DashboardPage })),
    handle: { crumb: 'Dashboard' },
    errorElement: <RouteErrorElement />,
  },
  {
    path: ROUTES.settings,
    lazy: () => import('@/features/auth/pages/SettingsPageStub').then((m) => ({ Component: m.SettingsPageStub })),
    handle: { crumb: 'Settings' },
    errorElement: <RouteErrorElement />,
  },
];

const routes: RouteObject[] = [
  {
    path: ROUTES.root,
    element: <AppShell />,
    errorElement: <RouteErrorElement />,
    hydrateFallbackElement: <RouteFallback />,
    children: [
      {
        element: <RequireAuth />,
        children: authedRoutes,
      },
      {
        path: ROUTES.login,
        lazy: () => import('@/features/auth/pages/LoginPage').then((m) => ({ Component: m.LoginPage })),
        handle: { crumb: 'Sign in' },
      },
      {
        index: true,
        lazy: () => import('@/features/dashboard/pages/DashboardPage').then((m) => ({ Component: m.DashboardPage })),
      },
      {
        path: '*',
        lazy: () => import('@/features/auth/pages/NotFoundPage').then((m) => ({ Component: m.NotFoundPage })),
      },
    ],
  },
];

/**
 * Create the application router.
 */
export function createAppRouter(): ReturnType<typeof createBrowserRouter> {
  return createBrowserRouter(routes);
}

export { ROUTES };
