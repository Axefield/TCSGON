/**
 * axe-core a11y audit — Avatar
 *
 * Avatar renders in three visual modes (image, initials, fallback icon).
 * Each mode must not introduce any a11y violations.
 */
import { render } from '@testing-library/react';

import { testA11y } from '@/test-utils';

import { Avatar } from './Avatar';

describe('Avatar a11y', () => {
  it('avatar with name (initials) has no a11y violations', async () => {
    const { container } = render(
      <Avatar alt="John Doe" name="John Doe" />,
    );
    await testA11y(container);
  });

  it('avatar with src (image) has no a11y violations', async () => {
    const { container } = render(
      <Avatar alt="Alice" src="/photos/alice.jpg" />,
    );
    await testA11y(container);
  });

  it('avatar without src or name (fallback icon) has no a11y violations', async () => {
    const { container } = render(
      <Avatar alt="Unknown user" />,
    );
    await testA11y(container);
  });
});
