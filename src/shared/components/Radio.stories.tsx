import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';

import { Radio } from './Radio';

const meta: Meta<typeof Radio> = {
  title: 'Components/Radio',
  component: Radio,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Radio>;

export const Default: Story = {
  render: function DefaultStory() {
    const [value, setValue] = useState('active');

    return (
      <Radio.Group name="status" value={value} onChange={setValue} label="Filter by status">
        <Radio value="active" label="Active" />
        <Radio value="paused" label="Paused" />
        <Radio value="completed" label="Completed" />
      </Radio.Group>
    );
  },
};

export const WithDisabled: Story = {
  render: function WithDisabledStory() {
    const [value, setValue] = useState('option1');

    return (
      <Radio.Group name="disabled-example" value={value} onChange={setValue} label="Choose one">
        <Radio value="option1" label="Option 1" />
        <Radio value="option2" label="Option 2 (disabled)" disabled />
        <Radio value="option3" label="Option 3" />
      </Radio.Group>
    );
  },
};

export const AllDisabled: Story = {
  render: function AllDisabledStory() {
    const [value, setValue] = useState('a');

    return (
      <Radio.Group name="all-disabled" value={value} onChange={setValue} label="Read-only options">
        <Radio value="a" label="Read only A" disabled />
        <Radio value="b" label="Read only B" disabled />
        <Radio value="c" label="Read only C" disabled />
      </Radio.Group>
    );
  },
};

export const SingleOption: Story = {
  render: function SingleOptionStory() {
    const [value, setValue] = useState('yes');

    return (
      <Radio.Group name="single" value={value} onChange={setValue} label="Confirm">
        <Radio value="yes" label="I agree" />
      </Radio.Group>
    );
  },
};

export const ManyOptions: Story = {
  render: function ManyOptionsStory() {
    const [value, setValue] = useState('item-1');

    return (
      <Radio.Group name="many" value={value} onChange={setValue} label="Select an item">
        {Array.from({ length: 8 }, (_, i) => (
          <Radio key={i} value={`item-${i + 1}`} label={`Item ${i + 1}`} />
        ))}
      </Radio.Group>
    );
  },
};
