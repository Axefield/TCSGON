/**
 * useTheme hook tests.
 *
 * @see docs/plans/phase-1-core-infrastructure.md §51, §57
 */
import { act, renderHook } from '@testing-library/react';
import { type ReactElement, type ReactNode } from 'react';
import { Provider as ReduxProvider } from 'react-redux';
import { describe, expect, it, beforeEach } from 'vitest';

import { store as appStore } from '@/store';
import { uiActions } from '@/store/slices/uiSlice';

import { useTheme } from './useTheme';

function Wrapper({ children }: { children: ReactNode }): ReactElement {
  return <ReduxProvider store={appStore}>{children}</ReduxProvider>;
}

describe('useTheme', () => {
  beforeEach(() => {
    act(() => {
      appStore.dispatch(uiActions.setTheme('light'));
    });
    document.documentElement.removeAttribute('data-theme');
    localStorage.clear();
  });

  it('returns the current theme from Redux', () => {
    const { result } = renderHook(() => useTheme(), { wrapper: Wrapper });
    expect(result.current.theme).toBe('light');
  });

  it('setTheme updates Redux state and data-theme attribute', () => {
    const { result } = renderHook(() => useTheme(), { wrapper: Wrapper });
    act(() => {
      result.current.setTheme('dark');
    });
    expect(result.current.theme).toBe('dark');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });

  it('toggle flips between light and dark', () => {
    const { result } = renderHook(() => useTheme(), { wrapper: Wrapper });
    expect(result.current.theme).toBe('light');

    act(() => {
      result.current.toggle();
    });
    expect(result.current.theme).toBe('dark');

    act(() => {
      result.current.toggle();
    });
    expect(result.current.theme).toBe('light');
  });

  it('persists theme to localStorage', () => {
    const { result } = renderHook(() => useTheme(), { wrapper: Wrapper });
    act(() => {
      result.current.setTheme('dark');
    });
    expect(localStorage.getItem('tcsgon:theme')).toBe('dark');
  });

  it('handles localStorage setItem failure gracefully', () => {
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('Quota exceeded');
    });

    const { result } = renderHook(() => useTheme(), { wrapper: Wrapper });
    act(() => {
      // Should not throw despite localStorage failure
      result.current.setTheme('dark');
    });

    // Theme still updates in-memory even if localStorage fails
    expect(result.current.theme).toBe('dark');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');

    setItemSpy.mockRestore();
  });
});
