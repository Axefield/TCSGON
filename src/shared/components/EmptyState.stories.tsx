import type { Meta, StoryObj } from '@storybook/react';

import { EmptyState } from './EmptyState';

const meta: Meta<typeof EmptyState> = {
  title: 'Components/EmptyState',
  component: EmptyState,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof EmptyState>;

export const Minimal: Story = {
  args: {
    heading: 'No data',
  },
};

export const WithDescription: Story = {
  args: {
    heading: 'No projects yet',
    description: 'Create your first project to get started.',
  },
};

export const WithAction: Story = {
  args: {
    heading: 'No projects yet',
    description: 'Create your first project to track your work.',
    action: { label: 'Create project', onClick: () => {} },
  },
};

export const WithCustomIcon: Story = {
  args: {
    icon: (
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
        <polyline points="13 2 13 9 20 9" />
      </svg>
    ),
    heading: 'No documents',
    description: 'Upload a document to get started.',
    action: { label: 'Upload', onClick: () => {} },
  },
};

export const Full: Story = {
  args: {
    icon: (
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="12" cy="12" r="10" />
        <path d="M8 12h8" />
      </svg>
    ),
    heading: 'Nothing here yet',
    description: 'Get started by adding your first item. It will appear here once created.',
    action: { label: 'Add item', onClick: () => {} },
  },
};

export const LongDescription: Story = {
  args: {
    heading: 'No search results',
    description: 'We could not find any items matching your search. Try adjusting your filters or search terms to find what you are looking for.',
    action: { label: 'Clear filters', onClick: () => {} },
  },
};
