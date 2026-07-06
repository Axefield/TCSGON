/**
 * axe-core a11y audit — LoginForm
 *
 * @phase Phase 6 — Testing & A11y Hardening
 */

import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { testA11y } from '@/test-utils';
import { renderWithProviders } from '@/test-utils';

import { LoginForm } from './LoginForm';

describe('LoginForm a11y', () => {
  it('default form has no a11y violations', async () => {
    const { container } = renderWithProviders(<LoginForm onSubmit={vi.fn()} />);
    await testA11y(container);
  });

  it('form with validation errors has no a11y violations', async () => {
    const { container } = renderWithProviders(<LoginForm onSubmit={vi.fn()} />);
    // Type invalid values to trigger onTouched validation on blur
    await userEvent.type(screen.getByLabelText('Email'), 'bad');
    await userEvent.type(screen.getByLabelText('Password'), 'ab');
    // Focusing outside triggers blur on password → onTouched validation
    await userEvent.tab();
    await testA11y(container);
  });

  it('disabled form has no a11y violations', async () => {
    const { container } = renderWithProviders(<LoginForm onSubmit={vi.fn()} disabled />);
    await testA11y(container);
  });
});
