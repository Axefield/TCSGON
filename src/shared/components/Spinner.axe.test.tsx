/**
 * axe-core a11y audit — Spinner
 *
 * @phase Phase 6 — Testing & A11y Hardening
 */

import { render } from '@testing-library/react';

import { testA11y } from '@/test-utils';

import { Spinner } from './Spinner';

describe('Spinner a11y', () => {
  it('default spinner has no a11y violations', async () => {
    const { container } = render(<Spinner />);
    await testA11y(container);
  });

  it('spinner with custom label has no a11y violations', async () => {
    const { container } = render(<Spinner label="Loading data…" />);
    await testA11y(container);
  });

  it('decorative spinner has no a11y violations', async () => {
    const { container } = render(<Spinner decorative />);
    await testA11y(container);
  });

  it('small spinner has no a11y violations', async () => {
    const { container } = render(<Spinner size="sm" />);
    await testA11y(container);
  });

  it('large spinner has no a11y violations', async () => {
    const { container } = render(<Spinner size="lg" />);
    await testA11y(container);
  });
});
