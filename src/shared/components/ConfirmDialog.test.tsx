/**
 * ConfirmDialog component tests.
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { ConfirmDialog } from './ConfirmDialog';

describe('ConfirmDialog', () => {
  it('renders null when closed', () => {
    const { container } = render(
      <ConfirmDialog
        open={false}
        title="Delete?"
        message="Sure?"
        onConfirm={() => {}}
        onCancel={() => {}}
      />,
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders dialog when open', () => {
    render(
      <ConfirmDialog
        open={true}
        title="Delete project?"
        message="This cannot be undone."
        onConfirm={() => {}}
        onCancel={() => {}}
      />,
    );
    expect(
      screen.getByRole('alertdialog', { name: /Delete project/i }),
    ).toBeInTheDocument();
    expect(screen.getByText('This cannot be undone.')).toBeInTheDocument();
  });

  it('has correct accessibility attributes', () => {
    render(
      <ConfirmDialog
        open={true}
        title="Confirm"
        message="Are you sure?"
        onConfirm={() => {}}
        onCancel={() => {}}
      />,
    );
    const dialog = screen.getByRole('alertdialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAttribute('aria-labelledby');
    expect(dialog).toHaveAttribute('aria-describedby');
  });

  it('calls onCancel when Escape is pressed', async () => {
    const onCancel = vi.fn();
    render(
      <ConfirmDialog
        open={true}
        title="Confirm"
        message="Sure?"
        onConfirm={() => {}}
        onCancel={onCancel}
      />,
    );
    await userEvent.keyboard('{Escape}');
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('calls onConfirm when confirm button is clicked', async () => {
    const onConfirm = vi.fn();
    render(
      <ConfirmDialog
        open={true}
        title="Confirm"
        message="Sure?"
        onConfirm={onConfirm}
        onCancel={() => {}}
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Confirm' }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('calls onCancel when cancel button is clicked', async () => {
    const onCancel = vi.fn();
    render(
      <ConfirmDialog
        open={true}
        title="Confirm"
        message="Sure?"
        onConfirm={() => {}}
        onCancel={onCancel}
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('disables buttons when isPending is true', () => {
    render(
      <ConfirmDialog
        open={true}
        title="Confirm"
        message="Sure?"
        onConfirm={() => {}}
        onCancel={() => {}}
        isPending={true}
      />,
    );
    const buttons = screen.getAllByRole('button');
    buttons.forEach((btn) => expect(btn).toBeDisabled());
  });

  it('shows "Processing…" when isPending', () => {
    render(
      <ConfirmDialog
        open={true}
        title="Confirm"
        message="Sure?"
        onConfirm={() => {}}
        onCancel={() => {}}
        isPending={true}
      />,
    );
    expect(screen.getByText('Processing…')).toBeInTheDocument();
  });

  it('accepts custom button labels', () => {
    render(
      <ConfirmDialog
        open={true}
        title="Confirm"
        message="Sure?"
        confirmLabel="Yes, delete"
        cancelLabel="No, keep"
        onConfirm={() => {}}
        onCancel={() => {}}
      />,
    );
    expect(
      screen.getByRole('button', { name: 'Yes, delete' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'No, keep' }),
    ).toBeInTheDocument();
  });

  it('renders with variant class on confirm button', () => {
    render(
      <ConfirmDialog
        open={true}
        title="Confirm"
        message="Sure?"
        variant="danger"
        onConfirm={() => {}}
        onCancel={() => {}}
      />,
    );
    const confirmBtn = screen.getByRole('button', { name: 'Confirm' });
    // The danger class is applied
    expect(confirmBtn.className).toContain('danger');
  });
});
