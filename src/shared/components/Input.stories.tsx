import type { Meta, StoryObj } from '@storybook/react';

import { Input } from './Input';

const meta: Meta<typeof Input> = {
  title: 'Components/Input',
  component: Input,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Input>;

export const Default: Story = {
  args: {
    placeholder: 'Enter text…',
  },
};

export const WithLabel: Story = {
  args: {
    label: 'Full name',
    placeholder: 'John Doe',
  },
};

export const WithError: Story = {
  args: {
    label: 'Email',
    type: 'email',
    defaultValue: 'invalid',
    error: 'Please enter a valid email address',
  },
};

export const WithHint: Story = {
  args: {
    label: 'Username',
    hint: 'Must be at least 3 characters',
    placeholder: 'jdoe',
  },
};

export const Password: Story = {
  args: {
    label: 'Password',
    type: 'password',
    defaultValue: 's3cret',
  },
};

export const Disabled: Story = {
  args: {
    label: 'Disabled',
    disabled: true,
    defaultValue: 'Cannot edit',
  },
};

export const Sizes: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Input size="sm" label="Small" placeholder="sm" />
      <Input size="md" label="Medium" placeholder="md" />
      <Input size="lg" label="Large" placeholder="lg" />
    </div>
  ),
};

export const FullWidth: Story = {
  args: {
    label: 'Search',
    placeholder: 'Type to search…',
    fullWidth: true,
  },
  parameters: { layout: 'padded' },
};

export const ErrorAndHint: Story = {
  args: {
    label: 'Password',
    type: 'password',
    hint: 'Hint is hidden when error is shown',
    error: 'This field is required',
  },
};

export const Required: Story = {
  args: {
    label: 'Email',
    type: 'email',
    required: true,
    placeholder: 'you@example.com',
  },
};
