/**
 * DashboardSkeleton — loading skeleton matching the dashboard layout.
 *
 * Shows placeholder shapes for StatGrid (4 cards) and RecentActivityList
 * (3 rows). Hidden from assistive technology via `aria-hidden`; the
 * parent container uses `role="status"` to announce loading.
 *
 * @see docs/plans/phase-2-data-and-features.md §7.1
 */
import { type ReactElement } from 'react';

import { Skeleton } from '@/shared/components/Skeleton';

import styles from './DashboardSkeleton.module.css';
import { StatGrid } from './StatGrid';

/**
 * Full-page skeleton matching the dashboard layout.
 *
 * @example
 *   {isLoading && <DashboardSkeleton />}
 */
export function DashboardSkeleton(): ReactElement {
  return (
    <div className={styles.wrapper} role="status" aria-label="Dashboard is loading">
      <div className={styles.header}>
        <Skeleton width="12rem" height="1.5rem" />
      </div>
      <StatGrid isLoading />
      <div className={styles.activitySection} aria-hidden="true">
        <Skeleton width="10rem" height="1.125rem" />
        <div className={styles.activityRows}>
          {[1, 2, 3].map((i) => (
            <div key={i} className={styles.activityRow}>
              <Skeleton width="70%" height="0.875rem" />
              <Skeleton width="30%" height="0.75rem" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
