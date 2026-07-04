/**
 * axe-core a11y audit — Toast
 *
 * @phase Phase 6 — Testing & A11y Hardening
 */

import { render } from '@testing-library/react';

import { asToastId } from '@/shared/types/brand';
import type { ToastKind } from '@/shared/types/toast';
import { testA11y } from '@/test-utils';

import { Toast } from './Toast';

describe('Toast a11y', () => {
  const now = Date.now();

  function makeEntry(kind: ToastKind, message: string, description?: string) {
    return {
      id: asToastId(`t-${kind}-test`),
      kind,
      message,
      ...(description !== undefined ? { description } : {}),
      createdAt: now,
    };
  }

  const onDismiss = vi.fn();

  it('info toast has no a11y violations', async () => {
    const { container } = render(
      <Toast entry={makeEntry('info', 'Information')} onDismiss={onDismiss} />,
    );
    await testA11y(container);
  });

  it('success toast has no a11y violations', async () => {
    const { container } = render(
      <Toast entry={makeEntry('success', 'Saved!')} onDismiss={onDismiss} />,
    );
    await testA11y(container);
  });

  it('warning toast has no a11y violations', async () => {
    const { container } = render(
      <Toast entry={makeEntry('warning', 'Warning')} onDismiss={onDismiss} />,
    );
    await testA11y(container);
  });

  it('error toast has no a11y violations', async () => {
    const { container } = render(
      <Toast entry={makeEntry('error', 'Error occurred')} onDismiss={onDismiss} />,
    );
    await testA11y(container);
  });

  it('toast with description has no a11y violations', async () => {
    const { container } = render(
      <Toast
        entry={makeEntry('info', 'Saved', 'Your changes have been saved successfully.')}
        onDismiss={onDismiss}
      />,
    );
    await testA11y(container);
  });
});
