/**
 * TopBar component tests.
 *
 * @see docs/plans/phase-1-core-infrastructure.md §10, §34, §35
 */
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { TopBar } from './TopBar';

describe('TopBar', () => {
  const defaultProps = {
    title: 'Dashboard',
    onMenuClick: vi.fn(),
    theme: 'light' as const,
    onThemeToggle: vi.fn(),
    user: null,
  };

  it('renders the title', () => {
    render(<TopBar {...defaultProps} />);
    expect(screen.getByRole('heading', { name: /dashboard/i })).toBeInTheDocument();
  });

  it('renders menu button', () => {
    render(<TopBar {...defaultProps} />);
    const menuBtn = screen.getByRole('button', { name: /open navigation menu/i });
    expect(menuBtn).toBeInTheDocument();
  });

  it('calls onMenuClick when menu button clicked', () => {
    const onMenuClick = vi.fn();
    render(<TopBar {...defaultProps} onMenuClick={onMenuClick} />);
    fireEvent.click(screen.getByRole('button', { name: /open navigation menu/i }));
    expect(onMenuClick).toHaveBeenCalledOnce();
  });

  it('renders theme toggle with correct aria-pressed for light theme', () => {
    render(<TopBar {...defaultProps} theme="light" />);
    const toggle = screen.getByRole('button', { name: /switch to dark theme/i });
    expect(toggle).toHaveAttribute('aria-pressed', 'false');
  });

  it('renders theme toggle with correct aria-pressed for dark theme', () => {
    render(<TopBar {...defaultProps} theme="dark" />);
    const toggle = screen.getByRole('button', { name: /switch to light theme/i });
    expect(toggle).toHaveAttribute('aria-pressed', 'true');
  });

  it('calls onThemeToggle when theme toggle clicked', () => {
    const onThemeToggle = vi.fn();
    render(<TopBar {...defaultProps} onThemeToggle={onThemeToggle} />);
    fireEvent.click(screen.getByRole('button', { name: /switch to dark theme/i }));
    expect(onThemeToggle).toHaveBeenCalledOnce();
  });

  it('displays user name when user is provided', () => {
    const user = { id: 'u1' as unknown as never, name: 'Alice', email: 'alice@test.com' };
    render(<TopBar {...defaultProps} user={user} />);
    expect(screen.getByText('Alice')).toBeInTheDocument();
  });

  it('displays "Sign in" when no user', () => {
    render(<TopBar {...defaultProps} user={null} />);
    expect(screen.getByText('Sign in')).toBeInTheDocument();
  });
});
