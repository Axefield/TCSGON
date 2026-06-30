/**
 * StatGrid — responsive CSS Grid of StatCard components.
 *
 * Displays 1 column on small screens, 2 on medium, 4 on large.
 * Renders skeleton cards when `isLoading` is true.
 *
 * @see docs/plans/phase-2-data-and-features.md §7.1
 */
import { type ReactElement } from 'react';

import { StatCard } from './StatCard';
import styles from './StatGrid.module.css';

export interface StatGridItem {
  readonly label: string;
  readonly value: string | number;
  readonly trend?: {
    readonly direction: 'up' | 'down' | 'neutral';
    readonly label: string;
  };
}

export interface StatGridProps {
  readonly items?: ReadonlyArray<StatGridItem>;
  readonly isLoading?: boolean;
}

const SKELETON_ITEMS: ReadonlyArray<StatGridItem> = [
  { label: 'Total Projects', value: '—' },
  { label: 'Active Projects', value: '—' },
  { label: 'Team Members', value: '—' },
  { label: 'Completion Rate', value: '—' },
];

/**
 * Responsive grid of StatCards.
 *
 * @example
 *   <StatGrid
 *     items={[
 *       { label: 'Total Projects', value: 42 },
 *       { label: 'Active', value: 18, trend: { direction: 'up', label: '+3' } },
 *     ]}
 *   />
 */
export function StatGrid({ items = SKELETON_ITEMS, isLoading = false }: StatGridProps): ReactElement {
  return (
    <div className={styles.grid} role="region" aria-label="Key metrics">
      {items.map((item) => (
        <StatCard
          key={item.label}
          label={item.label}
          value={item.value}
          {...(item.trend !== undefined ? { trend: item.trend } : {})}
          isLoading={isLoading}
        />
      ))}
    </div>
  );
}
