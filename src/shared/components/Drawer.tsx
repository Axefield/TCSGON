/**
 * Drawer — slide-in panel overlay. Shares the same a11y contract as Modal
 * (`role="dialog"`, `aria-modal`, focus trap, body scroll lock) but slides
 * in from the left or right edge instead of appearing centered.
 *
 * @example
 *   const [open, setOpen] = useState(false);
 *
 *   <button onClick={() => setOpen(true)}>Open drawer</button>
 *   <Drawer open={open} onClose={() => setOpen(false)} title="Filters" side="right">
 *     <form>...</form>
 *   </Drawer>
 *
 * Accessibility:
 *  - Same as Modal: `role="dialog"`, `aria-modal="true"`, `aria-labelledby`
 *  - Focus trap via shared `useFocusTrap` hook
 *  - Body scroll lock via shared `useLockedBody` hook
 *  - Return focus to trigger element on close
 *  - Slide animation disabled when `prefers-reduced-motion: reduce`
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

import { Button } from './Button';
import styles from './Drawer.module.css';

export interface DrawerProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly title: string;
  readonly children: ReactNode;
  readonly side?: 'left' | 'right';
  readonly closeOnBackdrop?: boolean;
  readonly closeOnEsc?: boolean;
}

export function Drawer({
  open,
  onClose,
  title,
  children,
  side = 'right',
  closeOnBackdrop = true,
  closeOnEsc = true,
}: DrawerProps): ReactElement | null {
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<Element | null>(null);

  // ── Focus management ──────────────────────────────────────────────
  useEffect(() => {
    if (open) {
      previousActiveElement.current = document.activeElement;

      requestAnimationFrame(() => {
        const focusable = getFocusableElements(dialogRef.current);
        const target = focusable[0] ?? dialogRef.current;
        target?.focus();
      });
    } else if (previousActiveElement.current instanceof HTMLElement) {
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
      if (e.target === e.currentTarget) {
        onClose();
      }
    },
    [onClose],
  );

  if (!open) return null;

  const dialogClass = `${styles.dialog} ${styles[side]}`;

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
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            aria-label="Close drawer"
          >
            &times;
          </Button>
        </div>
        <div className={styles.content}>{children}</div>
      </div>
    </div>,
    document.body,
  );
}
