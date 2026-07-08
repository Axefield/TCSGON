import type { Meta, StoryObj } from '@storybook/react';
import { useState, useCallback } from 'react';

import { DataTable, type DataTableColumn } from './DataTable';
import { EmptyState } from './EmptyState';

interface Project {
  readonly id: string;
  readonly name: string;
  readonly status: string;
  readonly role: string;
}

const columns: ReadonlyArray<DataTableColumn<Project>> = [
  { key: 'name', label: 'Name', sortable: true, render: (p) => p.name },
  { key: 'status', label: 'Status', sortable: true, render: (p) => p.status },
  { key: 'role', label: 'Role', render: (p) => p.role },
];

const sampleData: ReadonlyArray<Project> = [
  { id: '1', name: 'Alpha', status: 'Active', role: 'Admin' },
  { id: '2', name: 'Beta', status: 'Pending', role: 'Editor' },
  { id: '3', name: 'Gamma', status: 'Archived', role: 'Viewer' },
  { id: '4', name: 'Delta', status: 'Active', role: 'Editor' },
  { id: '5', name: 'Epsilon', status: 'Active', role: 'Admin' },
];

const meta: Meta<typeof DataTable> = {
  title: 'Components/DataTable',
  component: DataTable,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof DataTable<Project>>;

export const Default: Story = {
  args: {
    columns,
    data: sampleData,
    rowKey: (p) => p.id,
    label: 'Projects list',
  },
};

export const Sortable: Story = {
  args: {
    columns,
    data: sampleData,
    sortKey: 'name',
    sortOrder: 'asc',
    onSort: () => {},
    rowKey: (p) => p.id,
    label: 'Projects list',
  },
};

export const Loading: Story = {
  args: {
    columns,
    data: [],
    isLoading: true,
    rowKey: (p) => p.id,
    label: 'Projects list',
  },
};

export const Empty: Story = {
  args: {
    columns,
    data: [],
    emptyState: <EmptyState heading="No projects found" description="Create a project to get started." />,
    rowKey: (p) => p.id,
    label: 'Projects list',
  },
};

export const WithRowClick: Story = {
  args: {
    columns,
    data: sampleData,
    onRowClick: () => { /* noop in story */ },
    rowKey: (p) => p.id,
    label: 'Projects list',
  },
};

export const SingleRow: Story = {
  args: {
    columns,
    data: sampleData.slice(0, 1),
    rowKey: (p) => p.id,
    label: 'Projects list',
  },
};

export const InteractiveSort: Story = {
  render: function InteractiveSortStory() {
    const [sortKey, setSortKey] = useState<string>('name');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

    const handleSort = useCallback((key: string, order: 'asc' | 'desc') => {
      setSortKey(key);
      setSortOrder(order);
    }, []);

    const sorted = [...sampleData].sort((a, b) => {
      const aVal = a[sortKey as keyof Project] ?? '';
      const bVal = b[sortKey as keyof Project] ?? '';
      const cmp = String(aVal).localeCompare(String(bVal));
      return sortOrder === 'asc' ? cmp : -cmp;
    });

    return (
      <DataTable
        columns={columns}
        data={sorted}
        sortKey={sortKey}
        sortOrder={sortOrder}
        onSort={handleSort}
        onRowClick={() => { /* noop */ }}
        rowKey={(p) => p.id}
        label="Projects list"
      />
    );
  },
};
