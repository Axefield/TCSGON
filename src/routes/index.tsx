/**
 * Router definitions — Phase 1.
 *
 * @see docs/plans/phase-1-core-infrastructure.md §10, §30
 *
 * Route tree:
 * ```
 * <RootErrorBoundary>
 *   <AppShell>                              ← layout route (includes SessionCheck)
 *     <RequireAuth>                         ← auth guard
 *       /dashboard  → DashboardPage (lazy)
 *       /settings   → SettingsPage (lazy)
 *     </RequireAuth>
 *     <RedirectIfAuth>                      ← redirects authed users away
 *       /login           → LoginPage (lazy)
 *       /signup          → SignupPage (lazy)
 *       /forgot-password → ForgotPasswordPage (lazy)
 *       /reset-password  → ResetPasswordPage (lazy)
 *     </RedirectIfAuth>
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

import { RedirectIfAuth } from './RedirectIfAuth';
import { RequireAuth } from './RequireAuth';
import { RouteErrorElement } from './RouteErrorElement';
import { RouteFallback } from './RouteFallback';

const ROUTES = {
  root: '/',
  login: '/login',
  signup: '/signup',
  forgotPassword: '/forgot-password',
  resetPassword: '/reset-password',
  dashboard: '/dashboard',
  projects: '/projects',
  projectCreate: '/projects/new',
  projectDetail: '/projects/:id',
  projectEdit: '/projects/:id/edit',
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
    lazy: () => import('@/features/auth/pages/SettingsPage').then((m) => ({ Component: m.SettingsPage })),
    handle: { crumb: 'Settings' },
    errorElement: <RouteErrorElement />,
  },
  {
    path: ROUTES.projects,
    lazy: () => import('@/features/projects/pages/ProjectListPage').then((m) => ({ Component: m.ProjectListPage })),
    handle: { crumb: 'Projects' },
    errorElement: <RouteErrorElement />,
  },
  {
    path: ROUTES.projectCreate,
    lazy: () => import('@/features/projects/pages/ProjectCreatePage').then((m) => ({ Component: m.ProjectCreatePage })),
    handle: { crumb: 'New Project' },
    errorElement: <RouteErrorElement />,
  },
  {
    path: ROUTES.projectDetail,
    lazy: () => import('@/features/projects/pages/ProjectDetailPage').then((m) => ({ Component: m.ProjectDetailPage })),
    handle: { crumb: 'Project Detail' },
    errorElement: <RouteErrorElement />,
  },
  {
    path: ROUTES.projectEdit,
    lazy: () => import('@/features/projects/pages/ProjectEditPage').then((m) => ({ Component: m.ProjectEditPage })),
    handle: { crumb: 'Edit Project' },
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
        element: <RedirectIfAuth />,
        children: [
          {
            path: ROUTES.login,
            lazy: () => import('@/features/auth/pages/LoginPage').then((m) => ({ Component: m.LoginPage })),
            handle: { crumb: 'Sign in' },
          },
          {
            path: ROUTES.signup,
            lazy: () => import('@/features/auth/pages/SignupPage').then((m) => ({ Component: m.SignupPage })),
            handle: { crumb: 'Create account' },
          },
          {
            path: ROUTES.forgotPassword,
            lazy: () => import('@/features/auth/pages/ForgotPasswordPage').then((m) => ({ Component: m.ForgotPasswordPage })),
            handle: { crumb: 'Forgot password' },
          },
          {
            path: ROUTES.resetPassword,
            lazy: () => import('@/features/auth/pages/ResetPasswordPage').then((m) => ({ Component: m.ResetPasswordPage })),
            handle: { crumb: 'Reset password' },
          },
        ],
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
