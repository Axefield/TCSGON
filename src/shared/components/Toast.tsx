/**
 * Toast — single notification card.
 *
 * @see docs/plans/phase-1-core-infrastructure.md §10, §34, §37
 *
 * Uses `role="status"` for info/success/warning toasts and `role="alert"`
 * for errors. The parent `ToastRegion` manages the live-region container.
 *
 * Usage:
 * ```tsx
 * <Toast entry={entry} onDismiss={handleDismiss} />
 * ```
 */
import type { ReactElement } from 'react';

import type { ToastEntry } from '@/shared/types/toast';

import styles from './Toast.module.css';

export interface ToastProps {
  readonly entry: ToastEntry;
  readonly onDismiss: (id: ToastEntry['id']) => void;
}

export function Toast({ entry, onDismiss }: ToastProps): ReactElement {
  const isError = entry.kind === 'error';

  return (
    <div
      className={`${styles.toast} ${styles[entry.kind] ?? ''}`}
      role={isError ? 'alert' : 'status'}
      aria-live={isError ? 'assertive' : 'polite'}
    >
      <div className={styles.body}>
        <p className={styles.message}>{entry.message}</p>
        {entry.description ? <p className={styles.description}>{entry.description}</p> : null}
      </div>
      <button
        type="button"
        className={styles.dismiss}
        onClick={() => onDismiss(entry.id)}
        aria-label="Dismiss notification"
      >
        &times;
      </button>
    </div>
  );
}

/**
 * Compound component namespace.
 * Usage: `<Toast.Region />` or `<Toast entry={...} onDismiss={...} />`
 */
import { ToastRegion } from './ToastRegion';
Toast.Region = ToastRegion;
