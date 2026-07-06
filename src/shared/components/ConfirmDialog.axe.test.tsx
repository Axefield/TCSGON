/**
 * axe-core a11y audit — ConfirmDialog
 *
 * ConfirmDialog renders via `createPortal` to `document.body` with
 * `role="alertdialog"`, `aria-modal="true"`, `aria-labelledby` and
 * `aria-describedby`. It returns null when `open={false}` so we only
 * test the open branch.
 */
import { render } from '@testing-library/react';

import { testA11y } from '@/test-utils';

import { ConfirmDialog } from './ConfirmDialog';

describe('ConfirmDialog a11y', () => {
  it('danger variant open dialog has no violations', async () => {
    const { container } = render(
      <ConfirmDialog
        open
        title="Delete project?"
        message="This action cannot be undone."
        variant="danger"
        onConfirm={() => {}}
        onCancel={() => {}}
      />,
    );
    await testA11y(container);
  });

  it('warning variant open dialog has no violations', async () => {
    const { container } = render(
      <ConfirmDialog
        open
        title="Unsaved changes"
        message="You have unsaved changes that will be lost."
        variant="warning"
        onConfirm={() => {}}
        onCancel={() => {}}
      />,
    );
    await testA11y(container);
  });

  it('info variant open dialog has no violations', async () => {
    const { container } = render(
      <ConfirmDialog
        open
        title="Information"
        message="This is an informational message."
        variant="info"
        onConfirm={() => {}}
        onCancel={() => {}}
      />,
    );
    await testA11y(container);
  });

  it('custom button labels have no violations', async () => {
    const { container } = render(
      <ConfirmDialog
        open
        title="Confirm action"
        message="Are you sure you want to proceed?"
        confirmLabel="Yes, proceed"
        cancelLabel="Go back"
        variant="warning"
        onConfirm={() => {}}
        onCancel={() => {}}
      />,
    );
    await testA11y(container);
  });

  it('pending (loading) state has no violations', async () => {
    const { container } = render(
      <ConfirmDialog
        open
        title="Processing…"
        message="Please wait while we process your request."
        variant="info"
        onConfirm={() => {}}
        onCancel={() => {}}
        isPending
      />,
    );
    await testA11y(container);
  });
});
