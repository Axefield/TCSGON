/**
 * Drawer component tests.
 *
 * Drawer renders via `createPortal` to `document.body`, so portal content
 * is NOT inside the RTL `container`. All queries use `screen` which
 * searches `document.body` by default.
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { Drawer } from './Drawer';

describe('Drawer', () => {
  // ── Render ──────────────────────────────────────────────────────────

  it('returns null when closed', () => {
    const { container } = render(
      <Drawer open={false} onClose={() => {}} title="Test">
        Content
      </Drawer>,
    );
    expect(container.innerHTML).toBe('');
  });

  it('renders dialog when open', () => {
    render(
      <Drawer open={true} onClose={() => {}} title="Test Drawer">
        Content here
      </Drawer>,
    );
    const dialog = screen.getByRole('dialog', { name: /Test Drawer/i });
    expect(dialog).toBeInTheDocument();
  });

  it('has correct aria-modal and aria-labelledby attributes', () => {
    render(
      <Drawer open={true} onClose={() => {}} title="A11y Title">
        Content
      </Drawer>,
    );
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAttribute('aria-labelledby');
  });

  it('renders title and children content', () => {
    render(
      <Drawer open={true} onClose={() => {}} title="Drawer Title">
        <p>Child content</p>
      </Drawer>,
    );
    expect(screen.getByText('Drawer Title')).toBeInTheDocument();
    expect(screen.getByText('Child content')).toBeInTheDocument();
  });

  // ── Side ────────────────────────────────────────────────────────────

  it('default side is "right"', () => {
    render(
      <Drawer open={true} onClose={() => {}} title="Test">
        Content
      </Drawer>,
    );
    const dialog = screen.getByRole('dialog');
    expect(dialog.className).toContain('right');
    expect(dialog.className).not.toContain('left');
  });

  it('side="left" renders with left class', () => {
    render(
      <Drawer open={true} onClose={() => {}} title="Test" side="left">
        Content
      </Drawer>,
    );
    const dialog = screen.getByRole('dialog');
    expect(dialog.className).toContain('left');
  });

  // ── Close events ────────────────────────────────────────────────────

  it('calls onClose when close button is clicked', async () => {
    const onClose = vi.fn();
    render(
      <Drawer open={true} onClose={onClose} title="Test">
        Content
      </Drawer>,
    );
    await userEvent.click(screen.getByRole('button', { name: /Close drawer/i }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when backdrop is clicked', async () => {
    const onClose = vi.fn();
    render(
      <Drawer open={true} onClose={onClose} title="Test">
        Content
      </Drawer>,
    );
    const backdrop = screen.getByRole('dialog').parentElement!;
    await userEvent.click(backdrop);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when Escape key is pressed', async () => {
    const onClose = vi.fn();
    render(
      <Drawer open={true} onClose={onClose} title="Test">
        Content
      </Drawer>,
    );
    // Focus the close button inside the drawer so the keydown event
    // originates from within the backdrop and bubbles to the onKeyDown handler.
    screen.getByRole('button', { name: /Close drawer/i }).focus();
    await userEvent.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
