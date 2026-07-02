/**
 * PasswordStrengthIndicator — component tests.
 *
 * @see docs/plans/phase-3-authentication.md
 */
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { PasswordStrengthIndicator } from './PasswordStrengthIndicator';

describe('PasswordStrengthIndicator', () => {
  it('renders null for empty password', () => {
    const { container } = render(<PasswordStrengthIndicator password="" />);
    expect(container).toBeEmptyDOMElement();
  });

  it('shows "Weak" for short simple password', () => {
    render(<PasswordStrengthIndicator password="abc" />);
    expect(screen.getByText('Weak')).toBeInTheDocument();
  });

  it('shows "Fair" for medium password', () => {
    render(<PasswordStrengthIndicator password="Abcdefgh" />);
    expect(screen.getByText('Fair')).toBeInTheDocument();
  });

  it('shows "Strong" for complex password', () => {
    render(<PasswordStrengthIndicator password="Abc1!xyz" />);
    expect(screen.getByText('Strong')).toBeInTheDocument();
  });

  it('has role="meter" with appropriate aria attributes', () => {
    render(<PasswordStrengthIndicator password="Abcdefgh" />);
    const meter = screen.getByRole('meter');
    expect(meter).toHaveAttribute('aria-valuenow', '2');
    expect(meter).toHaveAttribute('aria-valuemin', '0');
    expect(meter).toHaveAttribute('aria-valuemax', '3');
    expect(meter).toHaveAttribute(
      'aria-label',
      'Password strength: Fair',
    );
  });

  it('does NOT render for empty password', () => {
    render(<PasswordStrengthIndicator password="" />);
    expect(screen.queryByRole('meter')).not.toBeInTheDocument();
  });
});
