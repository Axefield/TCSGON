/**
 * ToastRegion — live-region container for toast notifications.
 *
 * @see docs/plans/phase-1-core-infrastructure.md §10, §15, §37
 *
 * Renders two ARIA live regions:
 *  1. Polite region for info/success/warning toasts
 *  2. Assertive region (`role="alert"`) for error toasts
 *
 * This prevents double-announcement: a toast that is both `role="alert"`
 * (individual toast) and inside an `aria-live="polite"` region would be
 * announced twice by some screen readers. By splitting into two regions,
 * each toast gets exactly one announcement.
 *
 * Mounted once at `<AppShell>` boot — never conditionally rendered.
 *
 * Usage:
 * ```tsx
 * <ToastRegion />
 * ```
 */
import type { ReactElement } from 'react';

import type { ToastEntry } from '@/shared/types/toast';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { dismissToast, selectToasts } from '@/store/slices/uiSlice';

import { Toast } from './Toast';
import styles from './ToastRegion.module.css';

export function ToastRegion(): ReactElement {
  const toasts = useAppSelector(selectToasts);
  const dispatch = useAppDispatch();

  const infoToasts = toasts.filter((t) => t.kind !== 'error');
  const errorToasts = toasts.filter((t) => t.kind === 'error');

  const handleDismiss = (id: ToastEntry['id']): void => {
    dispatch(dismissToast(id));
  };

  return (
    <>
      {/* Polite region — non-critical notifications */}
      <div
        className={styles.region}
        aria-live="polite"
        aria-relevant="additions removals"
        aria-label="Notifications"
      >
        {infoToasts.map((t) => (
          <Toast key={t.id} entry={t} onDismiss={handleDismiss} />
        ))}
      </div>

      {/* Assertive region — errors only, avoids double-announcement */}
      <div
        className={styles.region}
        role="alert"
        aria-relevant="additions removals"
        aria-label="Error notifications"
      >
        {errorToasts.map((t) => (
          <Toast key={t.id} entry={t} onDismiss={handleDismiss} />
        ))}
      </div>
    </>
  );
}
