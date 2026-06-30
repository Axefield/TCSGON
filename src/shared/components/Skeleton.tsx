/**
 * Skeleton — shimmer placeholder for content that is loading.
 *
 * @see docs/plans/phase-1-core-infrastructure.md §10, §34
 *
 * Accessibility:
 *  - When used decoratively (no `label`): `aria-hidden="true"`
 *  - When used meaningfully: `role="status"` + `aria-label`
 *  - Shimmer animation is disabled in `prefers-reduced-motion: reduce` (CSS)
 *
 * Usage:
 * ```tsx
 * <Skeleton width={200} height={20} />
 * <Skeleton width="100%" height={40} label="Loading card…" />
 * ```
 */
import type { ReactElement } from 'react';

import styles from './Skeleton.module.css';

export interface SkeletonProps {
  readonly width?: number | string;
  readonly height?: number | string;
  readonly radius?: number;
  readonly label?: string;
}

export function Skeleton({
  width = '100%',
  height = '1rem',
  radius,
  label,
}: SkeletonProps): ReactElement {
  return (
    <span
      className={styles.skeleton}
      role={label ? 'status' : 'presentation'}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      style={{
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height,
        borderRadius: radius !== undefined ? `${radius}px` : undefined,
      }}
    />
  );
}
