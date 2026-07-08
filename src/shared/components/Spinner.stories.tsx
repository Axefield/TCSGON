import type { Meta, StoryObj } from '@storybook/react';

import { Spinner } from './Spinner';

const meta: Meta<typeof Spinner> = {
  title: 'Components/Spinner',
  component: Spinner,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Spinner>;

export const Default: Story = {
  args: {},
};

export const Sizes: Story = {
  render: () => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
      <Spinner size="sm" />
      <Spinner size="md" />
      <Spinner size="lg" />
    </div>
  ),
};

export const WithLabel: Story = {
  args: {
    label: 'Loading users…',
    size: 'md',
  },
};

export const Decorative: Story = {
  args: {
    decorative: true,
    size: 'sm',
  },
};

export const InContext: Story = {
  render: () => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <Spinner size="sm" label="Saving…" />
      <span style={{ color: 'var(--color-text-secondary, #64748b)', fontSize: 14 }}>
        Saving changes…
      </span>
    </div>
  ),
};

export const ButtonInline: Story = {
  render: () => (
    <button
      type="button"
      disabled
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        padding: '8px 16px',
        borderRadius: 6,
        border: '1px solid var(--color-border, #e2e8f0)',
        background: 'var(--color-bg, #fff)',
        cursor: 'not-allowed',
      }}
    >
      <Spinner size="sm" decorative />
      Processing…
    </button>
  ),
};
