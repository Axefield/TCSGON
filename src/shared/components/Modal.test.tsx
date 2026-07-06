/**
 * Modal component tests.
 *
 * Modal renders via `createPortal` to `document.body`, so portal content
 * is NOT inside the RTL `container`. All queries use `screen` which
 * searches `document.body` by default.
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { Modal } from './Modal';

describe('Modal', () => {
  // ── Render ──────────────────────────────────────────────────────────

  it('returns null when closed', () => {
    const { container } = render(
      <Modal open={false} onClose={() => {}} title="Test">
        Content
      </Modal>,
    );
    expect(container.innerHTML).toBe('');
  });

  it('renders dialog when open', () => {
    render(
      <Modal open={true} onClose={() => {}} title="Test Modal">
        Content here
      </Modal>,
    );
    const dialog = screen.getByRole('dialog', { name: /Test Modal/i });
    expect(dialog).toBeInTheDocument();
  });

  it('has correct aria-modal and aria-labelledby attributes', () => {
    render(
      <Modal open={true} onClose={() => {}} title="A11y Title">
        Content
      </Modal>,
    );
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAttribute('aria-labelledby');
  });

  it('renders title and children content', () => {
    render(
      <Modal open={true} onClose={() => {}} title="Modal Title">
        <p>Child content</p>
      </Modal>,
    );
    expect(screen.getByText('Modal Title')).toBeInTheDocument();
    expect(screen.getByText('Child content')).toBeInTheDocument();
  });

  // ── Close events ────────────────────────────────────────────────────

  it('calls onClose when close button is clicked', async () => {
    const onClose = vi.fn();
    render(
      <Modal open={true} onClose={onClose} title="Test">
        Content
      </Modal>,
    );
    await userEvent.click(screen.getByRole('button', { name: /Close dialog/i }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when backdrop is clicked', async () => {
    const onClose = vi.fn();
    render(
      <Modal open={true} onClose={onClose} title="Test">
        Content
      </Modal>,
    );
    // The backdrop is the parent of the dialog element
    const backdrop = screen.getByRole('dialog').parentElement!;
    await userEvent.click(backdrop);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when Escape key is pressed', async () => {
    const onClose = vi.fn();
    render(
      <Modal open={true} onClose={onClose} title="Test">
        Content
      </Modal>,
    );
    // Focus the close button inside the dialog so the keydown event
    // originates from within the backdrop and bubbles to the onKeyDown handler.
    screen.getByRole('button', { name: /Close dialog/i }).focus();
    await userEvent.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('does NOT call onClose when closeOnBackdrop is false and backdrop clicked', async () => {
    const onClose = vi.fn();
    render(
      <Modal open={true} onClose={onClose} title="Test" closeOnBackdrop={false}>
        Content
      </Modal>,
    );
    const backdrop = screen.getByRole('dialog').parentElement!;
    await userEvent.click(backdrop);
    expect(onClose).not.toHaveBeenCalled();
  });

  it('does NOT call onClose when closeOnEsc is false and Escape pressed', async () => {
    const onClose = vi.fn();
    render(
      <Modal open={true} onClose={onClose} title="Test" closeOnEsc={false}>
        Content
      </Modal>,
    );
    screen.getByRole('button', { name: /Close dialog/i }).focus();
    await userEvent.keyboard('{Escape}');
    expect(onClose).not.toHaveBeenCalled();
  });

  // ── Size variant ────────────────────────────────────────────────────

  it('default size applies "md" class', () => {
    render(
      <Modal open={true} onClose={() => {}} title="Test">
        Content
      </Modal>,
    );
    const dialog = screen.getByRole('dialog');
    expect(dialog.className).toContain('md');
  });

  it('"sm" size works', () => {
    render(
      <Modal open={true} onClose={() => {}} title="Test" size="sm">
        Content
      </Modal>,
    );
    const dialog = screen.getByRole('dialog');
    expect(dialog.className).toContain('sm');
  });

  it('"lg" size works', () => {
    render(
      <Modal open={true} onClose={() => {}} title="Test" size="lg">
        Content
      </Modal>,
    );
    const dialog = screen.getByRole('dialog');
    expect(dialog.className).toContain('lg');
  });
});
