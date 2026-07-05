/**
 * Modal — accessible dialog overlay with focus trap, body scroll lock,
 * and configurable close behavior.
 *
 * @example
 *   const [open, setOpen] = useState(false);
 *
 *   <button onClick={() => setOpen(true)}>Open modal</button>
 *   <Modal
 *     open={open}
 *     onClose={() => setOpen(false)}
 *     title="Edit project"
 *     size="md"
 *   >
 *     <form>...</form>
 *   </Modal>
 *
 * Accessibility:
 *  - `role="dialog"` + `aria-modal="true"` + `aria-labelledby` on title
 *  - Focus trap: Tab/Shift+Tab cycle through focusable elements only
 *  - Backdrop click to close (configurable via `closeOnBackdrop`)
 *  - Esc key to close (configurable via `closeOnEsc`)
 *  - Return focus to trigger element on close
 *  - Body scroll locked while open
 *  - Entrance animation disabled when `prefers-reduced-motion: reduce`
 */
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  type ReactElement,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';

import { useFocusTrap, getFocusableElements } from '@/shared/hooks/useFocusTrap';
import { useLockedBody } from '@/shared/hooks/useLockedBody';

import styles from './Modal.module.css';

export interface ModalProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly title: string;
  readonly children: ReactNode;
  readonly size?: 'sm' | 'md' | 'lg';
  readonly closeOnBackdrop?: boolean;
  readonly closeOnEsc?: boolean;
}

export function Modal({
  open,
  onClose,
  title,
  children,
  size = 'md',
  closeOnBackdrop = true,
  closeOnEsc = true,
}: ModalProps): ReactElement | null {
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<Element | null>(null);

  // ── Focus management: save on open, restore on close ───────────────
  useEffect(() => {
    if (open) {
      previousActiveElement.current = document.activeElement;

      // Focus the first focusable element inside the dialog.
      requestAnimationFrame(() => {
        const focusable = getFocusableElements(dialogRef.current);
        const target = focusable[0] ?? dialogRef.current;
        target?.focus();
      });
    } else if (previousActiveElement.current instanceof HTMLElement) {
      // Only restore if the element is still in the DOM.
      if (document.body.contains(previousActiveElement.current)) {
        previousActiveElement.current.focus();
      }
      previousActiveElement.current = null;
    }
  }, [open]);

  // ── Shared hooks ──────────────────────────────────────────────────
  useFocusTrap(dialogRef, open);
  useLockedBody(open);

  // ── Event handlers ─────────────────────────────────────────────────
  const handleEscKey = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    },
    [onClose],
  );

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      // Only close when clicking the backdrop itself, not the dialog.
      if (e.target === e.currentTarget) {
        onClose();
      }
    },
    [onClose],
  );

  if (!open) return null;

  const dialogClass = `${styles.dialog} ${styles[size]}`;

  return createPortal(
    <div
      className={styles.backdrop}
      role="presentation"
      onClick={closeOnBackdrop ? handleBackdropClick : undefined}
      onKeyDown={closeOnEsc ? handleEscKey : undefined}
    >
      <div
        ref={dialogRef}
        className={dialogClass}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <div className={styles.header}>
          <h2 id={titleId} className={styles.title}>
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className={styles.close}
            aria-label="Close dialog"
          >
            &times;
          </button>
        </div>
        <div className={styles.content}>{children}</div>
      </div>
    </div>,
    document.body,
  );
}
