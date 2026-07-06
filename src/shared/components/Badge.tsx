/**
 * Badge — small, non-interactive visual indicator.
 *
 * Renders a `<span>` showing status, count, or category (e.g. "New", "3", "Active").
 * Purely presentational — no state, no side effects, no forwardRef.
 *
 * @example
 *   <Badge>New</Badge>
 *   <Badge variant="success" size="lg">Approved</Badge>
 *   <Badge variant="danger">3</Badge>
 *   <Badge variant="warning" size="sm">Pending</Badge>
 */
import type { ReactNode } from 'react';

import styles from './Badge.module.css';

export interface BadgeProps {
  readonly children: ReactNode;
  readonly variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info';
  readonly size?: 'sm' | 'md' | 'lg';
  readonly className?: string;
}

export function Badge({
  children,
  variant = 'default',
  size = 'md',
  className,
}: BadgeProps) {
  const classes = [
    styles.badge!,
    styles[variant]!,
    styles[size]!,
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');

  return <span className={classes}>{children}</span>;
}
