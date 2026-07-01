/**
 * RecentActivityList — chronological list of recent project actions.
 *
 * @see docs/plans/phase-2-data-and-features.md §7.1
 */
import { type ReactElement } from 'react';

import type { RecentActivity } from '@/features/dashboard/api/dashboardApi';
import { Skeleton } from '@/shared/components/Skeleton';

import styles from './RecentActivityList.module.css';

export interface RecentActivityListProps {
  readonly activities?: ReadonlyArray<RecentActivity>;
  readonly isLoading?: boolean;
}

function formatRelativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  const diffHr = Math.floor(diffMs / 3_600_000);
  const diffDay = Math.floor(diffMs / 86_400_000);

  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  return new Date(iso).toLocaleDateString();
}

/**
 * List of recent activity items.
 *
 * @example
 *   <RecentActivityList
 *     activities={stats.recentActivity}
 *     isLoading={isLoading}
 *   />
 */
export function RecentActivityList({
  activities = [],
  isLoading = false,
}: RecentActivityListProps): ReactElement {
  return (
    <div className={styles.wrapper}>
      <h2 className={styles.heading}>Recent Activity</h2>
      {isLoading ? (
        <div className={styles.list} role="list" aria-label="Loading recent activity">
          {[1, 2, 3].map((i) => (
            <div key={i} className={styles.item} role="listitem">
              <Skeleton width="70%" height="0.875rem" />
              <Skeleton width="40%" height="0.75rem" />
            </div>
          ))}
        </div>
      ) : activities.length === 0 ? (
        <p className={styles.empty}>No recent activity.</p>
      ) : (
        <ul className={styles.list} aria-label="Recent activity">
          {activities.map((act) => (
            <li key={act.id} className={styles.item}>
              <span className={styles.message}>{act.message}</span>
              <span className={styles.time}>{formatRelativeTime(act.createdAt)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
