import type { Meta, StoryObj } from '@storybook/react';

import { asToastId } from '@/shared/types/brand';
import type { ToastEntry } from '@/shared/types/toast';

import { Toast } from './Toast';

function createEntry(
  overrides: Partial<ToastEntry> & { kind: ToastEntry['kind']; message: string },
): ToastEntry {
  return {
    id: asToastId('story-toast-1'),
    createdAt: Date.now(),
    durationMs: 5000,
    ...overrides,
  };
}

const meta: Meta<typeof Toast> = {
  title: 'Components/Toast',
  component: Toast,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  argTypes: {
    onDismiss: { action: 'dismiss' },
  },
};

export default meta;
type Story = StoryObj<typeof Toast>;

export const Info: Story = {
  args: {
    entry: createEntry({ kind: 'info', message: 'You have 3 new messages.' }),
    onDismiss: () => {},
  },
};

export const Success: Story = {
  args: {
    entry: createEntry({ kind: 'success', message: 'Project created successfully.' }),
    onDismiss: () => {},
  },
};

export const Warning: Story = {
  args: {
    entry: createEntry({ kind: 'warning', message: 'Your session will expire in 5 minutes.' }),
    onDismiss: () => {},
  },
};

export const Error: Story = {
  args: {
    entry: createEntry({ kind: 'error', message: 'Failed to save changes.' }),
    onDismiss: () => {},
  },
};

export const WithDescription: Story = {
  args: {
    entry: createEntry({
      kind: 'error',
      message: 'Upload failed',
      description: 'The file exceeds the maximum size of 10 MB.',
    }),
    onDismiss: () => {},
  },
};

export const Variants: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: 360 }}>
      <Toast
        entry={createEntry({ kind: 'info', message: 'Info notification.' })}
        onDismiss={() => {}}
      />
      <Toast
        entry={createEntry({ kind: 'success', message: 'Success notification.' })}
        onDismiss={() => {}}
      />
      <Toast
        entry={createEntry({ kind: 'warning', message: 'Warning notification.' })}
        onDismiss={() => {}}
      />
      <Toast
        entry={createEntry({ kind: 'error', message: 'Error notification.' })}
        onDismiss={() => {}}
      />
    </div>
  ),
};
