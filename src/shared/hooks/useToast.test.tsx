/**
 * useToast hook tests.
 *
 * @see docs/plans/phase-1-core-infrastructure.md §51, §57
 */
import { act, renderHook } from '@testing-library/react';
import { type ReactElement, type ReactNode } from 'react';
import { Provider as ReduxProvider } from 'react-redux';
import { describe, expect, it, beforeEach } from 'vitest';

import { store as appStore } from '@/store';

import { useToast } from './useToast';

function Wrapper({ children }: { children: ReactNode }): ReactElement {
  return <ReduxProvider store={appStore}>{children}</ReduxProvider>;
}

describe('useToast', () => {
  beforeEach(() => {
    // Clear all toasts before each test using the store directly.
    act(() => {
      appStore.dispatch({ type: 'ui/clearToasts' });
    });
  });

  it('push adds a toast', () => {
    const { result } = renderHook(() => useToast(), { wrapper: Wrapper });
    act(() => {
      result.current.push({ message: 'Hello', kind: 'info' });
    });
    expect(result.current.toasts).toHaveLength(1);
  });

  it('dismiss removes a toast by id', () => {
    const { result } = renderHook(() => useToast(), { wrapper: Wrapper });
    let id: ReturnType<typeof result.current.push> | undefined;
    act(() => {
      id = result.current.push({ message: 'Test', kind: 'info' });
    });
    act(() => {
      if (id) result.current.dismiss(id);
    });
    expect(result.current.toasts).toHaveLength(0);
  });

  it('clear removes all toasts', () => {
    const { result } = renderHook(() => useToast(), { wrapper: Wrapper });
    act(() => {
      result.current.push({ message: 'A', kind: 'info' });
      result.current.push({ message: 'B', kind: 'error' });
    });
    expect(result.current.toasts).toHaveLength(2);
    act(() => {
      result.current.clear();
    });
    expect(result.current.toasts).toHaveLength(0);
  });

  it('info shortcut adds an info toast', () => {
    const { result } = renderHook(() => useToast(), { wrapper: Wrapper });
    act(() => {
      result.current.info('Info message');
    });
    expect(result.current.toasts).toHaveLength(1);
    if (result.current.toasts[0]) {
      expect(result.current.toasts[0].kind).toBe('info');
    }
  });

  it('success shortcut adds a success toast', () => {
    const { result } = renderHook(() => useToast(), { wrapper: Wrapper });
    act(() => {
      result.current.success('Success!');
    });
    if (result.current.toasts[0]) {
      expect(result.current.toasts[0].kind).toBe('success');
    }
  });

  it('warning shortcut adds a warning toast', () => {
    const { result } = renderHook(() => useToast(), { wrapper: Wrapper });
    act(() => {
      result.current.warning('Warning!');
    });
    if (result.current.toasts[0]) {
      expect(result.current.toasts[0].kind).toBe('warning');
    }
  });

  it('error shortcut adds an error toast', () => {
    const { result } = renderHook(() => useToast(), { wrapper: Wrapper });
    act(() => {
      result.current.error('Error!');
    });
    if (result.current.toasts[0]) {
      expect(result.current.toasts[0].kind).toBe('error');
    }
  });

  it('push generates unique ids', () => {
    const { result } = renderHook(() => useToast(), { wrapper: Wrapper });
    let id1: ReturnType<typeof result.current.push> | undefined;
    let id2: ReturnType<typeof result.current.push> | undefined;
    act(() => {
      id1 = result.current.push({ message: 'A', kind: 'info' });
      id2 = result.current.push({ message: 'B', kind: 'info' });
    });
    expect(id1).not.toBe(id2);
  });

  it('push with description includes description in toast entry', () => {
    const { result } = renderHook(() => useToast(), { wrapper: Wrapper });
    act(() => {
      result.current.push({ message: 'Warning', kind: 'warning', description: 'Detailed info' });
    });
    expect(result.current.toasts).toHaveLength(1);
    expect(result.current.toasts[0]?.description).toBe('Detailed info');
  });

  it('push without description omits description field', () => {
    const { result } = renderHook(() => useToast(), { wrapper: Wrapper });
    act(() => {
      result.current.push({ message: 'No desc', kind: 'info' });
    });
    expect(result.current.toasts[0]?.description).toBeUndefined();
  });

  it('info shortcut with description includes it', () => {
    const { result } = renderHook(() => useToast(), { wrapper: Wrapper });
    act(() => {
      result.current.info('Info', { description: 'Extra context' });
    });
    expect(result.current.toasts[0]?.description).toBe('Extra context');
  });

  it('success shortcut with description includes it', () => {
    const { result } = renderHook(() => useToast(), { wrapper: Wrapper });
    act(() => {
      result.current.success('Success', { description: 'Success details' });
    });
    expect(result.current.toasts[0]?.description).toBe('Success details');
  });

  it('warning shortcut with description includes it', () => {
    const { result } = renderHook(() => useToast(), { wrapper: Wrapper });
    act(() => {
      result.current.warning('Warning', { description: 'Warning details' });
    });
    expect(result.current.toasts[0]?.description).toBe('Warning details');
  });

  it('error shortcut with description includes it', () => {
    const { result } = renderHook(() => useToast(), { wrapper: Wrapper });
    act(() => {
      result.current.error('Error', { description: 'Error details' });
    });
    expect(result.current.toasts[0]?.description).toBe('Error details');
  });

  it('push with custom durationMs overrides default', () => {
    const { result } = renderHook(() => useToast(), { wrapper: Wrapper });
    act(() => {
      result.current.push({ message: 'Long toast', kind: 'info', durationMs: 10000 });
    });
    expect(result.current.toasts[0]?.durationMs).toBe(10000);
  });

  it('push without durationMs uses default', () => {
    const { result } = renderHook(() => useToast(), { wrapper: Wrapper });
    act(() => {
      result.current.push({ message: 'Normal toast', kind: 'info' });
    });
    expect(result.current.toasts[0]?.durationMs).toBe(5000);
  });
});
