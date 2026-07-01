/**
 * DashboardPage — replaces the Phase 1 stub with a real data-driven dashboard.
 *
 * Orchestrates StatGrid, RecentActivityList, ErrorDisplay, and
 * DashboardSkeleton based on the query state from useDashboard.
 *
 * @see docs/plans/phase-2-data-and-features.md §7.1
 */
import { type ReactElement } from 'react';

import { ErrorDisplay } from '@/shared/components/ErrorDisplay';
import { useDashboard } from '@/features/dashboard/hooks/useDashboard';

import { DashboardSkeleton } from '@/features/dashboard/components/DashboardSkeleton';
import { StatGrid, type StatGridItem } from '@/features/dashboard/components/StatGrid';
import { RecentActivityList } from '@/features/dashboard/components/RecentActivityList';

import styles from './DashboardPage.module.css';

function buildStatItems(
  stats: ReturnType<typeof useDashboard>['stats'],
): ReadonlyArray<StatGridItem> {
  if (!stats) return [];

  return [
    { label: 'Total Projects', value: stats.totalProjects },
    { label: 'Active Projects', value: stats.activeProjects },
    { label: 'Team Members', value: stats.teamMembers },
    {
      label: 'Completion Rate',
      value: `${Math.round(stats.completionRate)}%`,
    },
  ];
}

/**
 * Data-driven dashboard page.
 * Renders loading skeleton, error state, or live content.
 */
export function DashboardPage(): ReactElement {
  const { stats, isLoading, isError, error, refetch } = useDashboard();

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (isError && error) {
    return (
      <section className={styles.page}>
        <h1 className={styles.heading}>Dashboard</h1>
        <ErrorDisplay error={error} onRetry={() => void refetch()} />
      </section>
    );
  }

  const statItems = buildStatItems(stats);

  return (
    <section className={styles.page}>
      <h1 className={styles.heading}>Dashboard</h1>
      <StatGrid items={statItems} />
      <RecentActivityList
        {...(stats?.recentActivity ? { activities: stats.recentActivity } : {})}
        isLoading={false}
      />
    </section>
  );
}
