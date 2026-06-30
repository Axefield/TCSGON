/**
 * lazy — lazy import factories for route-level code splitting.
 *
 * @see docs/plans/phase-1-core-infrastructure.md §10, §30
 *
 * Usage in route definition:
 * ```ts
 * { path: 'dashboard', lazy: () => import('@/features/auth/pages/DashboardPage').then(m => ({ Component: m.DashboardPage })) }
 * ```
 *
 * Each factory returns `{ Component: React.ComponentType }` for React Router's
 * lazy loading protocol (use `lazy` prop, not `element`).
 */

/**
 * Wraps a dynamic import into a RouteObject-compatible lazy loader.
 * Returns `Component: React.ComponentType | null` to satisfy
 * `exactOptionalPropertyTypes: true` (React Router expects `null`,
 * not `undefined`, for absent properties).
 */
import { type ComponentType } from 'react';

export function lazyRoute(
  importFn: () => Promise<{ default: ComponentType } | Record<string, ComponentType>>,
  exportName = 'default',
): () => Promise<{ Component: ComponentType | null }> {
  return async () => {
    const mod = await importFn();
    const Component = (mod as Record<string, ComponentType>)[exportName] ?? null;
    return { Component };
  };
}
