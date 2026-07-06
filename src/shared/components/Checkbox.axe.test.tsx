/**
 * axe-core a11y audit — Checkbox
 */
import { render } from '@testing-library/react';

import { testA11y } from '@/test-utils';

import { Checkbox } from './Checkbox';

describe('Checkbox a11y', () => {
  it('default checkbox with label has no a11y violations', async () => {
    const { container } = render(<Checkbox label="Accept terms" />);
    await testA11y(container);
  });

  it('checkbox with error has no a11y violations', async () => {
    const { container } = render(
      <Checkbox label="Email" error="This field is required" />,
    );
    await testA11y(container);
  });

  it('checkbox checked has no a11y violations', async () => {
    const { container } = render(<Checkbox label="Checked" defaultChecked />);
    await testA11y(container);
  });

  it('checkbox disabled has no a11y violations', async () => {
    const { container } = render(<Checkbox label="Disabled" disabled />);
    await testA11y(container);
  });
});
