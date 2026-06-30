/**
 * useDashboard — view-model hook for the dashboard page.
 *
 * Composes dashboard queries into a single interface. Currently wraps
 * `useDashboardStats`; will compose additional queries in future phases.
 *
 * @see docs/plans/phase-2-data-and-features.md §7.4
 */
import { useDashboardStats } from '@/features/dashboard/api/dashboardApi';

export interface UseDashboardResult {
  readonly stats: ReturnType<typeof useDashboardStats>['stats'];
  readonly isLoading: boolean;
  readonly isError: boolean;
  readonly error: ReturnType<typeof useDashboardStats>['error'];
  readonly refetch: ReturnType<typeof useDashboardStats>['refetch'];
}

/**
 * View-model hook for the dashboard.
 *
 * @example
 *   const { stats, isLoading, error, refetch } = useDashboard();
 */
export function useDashboard(): UseDashboardResult {
  const { stats, isLoading, isError, error, refetch } = useDashboardStats();

  return { stats, isLoading, isError, error, refetch };
}
