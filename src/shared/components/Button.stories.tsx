import type { Meta, StoryObj } from '@storybook/react';

import { Button } from './Button';

const meta: Meta<typeof Button> = {
  title: 'Components/Button',
  component: Button,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Button>;

export const Primary: Story = {
  args: {
    variant: 'primary',
    children: 'Primary',
  },
};

export const Secondary: Story = {
  args: {
    variant: 'secondary',
    children: 'Secondary',
  },
};

export const Danger: Story = {
  args: {
    variant: 'danger',
    children: 'Delete',
  },
};

export const Ghost: Story = {
  args: {
    variant: 'ghost',
    children: 'Ghost',
  },
};

export const Sizes: Story = {
  render: () => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <Button size="sm">Small</Button>
      <Button size="md">Medium</Button>
      <Button size="lg">Large</Button>
    </div>
  ),
};

export const Loading: Story = {
  args: {
    loading: true,
    children: 'Saving',
    variant: 'primary',
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
    children: 'Disabled',
    variant: 'primary',
  },
};

export const LoadingDisabled: Story = {
  args: {
    loading: true,
    disabled: true,
    children: 'Processing',
    variant: 'primary',
  },
};

export const WithIconLeft: Story = {
  args: {
    children: 'Add item',
    variant: 'primary',
    icon: <span>+</span>,
    iconPosition: 'left',
  },
};

export const WithIconRight: Story = {
  args: {
    children: 'Next',
    variant: 'primary',
    icon: <span>→</span>,
    iconPosition: 'right',
  },
};

export const IconOnly: Story = {
  args: {
    variant: 'ghost',
    icon: <span>⚙</span>,
    'aria-label': 'Settings',
  },
};

export const FullWidth: Story = {
  args: {
    children: 'Full Width Button',
    variant: 'primary',
    fullWidth: true,
  },
  parameters: { layout: 'padded' },
};

export const AsLink: Story = {
  args: {
    href: 'https://example.com',
    children: 'Link Button',
    variant: 'secondary',
    target: '_blank',
  },
};

export const Variants: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 8 }}>
      <Button variant="primary">Primary</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="danger">Danger</Button>
      <Button variant="ghost">Ghost</Button>
    </div>
  ),
};

export const LoadingVariants: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 8 }}>
      <Button variant="primary" loading>Primary</Button>
      <Button variant="secondary" loading>Secondary</Button>
      <Button variant="danger" loading>Danger</Button>
      <Button variant="ghost" loading>Ghost</Button>
    </div>
  ),
};

export const SubmitButton: Story = {
  args: {
    type: 'submit',
    children: 'Submit form',
    variant: 'primary',
  },
};
