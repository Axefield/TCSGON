/**
 * axe-core a11y audit — ToastRegion
 *
 * ToastRegion reads toasts from Redux. We pre-populate the store
 * with sample toasts to audit both the empty and populated states
 * of the aria-live region.
 *
 * @phase Phase 6 — Testing & A11y Hardening
 */

import { act, render } from '@testing-library/react';
import { type ReactElement, type ReactNode } from 'react';
import { Provider as ReduxProvider } from 'react-redux';
import { describe, it, beforeEach } from 'vitest';

import { newToastId } from '@/shared/types/brand';
import { store as appStore } from '@/store';
import { pushToast } from '@/store/slices/uiSlice';
import { testA11y } from '@/test-utils';

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

describe('ToastRegion a11y', () => {
  beforeEach(() => {
    act(() => {
      appStore.dispatch({ type: 'ui/clearToasts' });
    });
  });

  it('empty region has no a11y violations', async () => {
    const { container } = render(<ToastRegion />, { wrapper: Wrapper });
    await testA11y(container);
  });

  it('populated region with multiple toasts has no a11y violations', async () => {
    act(() => {
      appStore.dispatch(pushToast(makeToast({ message: 'Info toast', kind: 'info' })));
      appStore.dispatch(pushToast(makeToast({ message: 'Success toast', kind: 'success' })));
      appStore.dispatch(pushToast(makeToast({ message: 'Warning toast', kind: 'warning' })));
      appStore.dispatch(pushToast(makeToast({ message: 'Error toast', kind: 'error' })));
    });

    const { container } = render(<ToastRegion />, { wrapper: Wrapper });
    await testA11y(container);
  });
});
