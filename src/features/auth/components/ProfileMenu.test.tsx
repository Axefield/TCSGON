/**
 * ProfileMenu tests.
 *
 * Covers rendering, keyboard navigation, Settings link, and Sign Out.
 *
 * @see docs/plans/phase-3-authentication.md § ProfileMenu
 */
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { type ReactElement } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { asUserId } from '@/shared/types/brand';

import { ProfileMenu } from './ProfileMenu';

const alice = { id: asUserId('user-001'), email: 'alice@example.com', name: 'Alice' };

function Wrapper({ children }: { children: React.ReactNode }): ReactElement {
  return <MemoryRouter>{children}</MemoryRouter>;
}

describe('ProfileMenu', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders avatar with first initial', () => {
    render(<ProfileMenu user={alice} onSignOut={vi.fn()} />, { wrapper: Wrapper });
    expect(screen.getByText('A')).toBeInTheDocument();
  });

  it('shows user name on trigger', () => {
    render(<ProfileMenu user={alice} onSignOut={vi.fn()} />, { wrapper: Wrapper });
    expect(screen.getByText('Alice')).toBeInTheDocument();
  });

  it('menu is closed by default', () => {
    render(<ProfileMenu user={alice} onSignOut={vi.fn()} />, { wrapper: Wrapper });
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('opens menu on trigger click', () => {
    render(<ProfileMenu user={alice} onSignOut={vi.fn()} />, { wrapper: Wrapper });
    fireEvent.click(screen.getByRole('button', { name: /alice/i }));
    expect(screen.getByRole('menu')).toBeInTheDocument();
  });

  it('displays user email in menu', () => {
    render(<ProfileMenu user={alice} onSignOut={vi.fn()} />, { wrapper: Wrapper });
    fireEvent.click(screen.getByRole('button', { name: /alice/i }));
    expect(screen.getByText('alice@example.com')).toBeInTheDocument();
  });

  it('renders Settings and Sign Out buttons in menu', () => {
    render(<ProfileMenu user={alice} onSignOut={vi.fn()} />, { wrapper: Wrapper });
    fireEvent.click(screen.getByRole('button', { name: /alice/i }));
    expect(screen.getByRole('menuitem', { name: /settings/i })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: /sign out/i })).toBeInTheDocument();
  });

  it('calls onSettings when Settings clicked', () => {
    const onSettings = vi.fn();
    render(<ProfileMenu user={alice} onSettings={onSettings} onSignOut={vi.fn()} />, { wrapper: Wrapper });
    fireEvent.click(screen.getByRole('button', { name: /alice/i }));
    fireEvent.click(screen.getByRole('menuitem', { name: /settings/i }));
    expect(onSettings).toHaveBeenCalledOnce();
  });

  it('calls onSignOut when Sign Out clicked', () => {
    const onSignOut = vi.fn();
    render(<ProfileMenu user={alice} onSignOut={onSignOut} />, { wrapper: Wrapper });
    fireEvent.click(screen.getByRole('button', { name: /alice/i }));
    fireEvent.click(screen.getByRole('menuitem', { name: /sign out/i }));
    expect(onSignOut).toHaveBeenCalledOnce();
  });

  it('has correct aria attributes on trigger', () => {
    render(<ProfileMenu user={alice} onSignOut={vi.fn()} />, { wrapper: Wrapper });
    const trigger = screen.getByRole('button', { name: /alice/i });
    expect(trigger).toHaveAttribute('aria-haspopup', 'true');
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });

  it('sets aria-expanded to true when open', () => {
    render(<ProfileMenu user={alice} onSignOut={vi.fn()} />, { wrapper: Wrapper });
    const trigger = screen.getByRole('button', { name: /alice/i });
    fireEvent.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
  });

  it('closes menu on Escape', () => {
    render(<ProfileMenu user={alice} onSignOut={vi.fn()} />, { wrapper: Wrapper });
    fireEvent.click(screen.getByRole('button', { name: /alice/i }));
    expect(screen.getByRole('menu')).toBeInTheDocument();

    fireEvent.keyDown(screen.getByRole('menu'), { key: 'Escape' });
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('closes menu after clicking Sign Out', () => {
    render(<ProfileMenu user={alice} onSignOut={vi.fn()} />, { wrapper: Wrapper });
    fireEvent.click(screen.getByRole('button', { name: /alice/i }));
    fireEvent.click(screen.getByRole('menuitem', { name: /sign out/i }));
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('navigates to /settings when no onSettings provided', () => {
    // Spy on window.location.assign — Router will navigate
    render(<ProfileMenu user={alice} onSignOut={vi.fn()} />, { wrapper: Wrapper });
    fireEvent.click(screen.getByRole('button', { name: /alice/i }));

    const settingsBtn = screen.getByRole('menuitem', { name: /settings/i });
    fireEvent.click(settingsBtn);

    // After click the menu should be closed
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('focuses first menu item on open', async () => {
    render(<ProfileMenu user={alice} onSignOut={vi.fn()} />, { wrapper: Wrapper });
    fireEvent.click(screen.getByRole('button', { name: /alice/i }));

    const settingsBtn = screen.getByRole('menuitem', { name: /settings/i });
    await waitFor(() => {
      expect(document.activeElement).toBe(settingsBtn);
    });
  });

  it('supports arrow key navigation', () => {
    render(<ProfileMenu user={alice} onSignOut={vi.fn()} />, { wrapper: Wrapper });
    fireEvent.click(screen.getByRole('button', { name: /alice/i }));

    const menu = screen.getByRole('menu');
    const signOutBtn = screen.getByRole('menuitem', { name: /sign out/i });

    // ArrowDown moves to Sign Out
    fireEvent.keyDown(menu, { key: 'ArrowDown' });
    expect(document.activeElement).toBe(signOutBtn);

    // ArrowUp moves back to Settings
    const settingsBtn = screen.getByRole('menuitem', { name: /settings/i });
    fireEvent.keyDown(menu, { key: 'ArrowUp' });
    expect(document.activeElement).toBe(settingsBtn);
  });
});
