/**
 * useFocusTrap — traps Tab/Shift+Tab cycling within a container.
 *
 * @example
 *   const dialogRef = useRef<HTMLDivElement>(null);
 *   useFocusTrap(dialogRef, isOpen);
 *
 * Accessibility:
 *  - First Tab at last focusable cycles to first.
 *  - Shift+Tab at first focusable cycles to last.
 *  - Only intercepts when focus would leave the container.
 */
import { useEffect, useRef, type RefObject } from 'react';

/**
 * Standard focusable elements selector, usable by consumer components
 * that need to find the initial focusable element on mount.
 */
export const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'textarea:not([disabled])',
  'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ');

export function getFocusableElements(
  container: HTMLElement | null,
): readonly HTMLElement[] {
  if (!container) return [];
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
}

export function useFocusTrap(
  containerRef: RefObject<HTMLElement | null>,
  active: boolean,
): void {
  // Use ref to store a stable keydown handler identity.
  const handlerRef = useRef<((e: KeyboardEvent) => void) | null>(null);

  useEffect(() => {
    if (!active || !containerRef.current) return;

    const container = containerRef.current;

    const handleKeyDown = (e: KeyboardEvent): void => {
      if (e.key !== 'Tab') return;

      const focusable = getFocusableElements(container);
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (!first || !last) return;

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    handlerRef.current = handleKeyDown;
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      handlerRef.current = null;
    };
  }, [active, containerRef]);
}
