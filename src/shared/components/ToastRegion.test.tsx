/**
 * ToastRegion component tests — reads toasts from Redux store.
 *
 * @see docs/plans/phase-1-core-infrastructure.md §51, §57
 */
import { act, render, screen } from '@testing-library/react';
import { type ReactElement, type ReactNode } from 'react';
import { Provider as ReduxProvider } from 'react-redux';
import { describe, expect, it, beforeEach } from 'vitest';

import { newToastId } from '@/shared/types/brand';
import { store as appStore } from '@/store';
import { pushToast } from '@/store/slices/uiSlice';

import { ToastRegion } from './ToastRegion';

function makeToast(overrides?: { message?: string; kind?: 'info' | 'success' | 'warning' | 'error' }) {
  return {
    id: newToastId(),
    kind: overrides?.kind ?? 'info',
    message: overrides?.message ?? 'Toast',
    createdAt: Date.now(),
    durationMs: 5000,
  };
}

function Wrapper({ children }: { children: ReactNode }): ReactElement {
  return <ReduxProvider store={appStore}>{children}</ReduxProvider>;
}

describe('ToastRegion', () => {
  beforeEach(() => {
    // Clear toasts before each test.
    act(() => {
      appStore.dispatch({ type: 'ui/clearToasts' });
    });
  });

  it('renders live region containers when no toasts', () => {
    const { container } = render(<ToastRegion />, { wrapper: Wrapper });
    const politeRegion = container.querySelector('[aria-live="polite"]');
    const assertiveRegion = container.querySelector('[role="alert"]');
    expect(politeRegion).toBeInTheDocument();
    expect(assertiveRegion).toBeInTheDocument();
    // No toast content when empty
    expect(politeRegion!.childNodes.length).toBe(0);
    expect(assertiveRegion!.childNodes.length).toBe(0);
  });

  it('renders info/success/warning toasts in polite region', () => {
    act(() => {
      appStore.dispatch(pushToast(makeToast({ message: 'Info', kind: 'info' })));
      appStore.dispatch(pushToast(makeToast({ message: 'Success', kind: 'success' })));
    });

    render(<ToastRegion />, { wrapper: Wrapper });
    expect(screen.getByText('Info')).toBeInTheDocument();
    expect(screen.getByText('Success')).toBeInTheDocument();
  });

  it('renders error toasts in assertive region', () => {
    act(() => {
      appStore.dispatch(pushToast(makeToast({ message: 'Error!', kind: 'error' })));
    });

    render(<ToastRegion />, { wrapper: Wrapper });
    const errorRegion = screen.getByRole('alert', { name: 'Error notifications' });
    expect(errorRegion).toHaveTextContent('Error!');
  });

  it('splits toasts across polite and assertive regions', () => {
    act(() => {
      appStore.dispatch(pushToast(makeToast({ message: 'Info', kind: 'info' })));
      appStore.dispatch(pushToast(makeToast({ message: 'Error', kind: 'error' })));
    });

    render(<ToastRegion />, { wrapper: Wrapper });
    expect(screen.getByText('Info')).toBeInTheDocument();
    expect(screen.getByText('Error')).toBeInTheDocument();
  });

  it('dismisses toast when dismiss button clicked', () => {
    act(() => {
      appStore.dispatch(pushToast(makeToast({ message: 'Dismiss me', kind: 'info' })));
    });

    render(<ToastRegion />, { wrapper: Wrapper });
    const btn = screen.getByRole('button', { name: /dismiss/i });
    act(() => {
      btn.click();
    });

    expect(screen.queryByText('Dismiss me')).not.toBeInTheDocument();
  });
});
