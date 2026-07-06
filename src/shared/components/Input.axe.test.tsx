/**
 * axe-core a11y audit — Input
 *
 * @phase Phase 7 — Design System & Feature Hardening
 */
import { render } from '@testing-library/react';

import { testA11y } from '@/test-utils';

import { Input } from './Input';

describe('Input a11y', () => {
  it('default input with label has no a11y violations', async () => {
    const { container } = render(<Input label="Username" />);
    await testA11y(container);
  });

  it('input with error has no a11y violations', async () => {
    const { container } = render(
      <Input label="Email" error="This field is required" />,
    );
    await testA11y(container);
  });

  it('input with hint has no a11y violations', async () => {
    const { container } = render(
      <Input label="Full name" hint="Enter your legal name" />,
    );
    await testA11y(container);
  });

  it('disabled input has no a11y violations', async () => {
    const { container } = render(<Input label="Disabled" disabled />);
    await testA11y(container);
  });
});
