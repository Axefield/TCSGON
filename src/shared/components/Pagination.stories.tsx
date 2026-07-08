import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';

import { Pagination } from './Pagination';

const meta: Meta<typeof Pagination> = {
  title: 'Components/Pagination',
  component: Pagination,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Pagination>;

export const Default: Story = {
  args: {
    currentPage: 1,
    totalPages: 10,
    onPageChange: () => {},
  },
};

export const MiddlePage: Story = {
  args: {
    currentPage: 5,
    totalPages: 10,
    onPageChange: () => {},
  },
};

export const LastPage: Story = {
  args: {
    currentPage: 10,
    totalPages: 10,
    onPageChange: () => {},
  },
};

export const SinglePage: Story = {
  args: {
    currentPage: 1,
    totalPages: 1,
    onPageChange: () => {},
  },
};

export const TwoPages: Story = {
  args: {
    currentPage: 1,
    totalPages: 2,
    onPageChange: () => {},
  },
};

export const ManyPages: Story = {
  args: {
    currentPage: 50,
    totalPages: 100,
    onPageChange: () => {},
  },
};

export const Interactive: Story = {
  render: function InteractiveStory() {
    const [page, setPage] = useState(1);
    const total = 20;

    return (
      <div style={{ textAlign: 'center' }}>
        <p style={{ marginBottom: 16, fontVariantNumeric: 'tabular-nums' }}>
          Current page: {page} of {total}
        </p>
        <Pagination currentPage={page} totalPages={total} onPageChange={setPage} />
      </div>
    );
  },
};

export const CustomLabel: Story = {
  args: {
    currentPage: 3,
    totalPages: 8,
    label: 'Search results',
    onPageChange: () => {},
  },
};
