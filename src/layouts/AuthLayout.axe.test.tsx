/**
 * axe-core a11y audit — AuthLayout
 *
 * @phase Phase 6 — Testing & A11y Hardening
 */

import { render } from '@testing-library/react';

import { testA11y } from '@/test-utils';

import { AuthLayout } from './AuthLayout';

describe('AuthLayout a11y', () => {
  it('default auth layout has no a11y violations', async () => {
    const { container } = render(
      <AuthLayout heading="Sign in" subheading="Welcome back">
        <form>
          <label htmlFor="email">Email</label>
          <input id="email" type="email" />
          <button type="submit">Sign in</button>
        </form>
      </AuthLayout>,
    );
    await testA11y(container);
  });

  it('auth layout without subheading has no a11y violations', async () => {
    const { container } = render(
      <AuthLayout heading="Create an account">
        <form>
          <label htmlFor="name">Name</label>
          <input id="name" />
          <button type="submit">Sign up</button>
        </form>
      </AuthLayout>,
    );
    await testA11y(container);
  });
});
