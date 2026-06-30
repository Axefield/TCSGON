/**
 * useConfirm hook tests.
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useCallback, type ReactElement } from 'react';
import { describe, expect, it } from 'vitest';

import { useConfirm } from './useConfirm';

function TestHarness(): ReactElement {
  const { confirm, ConfirmDialogComponent } = useConfirm();

  const handleDelete = useCallback(async () => {
    await confirm({
      title: 'Delete item?',
      message: 'Are you sure?',
      variant: 'danger',
    });
  }, [confirm]);

  return (
    <div>
      <button type="button" onClick={handleDelete}>
        Delete
      </button>
      <ConfirmDialogComponent />
    </div>
  );
}

describe('useConfirm', () => {
  it('renders dialog when confirm is called and closes on cancel', async () => {
    render(<TestHarness />);

    // Dialog should not be visible initially
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();

    // Click delete to trigger confirm
    await userEvent.click(screen.getByRole('button', { name: 'Delete' }));

    // Dialog should now be visible
    expect(
      screen.getByRole('alertdialog', { name: /Delete item/i }),
    ).toBeInTheDocument();
    expect(screen.getByText('Are you sure?')).toBeInTheDocument();

    // Click cancel — dialog should close
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
  });

  it('closes dialog on confirm', async () => {
    render(<TestHarness />);

    await userEvent.click(screen.getByRole('button', { name: 'Delete' }));
    expect(
      screen.getByRole('alertdialog', { name: /Delete item/i }),
    ).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Confirm' }));
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
  });
});
