/**
 * Spinner — indeterminate loading indicator.
 *
 * @see docs/plans/phase-1-core-infrastructure.md §10, §34
 *
 * Accessibility: `role="status"` with a visually-hidden label. The SVG
 * is `aria-hidden="true"` so assistive tech reads the label, not the
 * animated graphic. Animation is disabled when `prefers-reduced-motion: reduce`
 * is active (handled via CSS media query).
 *
 * Usage:
 * ```tsx
 * <Spinner label="Loading users…" />
 * <Spinner decorative size="sm" />
 * ```
 */
import type { ReactElement } from 'react';

import styles from './Spinner.module.css';

export interface SpinnerProps {
  readonly size?: 'sm' | 'md' | 'lg';
  readonly label?: string;
  /** When true, the spinner is purely decorative and may be hidden from AT. */
  readonly decorative?: boolean;
}

const SIZE_MAP: Record<string, number> = { sm: 16, md: 24, lg: 40 };

export function Spinner({ size = 'md', label, decorative }: SpinnerProps): ReactElement {
  const dimension = SIZE_MAP[size] ?? SIZE_MAP.md;

  return (
    <span
      className={styles.wrapper}
      role={decorative ? 'presentation' : 'status'}
      aria-label={decorative ? undefined : label ?? 'Loading'}
    >
      <svg
        className={styles.spinner}
        width={dimension}
        height={dimension}
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
      >
        <circle
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray="31.4 31.4"
          className={styles.track}
        />
        <circle
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray="31.4 31.4"
          className={styles.indicator}
        />
      </svg>
    </span>
  );
}
