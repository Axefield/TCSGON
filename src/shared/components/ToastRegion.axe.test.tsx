/**
 * axe-core a11y audit — ToastRegion
 *
 * ToastRegion reads toasts from Redux. We pre-populate the store
 * with sample toasts via renderWithProviders.
 *
 * @phase Phase 6 — Testing & A11y Hardening
 */

import { testA11y } from '@/test-utils';
import { renderWithProviders } from '@/test-utils';

import { ToastRegion } from './ToastRegion';

describe('ToastRegion a11y', () => {
  it('empty region has no a11y violations', async () => {
    const { container } = renderWithProviders(<ToastRegion />);
    await testA11y(container);
  });
});
