/**
 * SignupForm — component tests.
 *
 * @see docs/plans/phase-3-authentication.md
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { SignupForm } from './SignupForm';

describe('SignupForm', () => {
  it('renders all 4 fields', () => {
    render(<SignupForm onSubmit={vi.fn()} />);
    expect(screen.getByLabelText(/^name$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^email$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
  });

  it('renders create account button', () => {
    render(<SignupForm onSubmit={vi.fn()} />);
    expect(
      screen.getByRole('button', { name: /create account/i }),
    ).toBeInTheDocument();
  });

  it('calls onSubmit with all fields', async () => {
    const onSubmit = vi.fn();
    render(<SignupForm onSubmit={onSubmit} />);

    await userEvent.type(screen.getByLabelText(/^name$/i), 'Test User');
    await userEvent.type(screen.getByLabelText(/^email$/i), 'test@example.com');
    await userEvent.type(screen.getByLabelText(/^password$/i), 'ValidPass1');
    await userEvent.type(screen.getByLabelText(/confirm password/i), 'ValidPass1');
    await userEvent.click(screen.getByRole('button', { name: /create account/i }));

    expect(onSubmit).toHaveBeenCalledWith({
      name: 'Test User',
      email: 'test@example.com',
      password: 'ValidPass1',
      confirmPassword: 'ValidPass1',
    });
  });

  it('shows disabled/busy state when disabled prop is set', () => {
    render(<SignupForm onSubmit={vi.fn()} disabled />);
    expect(
      screen.getByRole('button', { name: /creating account/i }),
    ).toBeDisabled();
  });

  it('shows server error on failed submit', async () => {
    const onSubmit = vi.fn().mockRejectedValue(new Error('Email already in use.'));
    render(<SignupForm onSubmit={onSubmit} />);

    await userEvent.type(screen.getByLabelText(/^name$/i), 'Test User');
    await userEvent.type(screen.getByLabelText(/^email$/i), 'test@example.com');
    await userEvent.type(screen.getByLabelText(/^password$/i), 'ValidPass1');
    await userEvent.type(screen.getByLabelText(/confirm password/i), 'ValidPass1');
    await userEvent.click(screen.getByRole('button', { name: /create account/i }));

    expect(await screen.findByText(/email already in use/i)).toBeInTheDocument();
  });

  it('renders with initial email and name values', () => {
    render(
      <SignupForm
        onSubmit={vi.fn()}
        initialEmail="prefill@test.com"
        initialName="Prefill User"
      />,
    );
    expect(screen.getByLabelText(/^name$/i)).toHaveValue('Prefill User');
    expect(screen.getByLabelText(/^email$/i)).toHaveValue('prefill@test.com');
  });

  it('shows PasswordStrengthIndicator when password has content', async () => {
    render(<SignupForm onSubmit={vi.fn()} />);
    expect(screen.queryByRole('meter')).not.toBeInTheDocument();

    await userEvent.type(screen.getByLabelText(/^password$/i), 'abc');
    expect(screen.getByRole('meter')).toBeInTheDocument();
  });

  it('submits when passwords match', async () => {
    const onSubmit = vi.fn();
    render(<SignupForm onSubmit={onSubmit} />);

    await userEvent.type(screen.getByLabelText(/^name$/i), 'Test User');
    await userEvent.type(screen.getByLabelText(/^email$/i), 'test@example.com');

    const passwordInput = screen.getByLabelText(/^password$/i);
    const confirmInput = screen.getByLabelText(/confirm password/i);

    await userEvent.type(passwordInput, 'ValidPass1');
    await userEvent.tab();
    await userEvent.type(confirmInput, 'ValidPass1');
    await userEvent.tab();

    const button = screen.getByRole('button', { name: /create account/i });
    expect(button).toBeEnabled();

    await userEvent.click(button);
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        password: 'ValidPass1',
        confirmPassword: 'ValidPass1',
      }),
    );
  });

  it('shows error when passwords do not match', async () => {
    const onSubmit = vi.fn();
    render(<SignupForm onSubmit={onSubmit} />);

    await userEvent.type(screen.getByLabelText(/^name$/i), 'Test User');
    await userEvent.type(screen.getByLabelText(/^email$/i), 'test@example.com');
    await userEvent.type(screen.getByLabelText(/^password$/i), 'ValidPass1');
    await userEvent.tab();
    await userEvent.type(screen.getByLabelText(/confirm password/i), 'BadPass2');
    await userEvent.tab();

    expect(await screen.findByText(/passwords do not match/i)).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
