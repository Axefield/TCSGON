import type { Meta, StoryObj } from '@storybook/react';

import { Checkbox } from './Checkbox';

const meta: Meta<typeof Checkbox> = {
  title: 'Components/Checkbox',
  component: Checkbox,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Checkbox>;

export const Unchecked: Story = {
  args: {
    label: 'Accept terms',
    size: 'md',
  },
};

export const Checked: Story = {
  args: {
    label: 'Accept terms',
    defaultChecked: true,
    size: 'md',
  },
};

export const Indeterminate: Story = {
  args: {
    label: 'Select all',
    indeterminate: true,
    size: 'md',
  },
};

export const WithError: Story = {
  args: {
    label: 'Accept terms',
    error: 'You must accept the terms to continue',
    size: 'md',
  },
};

export const CheckedWithError: Story = {
  args: {
    label: 'Accept terms',
    defaultChecked: true,
    error: 'This field has an error',
    size: 'md',
  },
};

export const Sizes: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <Checkbox label="Small" size="sm" />
      <Checkbox label="Medium" size="md" />
      <Checkbox label="Large" size="lg" />
    </div>
  ),
};

export const Disabled: Story = {
  args: {
    label: 'Disabled option',
    disabled: true,
    size: 'md',
  },
};

export const DisabledChecked: Story = {
  args: {
    label: 'Disabled checked',
    disabled: true,
    defaultChecked: true,
    size: 'md',
  },
};

export const NoLabel: Story = {
  args: {
    size: 'md',
    'aria-label': 'Toggle option',
  },
};

export const Required: Story = {
  args: {
    label: 'Required field',
    required: true,
    size: 'md',
  },
};
