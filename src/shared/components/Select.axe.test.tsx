/**
 * axe-core a11y audit — Select
 *
 * Mirrors Input.axe.test.tsx patterns exactly.
 * @phase Phase 7 — Design System & Feature Hardening
 */
import { render } from '@testing-library/react';

import { testA11y } from '@/test-utils';

import { Select } from './Select';

describe('Select a11y', () => {
  it('default select with label has no a11y violations', async () => {
    const { container } = render(
      <Select label="Role">
        <option value="">Select...</option>
        <option value="admin">Admin</option>
        <option value="user">User</option>
      </Select>,
    );
    await testA11y(container);
  });

  it('select with error has no a11y violations', async () => {
    const { container } = render(
      <Select label="Role" error="This field is required">
        <option value="">Select...</option>
        <option value="admin">Admin</option>
      </Select>,
    );
    await testA11y(container);
  });

  it('select with hint has no a11y violations', async () => {
    const { container } = render(
      <Select label="Role" hint="Choose your access level">
        <option value="admin">Admin</option>
        <option value="user">User</option>
      </Select>,
    );
    await testA11y(container);
  });

  it('disabled select has no a11y violations', async () => {
    const { container } = render(
      <Select label="Disabled" disabled>
        <option value="admin">Admin</option>
      </Select>,
    );
    await testA11y(container);
  });
});
