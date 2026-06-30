/**
 * usePrefersReducedMotion — subscribe to OS-level motion preference.
 *
 * @see docs/plans/phase-1-core-infrastructure.md §11, §39
 *
 * Returns `true` when the user prefers reduced motion. On change, dispatches
 * `setReducedMotion` to the store so components that read the slice can react
 * without each needing a `matchMedia` listener.
 *
 * Usage:
 * ```tsx
 * const prefersReduced = usePrefersReducedMotion();
 * // Inline style:
 * <div style={{ transition: prefersReduced ? 'none' : 'width 200ms' }} />
 * ```
 */
import { useEffect } from 'react';

import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { selectReducedMotion, setReducedMotion } from '@/store/slices/uiSlice';

const MEDIA_QUERY = '(prefers-reduced-motion: reduce)';

export function usePrefersReducedMotion(): boolean {
  const reducedMotion = useAppSelector(selectReducedMotion);
  const dispatch = useAppDispatch();

  useEffect(() => {
    const mql = window.matchMedia(MEDIA_QUERY);
    // Sync initial value.
    dispatch(setReducedMotion(mql.matches));

    const handler = (e: MediaQueryListEvent): void => {
      dispatch(setReducedMotion(e.matches));
    };
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, [dispatch]);

  return reducedMotion;
}
