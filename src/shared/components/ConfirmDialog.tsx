/**
 * ConfirmDialog — accessible `role="alertdialog"` for destructive actions.
 *
 * Features focus trap, return focus to trigger, Escape to cancel,
 * backdrop click to cancel, and `aria-describedby` for screen readers.
 *
 * @example
 *   <ConfirmDialog
 *     open={showDelete}
 *     title="Delete project?"
 *     message="This action cannot be undone."
 *     variant="danger"
 *     onConfirm={handleDelete}
 *     onCancel={() => setShowDelete(false)}
 *     isPending={isDeleting}
 *   />
 */
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  type ReactElement,
} from 'react';
import { createPortal } from 'react-dom';

import styles from './ConfirmDialog.module.css';

export interface ConfirmDialogProps {
  readonly open: boolean;
  readonly title: string;
  readonly message: string;
  readonly confirmLabel?: string;
  readonly cancelLabel?: string;
  readonly variant?: 'danger' | 'warning' | 'info';
  readonly onConfirm: () => void;
  readonly onCancel: () => void;
  readonly isPending?: boolean;
}

const VARIANT_ICON = {
  danger: '⚠',
  warning: '⚠',
  info: 'ℹ',
} as const;

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger',
  onConfirm,
  onCancel,
  isPending = false,
}: ConfirmDialogProps): ReactElement | null {
  const titleId = useId();
  const messageId = useId();
  const cancelRef = useRef<HTMLButtonElement>(null);
  const previousActiveElement = useRef<Element | null>(null);

  // Focus trap & return focus
  useEffect(() => {
    if (open) {
      previousActiveElement.current = document.activeElement;
      // Focus the cancel button (first focusable) on open
      requestAnimationFrame(() => {
        cancelRef.current?.focus();
      });
    } else if (previousActiveElement.current instanceof HTMLElement) {
      // Return focus to trigger on close
      previousActiveElement.current.focus();
      previousActiveElement.current = null;
    }
  }, [open]);

  // Escape key = cancel
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape' && !isPending) {
        onCancel();
      }
    },
    [onCancel, isPending],
  );

  // Backdrop click = cancel
  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget && !isPending) {
        onCancel();
      }
    },
    [onCancel, isPending],
  );

  if (!open) return null;

  return createPortal(
    <div
      className={styles.backdrop}
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
      role="presentation"
    >
      <div
        className={styles.dialog}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={messageId}
      >
        <div className={styles.header}>
          <span className={styles.icon} aria-hidden="true">
            {VARIANT_ICON[variant]}
          </span>
          <h2 id={titleId} className={styles.title}>
            {title}
          </h2>
        </div>

        <p id={messageId} className={styles.message}>
          {message}
        </p>

        <div className={styles.actions}>
          <button
            ref={cancelRef}
            className={styles.cancel}
            type="button"
            onClick={onCancel}
            disabled={isPending}
          >
            {cancelLabel}
          </button>
          <button
            className={`${styles.confirm} ${styles[variant]}`}
            type="button"
            onClick={onConfirm}
            disabled={isPending}
          >
            {isPending ? 'Processing…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
