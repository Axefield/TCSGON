/**
 * axe-core a11y audit — SkipLink
 *
 * @phase Phase 6 — Testing & A11y Hardening
 */

import { render } from '@testing-library/react';

import { testA11y } from '@/test-utils';

import { SkipLink } from './SkipLink';

describe('SkipLink a11y', () => {
  it('default skip link has no a11y violations', async () => {
    const { container } = render(<SkipLink />);
    await testA11y(container);
  });

  it('skip link with custom target and text has no a11y violations', async () => {
    const { container } = render(
      <SkipLink targetId="app-content">Jump to content</SkipLink>,
    );
    await testA11y(container);
  });
});
