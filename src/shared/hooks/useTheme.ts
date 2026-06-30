/**
 * useTheme — read and toggle the app theme.
 *
 * @see docs/plans/phase-1-core-infrastructure.md §11
 *
 * Theme is stored in Redux `ui.theme`. On every change, a `useLayoutEffect`
 * syncs `data-theme` to `<html>` so CSS custom properties cascade correctly
 * before the next paint. The initial value is set by the inline script in
 * `index.html` and passed via `preloadedState`.
 *
 * Usage:
 * ```ts
 * const { theme, setTheme, toggle } = useTheme();
 * ```
 */
import { useCallback, useLayoutEffect } from 'react';

import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { selectTheme, setTheme, toggleTheme, type Theme } from '@/store/slices/uiSlice';

const THEME_STORAGE_KEY = 'tcsgon:theme';

export interface UseThemeResult {
  readonly theme: Theme;
  readonly setTheme: (t: Theme) => void;
  readonly toggle: () => void;
}

export function useTheme(): UseThemeResult {
  const theme = useAppSelector(selectTheme);
  const dispatch = useAppDispatch();

  // Sync `data-theme` to <html> — runs synchronously before paint so there's
  // no FOUC between the inline script's decision and React hydration.
  useLayoutEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // storage quota or disabled — fail silent.
    }
  }, [theme]);

  const set = useCallback(
    (t: Theme) => {
      dispatch(setTheme(t));
    },
    [dispatch],
  );

  const toggle = useCallback(() => {
    dispatch(toggleTheme());
  }, [dispatch]);

  return { theme, setTheme: set, toggle };
}
