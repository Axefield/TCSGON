/**
 * Tooltip — accessible hover/focus tooltip with configurable delays.
 *
 * Uses a wrapper `<span>` that manages events; no `forwardRef` needed.
 * The tooltip bubble is positioned absolutely relative to the wrapper
 * using CSS, with an arrow via `::after`.
 *
 * @example
 *   <Tooltip content="Delete item" position="top">
 *     <button onClick={handleDelete}>×</button>
 *   </Tooltip>
 *
 * Accessibility:
 *  - `role="tooltip"` on the floating bubble
 *  - `aria-describedby` on the trigger element linking to the tooltip
 *  - Shows on hover (`onMouseEnter`) AND keyboard focus (`onFocus`)
 *  - Hides on `onMouseLeave` and `onBlur`
 *  - Show delay 500ms / hide delay 200ms (configurable via props)
 *  - Respects `prefers-reduced-motion` (no animation when reduced)
 */
import {
  useCallback,
  useId,
  useRef,
  useState,
  type ReactElement,
  type ReactNode,
} from 'react';

import styles from './Tooltip.module.css';

export interface TooltipProps {
  readonly content: ReactNode;
  readonly children: ReactNode;
  readonly position?: 'top' | 'bottom' | 'left' | 'right';
  readonly showDelay?: number;
  readonly hideDelay?: number;
}

export function Tooltip({
  content,
  children,
  position = 'top',
  showDelay = 500,
  hideDelay = 200,
}: TooltipProps): ReactElement {
  const [visible, setVisible] = useState(false);
  const tooltipId = useId();

  const showTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  const clearTimers = useCallback(() => {
    if (showTimeoutRef.current) {
      clearTimeout(showTimeoutRef.current);
      showTimeoutRef.current = undefined;
    }
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = undefined;
    }
  }, []);

  const handleShow = useCallback(() => {
    clearTimers();
    showTimeoutRef.current = setTimeout(() => setVisible(true), showDelay);
  }, [clearTimers, showDelay]);

  const handleHide = useCallback(() => {
    clearTimers();
    hideTimeoutRef.current = setTimeout(() => setVisible(false), hideDelay);
  }, [clearTimers, hideDelay]);

  return (
    <span
      className={styles.wrapper}
      onMouseEnter={handleShow}
      onMouseLeave={handleHide}
      onFocus={handleShow}
      onBlur={handleHide}
    >
      <span
        aria-describedby={tooltipId}
        className={styles.trigger}
      >
        {children}
      </span>

      {visible ? (
        <span
          id={tooltipId}
          role="tooltip"
          className={`${styles.tooltip} ${styles[position]}`}
        >
          {content}
        </span>
      ) : null}
    </span>
  );
}
