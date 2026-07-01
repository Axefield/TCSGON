/**
 * Dashboard feature module — public barrel.
 *
 * @see docs/plans/phase-2-data-and-features.md §7.1
 */
export { DashboardPage } from './pages/DashboardPage';
export { useDashboardStats } from './api/dashboardApi';
export type { DashboardStats, RecentActivity, ActivityType, UseDashboardStatsResult } from './api/dashboardApi';
