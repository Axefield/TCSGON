import type { Meta, StoryObj } from '@storybook/react';

import { Select } from './Select';

const meta: Meta<typeof Select> = {
  title: 'Components/Select',
  component: Select,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Select>;

export const Default: Story = {
  args: {
    children: (
      <>
        <option value="">Select role…</option>
        <option value="admin">Admin</option>
        <option value="editor">Editor</option>
        <option value="viewer">Viewer</option>
      </>
    ),
  },
};

export const WithLabel: Story = {
  args: {
    label: 'Role',
    children: (
      <>
        <option value="">Select role…</option>
        <option value="admin">Admin</option>
        <option value="editor">Editor</option>
        <option value="viewer">Viewer</option>
      </>
    ),
  },
};

export const WithError: Story = {
  args: {
    label: 'Country',
    error: 'Please select a country',
    children: (
      <>
        <option value="">Select…</option>
        <option value="us">United States</option>
        <option value="ca">Canada</option>
        <option value="uk">United Kingdom</option>
      </>
    ),
  },
};

export const WithHint: Story = {
  args: {
    label: 'Department',
    hint: 'Choose your primary department',
    children: (
      <>
        <option value="">Select…</option>
        <option value="engineering">Engineering</option>
        <option value="design">Design</option>
        <option value="product">Product</option>
      </>
    ),
  },
};

export const Disabled: Story = {
  args: {
    label: 'Read-only',
    disabled: true,
    value: 'option1',
    children: (
      <>
        <option value="option1">Option 1</option>
        <option value="option2">Option 2</option>
      </>
    ),
  },
};

export const Sizes: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Select size="sm" label="Small">
        <option>Option A</option>
        <option>Option B</option>
      </Select>
      <Select size="md" label="Medium">
        <option>Option A</option>
        <option>Option B</option>
      </Select>
      <Select size="lg" label="Large">
        <option>Option A</option>
        <option>Option B</option>
      </Select>
    </div>
  ),
};

export const FullWidth: Story = {
  args: {
    label: 'Category',
    fullWidth: true,
    children: (
      <>
        <option value="">All categories</option>
        <option value="tech">Technology</option>
        <option value="finance">Finance</option>
      </>
    ),
  },
  parameters: { layout: 'padded' },
};

export const ManyOptions: Story = {
  args: {
    label: 'Time zone',
    children: (
      <>
        {Array.from({ length: 20 }, (_, i) => (
          <option key={i} value={`tz-${i}`}>Time zone {i + 1}</option>
        ))}
      </>
    ),
  },
};
