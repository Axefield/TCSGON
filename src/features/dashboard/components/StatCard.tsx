/**
 * StatCard — single KPI metric card.
 *
 * Displays a label, numeric value, and optional trend indicator.
 * Shows a skeleton placeholder when `isLoading` is true.
 *
 * @see docs/plans/phase-2-data-and-features.md §7.1
 */
import { type ReactElement } from 'react';

import { Skeleton } from '@/shared/components/Skeleton';

import styles from './StatCard.module.css';

export interface StatCardProps {
  readonly label: string;
  readonly value: string | number;
  readonly trend?: {
    readonly direction: 'up' | 'down' | 'neutral';
    readonly label: string;
  };
  readonly isLoading?: boolean;
}

/**
 * Renders a single KPI card.
 *
 * @example
 *   <StatCard
 *     label="Total Projects"
 *     value={42}
 *     trend={{ direction: 'up', label: '+12% vs last month' }}
 *   />
 */
export function StatCard({ label, value, trend, isLoading = false }: StatCardProps): ReactElement {
  if (isLoading) {
    return (
      <div className={styles.card} role="region" aria-label={label}>
        <Skeleton width="60%" height="0.875rem" />
        <Skeleton width="40%" height="2rem" />
      </div>
    );
  }

  return (
    <div className={styles.card} role="region" aria-label={label}>
      <span className={styles.label}>{label}</span>
      <span className={styles.value}>{value}</span>
      {trend && (
        <span
          className={`${styles.trend} ${styles[trend.direction]}`}
          aria-label={trend.label}
        >
          {trend.direction === 'up' ? '↑' : trend.direction === 'down' ? '↓' : '→'}
          {' '}
          {trend.label}
        </span>
      )}
    </div>
  );
}
