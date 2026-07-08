import type { Meta, StoryObj } from '@storybook/react';

import { Tooltip } from './Tooltip';

const meta: Meta<typeof Tooltip> = {
  title: 'Components/Tooltip',
  component: Tooltip,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Tooltip>;

export const Top: Story = {
  args: {
    content: 'Delete item',
    position: 'top',
    children: <button type="button" style={{ padding: '4px 12px' }}>×</button>,
  },
};

export const Bottom: Story = {
  args: {
    content: 'Save changes',
    position: 'bottom',
    children: <button type="button" style={{ padding: '4px 12px' }}>Save</button>,
  },
};

export const Left: Story = {
  args: {
    content: 'Go back',
    position: 'left',
    children: <button type="button" style={{ padding: '4px 12px' }}>←</button>,
  },
};

export const Right: Story = {
  args: {
    content: 'More info',
    position: 'right',
    children: <button type="button" style={{ padding: '4px 12px' }}>→</button>,
  },
};

export const CustomDelays: Story = {
  args: {
    content: 'Slow reveal',
    position: 'top',
    showDelay: 2000,
    hideDelay: 500,
    children: <button type="button" style={{ padding: '4px 12px' }}>Hover (2s delay)</button>,
  },
};

export const LongContent: Story = {
  args: {
    content: 'This tooltip has a longer description to demonstrate wrapping behavior.',
    position: 'top',
    children: <button type="button" style={{ padding: '4px 12px' }}>Hover</button>,
  },
};

export const Positions: Story = {
  render: () => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 40, padding: 60 }}>
      <div style={{ textAlign: 'center' }}>
        <Tooltip content="Top tooltip" position="top">
          <button type="button" style={{ padding: '8px 16px' }}>Top</button>
        </Tooltip>
      </div>
      <div style={{ textAlign: 'center' }}>
        <Tooltip content="Bottom tooltip" position="bottom">
          <button type="button" style={{ padding: '8px 16px' }}>Bottom</button>
        </Tooltip>
      </div>
      <div style={{ textAlign: 'center' }}>
        <Tooltip content="Left tooltip" position="left">
          <button type="button" style={{ padding: '8px 16px' }}>Left</button>
        </Tooltip>
      </div>
      <div style={{ textAlign: 'center' }}>
        <Tooltip content="Right tooltip" position="right">
          <button type="button" style={{ padding: '8px 16px' }}>Right</button>
        </Tooltip>
      </div>
    </div>
  ),
};
