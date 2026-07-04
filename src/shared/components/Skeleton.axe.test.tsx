/**
 * axe-core a11y audit — Skeleton
 *
 * @phase Phase 6 — Testing & A11y Hardening
 */

import { render } from '@testing-library/react';

import { testA11y } from '@/test-utils';

import { Skeleton } from './Skeleton';

describe('Skeleton a11y', () => {
  it('default skeleton has no a11y violations', async () => {
    const { container } = render(<Skeleton />);
    await testA11y(container);
  });

  it('skeleton with custom dimensions has no a11y violations', async () => {
    const { container } = render(<Skeleton width={200} height={20} />);
    await testA11y(container);
  });

  it('skeleton with aria-label has no a11y violations', async () => {
    const { container } = render(<Skeleton width="100%" height={40} label="Loading card…" />);
    await testA11y(container);
  });
});
