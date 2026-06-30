import { describe, expect, it } from 'vitest';

import { setTheme, toggleTheme, uiReducer, type UiState } from './uiSlice';

describe('uiSlice', () => {
  const initial: UiState = { theme: 'light' };

  it('exports the documented initial state', () => {
    expect(uiReducer(undefined, { type: '@@INIT' })).toEqual(initial);
  });

  it('toggleTheme flips light → dark', () => {
    const next = uiReducer(initial, toggleTheme());
    expect(next.theme).toBe('dark');
  });

  it('toggleTheme flips dark → light', () => {
    const next = uiReducer({ theme: 'dark' }, toggleTheme());
    expect(next.theme).toBe('light');
  });

  it('setTheme sets the theme explicitly', () => {
    expect(uiReducer(initial, setTheme('dark')).theme).toBe('dark');
    expect(uiReducer({ theme: 'dark' }, setTheme('light')).theme).toBe('light');
  });
});