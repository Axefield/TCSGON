import type { Meta, StoryObj } from '@storybook/react';

import { Skeleton } from './Skeleton';

const meta: Meta<typeof Skeleton> = {
  title: 'Components/Skeleton',
  component: Skeleton,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Skeleton>;

export const Default: Story = {
  args: {
    width: 200,
    height: 20,
  },
};

export const Text: Story = {
  render: () => (
    <div style={{ width: 300, display: 'flex', flexDirection: 'column', gap: 8 }}>
      <Skeleton width="60%" height={24} />
      <Skeleton width="100%" height={16} />
      <Skeleton width="100%" height={16} />
      <Skeleton width="80%" height={16} />
      <Skeleton width="40%" height={16} />
    </div>
  ),
};

export const Avatar: Story = {
  render: () => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <Skeleton width={48} height={48} radius={999} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <Skeleton width={120} height={16} />
        <Skeleton width={80} height={14} />
      </div>
    </div>
  ),
};

export const Card: Story = {
  render: () => (
    <div
      style={{
        width: 280,
        border: '1px solid var(--color-border, #e2e8f0)',
        borderRadius: 8,
        padding: 16,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}
    >
      <Skeleton width="100%" height={140} radius={4} />
      <Skeleton width="80%" height={20} />
      <Skeleton width="100%" height={14} />
      <Skeleton width="60%" height={14} />
      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
        <Skeleton width={80} height={32} radius={4} />
        <Skeleton width={80} height={32} radius={4} />
      </div>
    </div>
  ),
};

export const WithLabel: Story = {
  args: {
    width: 200,
    height: 40,
    label: 'Loading content…',
    radius: 4,
  },
};

export const Rounded: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 8 }}>
      <Skeleton width={40} height={40} radius={4} />
      <Skeleton width={40} height={40} radius={8} />
      <Skeleton width={40} height={40} radius={20} />
      <Skeleton width={40} height={40} radius={999} />
    </div>
  ),
};
