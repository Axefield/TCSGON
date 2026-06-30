/**
 * Route definitions — Phase 0 placeholder.
 *
 * Phase 1 will introduce createBrowserRouter with lazy routes per roadmap §1.1:
 *   - Public routes: /login, /signup, /forgot-password
 *   - Authed routes (under RequireAuth): /dashboard, /settings
 *   - 404 catch-all
 *   - Route-level ErrorBoundary
 *
 * Keeping the module here so the folder exists and the alias `@/routes` is
 * already resolvable from day one — avoids future re-pinning.
 */

export const ROUTES = {
  root: '/',
  login: '/login',
  signup: '/signup',
  forgotPassword: '/forgot-password',
  dashboard: '/dashboard',
  settings: '/settings',
} as const;

export type RoutePath = (typeof ROUTES)[keyof typeof ROUTES];