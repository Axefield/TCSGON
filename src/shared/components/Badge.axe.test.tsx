/**
 * axe-core a11y audit — Badge
 *
 * Badge is a pure presentational <span> with no interactive semantics.
 * It must not introduce any a11y violations in any visual variant.
 */
import { render } from '@testing-library/react';

import { testA11y } from '@/test-utils';

import { Badge } from './Badge';

describe('Badge a11y', () => {
  it('default badge with text has no a11y violations', async () => {
    const { container } = render(<Badge>New</Badge>);
    await testA11y(container);
  });

  it('primary badge has no a11y violations', async () => {
    const { container } = render(<Badge variant="primary">Primary</Badge>);
    await testA11y(container);
  });

  it('success badge has no a11y violations', async () => {
    const { container } = render(<Badge variant="success">Success</Badge>);
    await testA11y(container);
  });

  it('danger badge has no a11y violations', async () => {
    const { container } = render(<Badge variant="danger">Danger</Badge>);
    await testA11y(container);
  });
});
