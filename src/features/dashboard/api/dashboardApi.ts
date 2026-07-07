/**
 * Dashboard API — Zod schemas, query key factory, and React Query hooks
 * for the dashboard feature module.
 *
 * @see docs/plans/phase-2-data-and-features.md §6.2
 */
import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { z } from 'zod';

import { useApiClient } from '@/shared/api/ApiClientContext';
import { ApiError } from '@/shared/api/errors';

// ─── Zod schemas ───────────────────────────────────────────────

export const ActivityTypeSchema = z.enum([
  'project_created',
  'project_updated',
  'status_changed',
  'member_added',
]);

export const RecentActivitySchema = z.object({
  id: z.string().min(1),
  type: ActivityTypeSchema,
  message: z.string().min(1),
  createdAt: z.string().datetime(),
  projectId: z.string().min(1),
});

export const DashboardStatsSchema = z.object({
  totalProjects: z.number().nonnegative(),
  activeProjects: z.number().nonnegative(),
  teamMembers: z.number().nonnegative(),
  completionRate: z.number().min(0).max(100),
  recentActivity: z.array(RecentActivitySchema),
});

export type ActivityType = z.infer<typeof ActivityTypeSchema>;
export type RecentActivity = z.infer<typeof RecentActivitySchema>;
export type DashboardStats = z.infer<typeof DashboardStatsSchema>;

// ─── Query key factory ─────────────────────────────────────────

export const dashboardKeys = {
  all: ['dashboard'] as const,
  stats: () => ['dashboard', 'stats'] as const,
};

// ─── Hook return type ──────────────────────────────────────────

export interface UseDashboardStatsResult {
  readonly stats: DashboardStats | undefined;
  readonly isLoading: boolean;
  readonly isError: boolean;
  readonly error: ApiError | null;
  readonly refetch: () => Promise<UseQueryResult<DashboardStats>>;
}

// ─── Hook ──────────────────────────────────────────────────────

/**
 * Fetch dashboard aggregate statistics.
 *
 * @returns A result object with `stats`, loading/error flags, and a
 *          `refetch` function for manual invalidation.
 *
 * @throws Never — errors are returned in the result object.
 *
 * @example
 *   const { stats, isLoading, error } = useDashboardStats();
 *   if (isLoading) return <DashboardSkeleton />;
 *   if (error) return <ErrorDisplay error={error} onRetry={refetch} />;
 */
export function useDashboardStats(): UseDashboardStatsResult {
  const apiClient = useApiClient();

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: dashboardKeys.stats(),
    queryFn: async ({ signal }) => {
      const result = await apiClient.request({
        method: 'GET',
        path: '/api/dashboard/stats',
        signal,
        schema: DashboardStatsSchema,
      });

      if (!result.ok) {
        throw result.error;
      }

      return result.data;
    },
  });

  return {
    stats: data,
    isLoading,
    isError,
    error: error instanceof ApiError ? error : null,
    refetch: refetch as UseDashboardStatsResult['refetch'],
  };
}
