import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';

import { Button } from './Button';
import { Modal } from './Modal';

const meta: Meta<typeof Modal> = {
  title: 'Components/Modal',
  component: Modal,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Modal>;

export const Default: Story = {
  args: {
    open: true,
    onClose: () => {},
    title: 'Edit project',
    children: <p style={{ margin: 0 }}>Modal content goes here.</p>,
  },
};

export const Sizes: Story = {
  render: function SizesStory() {
    const [size, setSize] = useState<'sm' | 'md' | 'lg'>('md');
    const [open, setOpen] = useState(false);

    return (
      <div style={{ display: 'flex', gap: 8 }}>
        {(['sm', 'md', 'lg'] as const).map((s) => (
          <Button
            key={s}
            variant="primary"
            onClick={() => { setSize(s); setOpen(true); }}
          >
            Open {s}
          </Button>
        ))}
        <Modal
          open={open}
          size={size}
          title={`${size} modal`}
          onClose={() => setOpen(false)}
        >
          <p style={{ margin: 0 }}>
            This is a <strong>{size}</strong> sized modal.
          </p>
        </Modal>
      </div>
    );
  },
};

export const LongContent: Story = {
  args: {
    open: true,
    onClose: () => {},
    title: 'Terms and conditions',
    children: (
      <div style={{ maxHeight: 300, overflowY: 'auto' }}>
        {Array.from({ length: 20 }, (_, i) => (
          <p key={i}>
            Paragraph {i + 1}. Lorem ipsum dolor sit amet, consectetur
            adipiscing elit. Sed do eiusmod tempor incididunt ut labore et
            dolore magna aliqua.
          </p>
        ))}
      </div>
    ),
  },
};

export const Interactive: Story = {
  render: function InteractiveStory() {
    const [open, setOpen] = useState(false);

    return (
      <>
        <Button variant="primary" onClick={() => setOpen(true)}>
          Open modal
        </Button>
        <Modal open={open} title="Confirm action" onClose={() => setOpen(false)}>
          <p style={{ marginTop: 0 }}>Are you sure you want to proceed?</p>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button variant="danger" onClick={() => setOpen(false)}>Confirm</Button>
          </div>
        </Modal>
      </>
    );
  },
};

export const NoCloseOnBackdrop: Story = {
  render: function NoCloseOnBackdropStory() {
    const [open, setOpen] = useState(false);

    return (
      <>
        <Button variant="primary" onClick={() => setOpen(true)}>
          Open modal (backdrop does not close)
        </Button>
        <Modal
          open={open}
          title="Important"
          closeOnBackdrop={false}
          onClose={() => setOpen(false)}
        >
          <p style={{ marginTop: 0 }}>
            This modal only closes via the X button or Esc key.
          </p>
          <Button variant="primary" onClick={() => setOpen(false)}>Got it</Button>
        </Modal>
      </>
    );
  },
};
