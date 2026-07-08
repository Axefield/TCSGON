import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';

import { Button } from './Button';
import { ConfirmDialog } from './ConfirmDialog';

const meta: Meta<typeof ConfirmDialog> = {
  title: 'Components/ConfirmDialog',
  component: ConfirmDialog,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof ConfirmDialog>;

export const Danger: Story = {
  args: {
    open: true,
    title: 'Delete project?',
    message: 'This action cannot be undone. All associated data will be permanently removed.',
    variant: 'danger',
    confirmLabel: 'Delete',
    cancelLabel: 'Cancel',
    isPending: false,
    onConfirm: () => {},
    onCancel: () => {},
  },
};

export const Warning: Story = {
  args: {
    open: true,
    title: 'Unsaved changes',
    message: 'You have unsaved changes. Are you sure you want to leave this page?',
    variant: 'warning',
    confirmLabel: 'Leave',
    cancelLabel: 'Stay',
    onConfirm: () => {},
    onCancel: () => {},
  },
};

export const Info: Story = {
  args: {
    open: true,
    title: 'Confirm submission',
    message: 'Are you ready to submit your application? You will not be able to make changes after submission.',
    variant: 'info',
    confirmLabel: 'Submit',
    cancelLabel: 'Review',
    onConfirm: () => {},
    onCancel: () => {},
  },
};

export const Pending: Story = {
  args: {
    open: true,
    title: 'Delete project?',
    message: 'This action cannot be undone. All associated data will be permanently removed.',
    variant: 'danger',
    confirmLabel: 'Delete',
    cancelLabel: 'Cancel',
    isPending: true,
    onConfirm: () => {},
    onCancel: () => {},
  },
};

export const CustomLabels: Story = {
  args: {
    open: true,
    title: 'Archive item',
    message: 'This item will be archived and hidden from active views.',
    variant: 'info',
    confirmLabel: 'Archive',
    cancelLabel: 'Keep active',
    onConfirm: () => {},
    onCancel: () => {},
  },
};

export const Interactive: Story = {
  render: function InteractiveStory() {
    const [open, setOpen] = useState(false);

    return (
      <>
        <Button variant="danger" onClick={() => setOpen(true)}>
          Delete item
        </Button>
        <ConfirmDialog
          open={open}
          title="Delete item?"
          message="This action cannot be undone."
          variant="danger"
          onConfirm={() => { setOpen(false); }}
          onCancel={() => setOpen(false)}
        />
      </>
    );
  },
};
