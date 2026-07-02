/**
 * ResetPasswordForm — component tests.
 *
 * @see docs/plans/phase-3-authentication.md
 *
 * Note: submit button uses `disabled={isBusy || (!isValid && !hasRootError)}`.
 * With `mode: 'onTouched'`, validation triggers on first blur per field, so
 * interactive tests use `userEvent.tab()` to trigger blur/validation before
 * clicking submit. An `initialToken` is required because the Zod schema
 * enforces `token: z.string().min(1)` — empty token makes form perpetually
 * invalid, keeping the button disabled.
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { ResetPasswordForm } from './ResetPasswordForm';

/** Shared valid token used in every test that submits the form. */
const VALID_TOKEN = 'valid-reset-token';

describe('ResetPasswordForm', () => {
  it('renders password and confirm password fields', () => {
    render(<ResetPasswordForm onSubmit={vi.fn()} />);
    expect(screen.getByLabelText(/^new password$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm new password/i)).toBeInTheDocument();
  });

  it('renders reset password button', () => {
    render(<ResetPasswordForm onSubmit={vi.fn()} />);
    expect(
      screen.getByRole('button', { name: /reset password/i }),
    ).toBeInTheDocument();
  });

  it('calls onSubmit with password and token', async () => {
    const onSubmit = vi.fn();
    render(
      <ResetPasswordForm onSubmit={onSubmit} initialToken={VALID_TOKEN} />,
    );

    await userEvent.type(screen.getByLabelText(/^new password$/i), 'ValidPass1');
    await userEvent.tab();
    await userEvent.type(screen.getByLabelText(/confirm new password/i), 'ValidPass1');
    await userEvent.tab();

    await userEvent.click(screen.getByRole('button', { name: /reset password/i }));

    expect(onSubmit).toHaveBeenCalledWith({
      token: VALID_TOKEN,
      password: 'ValidPass1',
      confirmPassword: 'ValidPass1',
    });
  });

  it('shows disabled/busy state when disabled prop is set', () => {
    render(<ResetPasswordForm onSubmit={vi.fn()} disabled />);
    expect(
      screen.getByRole('button', { name: /resetting password/i }),
    ).toBeDisabled();
  });

  it('shows server error on failed submit', async () => {
    const onSubmit = vi.fn().mockRejectedValue(new Error('Invalid token'));
    render(
      <ResetPasswordForm onSubmit={onSubmit} initialToken={VALID_TOKEN} />,
    );

    await userEvent.type(screen.getByLabelText(/^new password$/i), 'ValidPass1');
    await userEvent.tab();
    await userEvent.type(screen.getByLabelText(/confirm new password/i), 'ValidPass1');
    await userEvent.tab();

    await userEvent.click(screen.getByRole('button', { name: /reset password/i }));

    expect(await screen.findByText(/invalid token/i)).toBeInTheDocument();
  });

  it('hides PasswordStrengthIndicator when password is empty', () => {
    render(<ResetPasswordForm onSubmit={vi.fn()} />);
    expect(screen.queryByRole('meter')).not.toBeInTheDocument();
  });

  it('shows PasswordStrengthIndicator when password has content', async () => {
    render(<ResetPasswordForm onSubmit={vi.fn()} />);
    await userEvent.type(screen.getByLabelText(/^new password$/i), 'abc');
    expect(screen.getByRole('meter')).toBeInTheDocument();
  });

  it('accepts initialToken and includes it in submission', async () => {
    const onSubmit = vi.fn();
    render(
      <ResetPasswordForm onSubmit={onSubmit} initialToken="reset-token-123" />,
    );

    await userEvent.type(screen.getByLabelText(/^new password$/i), 'ValidPass1');
    await userEvent.tab();
    await userEvent.type(screen.getByLabelText(/confirm new password/i), 'ValidPass1');
    await userEvent.tab();

    await userEvent.click(screen.getByRole('button', { name: /reset password/i }));

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ token: 'reset-token-123' }),
    );
  });

  it('submits when passwords match', async () => {
    const onSubmit = vi.fn();
    render(
      <ResetPasswordForm onSubmit={onSubmit} initialToken={VALID_TOKEN} />,
    );

    await userEvent.type(screen.getByLabelText(/^new password$/i), 'ValidPass1');
    await userEvent.tab();
    await userEvent.type(screen.getByLabelText(/confirm new password/i), 'ValidPass1');
    await userEvent.tab();

    await userEvent.click(screen.getByRole('button', { name: /reset password/i }));

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        password: 'ValidPass1',
        confirmPassword: 'ValidPass1',
      }),
    );
  });

  it('shows error when passwords do not match', async () => {
    const onSubmit = vi.fn();
    render(
      <ResetPasswordForm onSubmit={onSubmit} initialToken={VALID_TOKEN} />,
    );

    await userEvent.type(screen.getByLabelText(/^new password$/i), 'ValidPass1');
    await userEvent.tab();
    await userEvent.type(screen.getByLabelText(/confirm new password/i), 'BadPass2');
    await userEvent.tab();

    expect(await screen.findByText(/passwords do not match/i)).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
