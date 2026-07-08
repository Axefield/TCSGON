import type { Meta, StoryObj } from '@storybook/react';

import { ToastRegion } from './ToastRegion';

const meta: Meta<typeof ToastRegion> = {
  title: 'Components/ToastRegion',
  component: ToastRegion,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof ToastRegion>;

/**
 * ToastRegion renders live regions for toasts from the Redux store.
 * In this story, it renders as a positioned example showing the layout.
 * In a real app, it is mounted once at the AppShell root and toasts
 * are dispatched via Redux actions.
 */
export const Default: Story = {
  render: () => (
    <div
      style={{
        position: 'relative',
        height: 200,
        border: '1px dashed var(--color-border, #e2e8f0)',
        borderRadius: 8,
      }}
    >
      <ToastRegion />
    </div>
  ),
};
