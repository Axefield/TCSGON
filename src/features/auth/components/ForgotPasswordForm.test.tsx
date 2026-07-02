/**
 * ForgotPasswordForm — component tests.
 *
 * @see docs/plans/phase-3-authentication.md
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

import { ForgotPasswordForm } from './ForgotPasswordForm';

describe('ForgotPasswordForm', () => {
  const renderForm = (props: Record<string, unknown> = {}) =>
    render(
      <MemoryRouter>
        <ForgotPasswordForm onSubmit={vi.fn()} {...props} />
      </MemoryRouter>,
    );

  it('renders email field', () => {
    renderForm();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
  });

  it('renders send reset link button', () => {
    renderForm();
    expect(
      screen.getByRole('button', { name: /send reset link/i }),
    ).toBeInTheDocument();
  });

  it('calls onSubmit with email', async () => {
    const onSubmit = vi.fn();
    render(
      <MemoryRouter>
        <ForgotPasswordForm onSubmit={onSubmit} />
      </MemoryRouter>,
    );

    await userEvent.type(screen.getByLabelText(/email address/i), 'test@example.com');
    await userEvent.click(screen.getByRole('button', { name: /send reset link/i }));

    expect(onSubmit).toHaveBeenCalledWith({ email: 'test@example.com' });
  });

  it('shows disabled/busy state when disabled prop is set', () => {
    renderForm({ disabled: true });
    expect(screen.getByRole('button', { name: /sending/i })).toBeDisabled();
  });

  it('shows success state when isSuccess is true', () => {
    renderForm({ isSuccess: true });
    expect(screen.getByText(/check your email/i)).toBeInTheDocument();
  });

  it('shows server error on failed submit', async () => {
    const onSubmit = vi.fn().mockRejectedValue(new Error('Request failed.'));
    render(
      <MemoryRouter>
        <ForgotPasswordForm onSubmit={onSubmit} />
      </MemoryRouter>,
    );

    await userEvent.type(screen.getByLabelText(/email address/i), 'test@example.com');
    await userEvent.click(screen.getByRole('button', { name: /send reset link/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Request failed.');
  });

  it('renders "Back to sign in" link when NOT in success state', () => {
    renderForm();
    expect(
      screen.getByRole('link', { name: /back to sign in/i }),
    ).toBeInTheDocument();
  });

  it('renders "Back to sign in" link in success state too', () => {
    renderForm({ isSuccess: true });
    expect(
      screen.getByRole('link', { name: /back to sign in/i }),
    ).toBeInTheDocument();
  });
});
