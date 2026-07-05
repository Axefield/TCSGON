/**
 * useLockedBody — prevents body scroll while an overlay is open.
 *
 * Compensates for scrollbar disappearance by setting `padding-right`
 * equal to the scrollbar width, preventing layout shift.
 *
 * Stack-safe: uses a module-level counter so nested overlays
 * (e.g., modal → confirm dialog) don't restore scroll prematurely.
 *
 * @param locked — `true` to lock, `false` to unlock.
 *
 * @example
 *   useLockedBody(isModalOpen);
 *
 * Accessibility:
 *  - Scroll locking is standard for modals/drawers.
 *  - Padding compensation prevents content reflow.
 */
import { useEffect, useRef } from 'react';

/** Module-level counter shared across all useLockedBody instances. */
let lockCount = 0;
/** Cached scrollbar width, measured once. */
let scrollbarWidth = 0;

function measureScrollbarWidth(): number {
  if (typeof window === 'undefined') return 0;
  return window.innerWidth - document.documentElement.clientWidth;
}

export function useLockedBody(locked: boolean): void {
  const originalOverflowRef = useRef<string>('');
  const originalPaddingRef = useRef<string>('');

  useEffect(() => {
    if (locked) {
      if (lockCount === 0) {
        const body = document.body;
        originalOverflowRef.current = body.style.overflow;
        originalPaddingRef.current = body.style.paddingRight;

        scrollbarWidth = scrollbarWidth || measureScrollbarWidth();
        body.style.overflow = 'hidden';
        if (scrollbarWidth > 0) {
          body.style.paddingRight = `${scrollbarWidth}px`;
        }
      }
      lockCount += 1;
    }

    return () => {
      if (locked) {
        lockCount -= 1;
        if (lockCount <= 0) {
          lockCount = 0;
          const body = document.body;
          body.style.overflow = originalOverflowRef.current;
          body.style.paddingRight = originalPaddingRef.current;
        }
      }
    };
  }, [locked]);
}
