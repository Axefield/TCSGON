import type { Meta, StoryObj } from '@storybook/react';
import { useState, useCallback } from 'react';

import type { DataTableColumn } from './DataTable';
import { VirtualizedDataTable } from './VirtualizedDataTable';

interface Row {
  readonly id: string;
  readonly name: string;
  readonly email: string;
  readonly role: string;
}

const columns: ReadonlyArray<DataTableColumn<Row>> = [
  { key: 'name', label: 'Name', sortable: true, render: (r) => r.name },
  { key: 'email', label: 'Email', sortable: true, render: (r) => r.email },
  { key: 'role', label: 'Role', render: (r) => r.role },
];

function generateRows(count: number): ReadonlyArray<Row> {
  return Array.from({ length: count }, (_, i) => ({
    id: `row-${i + 1}`,
    name: `User ${i + 1}`,
    email: `user${i + 1}@example.com`,
    role: i % 3 === 0 ? 'Admin' : i % 3 === 1 ? 'Editor' : 'Viewer',
  }));
}

const meta: Meta<typeof VirtualizedDataTable> = {
  title: 'Components/VirtualizedDataTable',
  component: VirtualizedDataTable,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof VirtualizedDataTable<Row>>;

export const Default: Story = {
  args: {
    columns,
    data: generateRows(100),
    rowKey: (r) => r.id,
    label: 'Users list',
  },
};

export const WithRowClick: Story = {
  args: {
    columns,
    data: generateRows(100),
    rowKey: (r) => r.id,
    label: 'Users list',
    onRowClick: () => {},
  },
};

export const ManyRows: Story = {
  args: {
    columns,
    data: generateRows(10000),
    rowKey: (r) => r.id,
    label: 'Large users list',
  },
};

export const WithSort: Story = {
  args: {
    columns,
    data: generateRows(100),
    sortKey: 'name',
    sortOrder: 'asc',
    onSort: () => {},
    rowKey: (r) => r.id,
    label: 'Users list',
  },
};

export const FewRows: Story = {
  args: {
    columns,
    data: generateRows(3),
    rowKey: (r) => r.id,
    label: 'Users list',
  },
};

export const InteractiveSort: Story = {
  render: function InteractiveSortStory() {
    const [sortKey, setSortKey] = useState<string | undefined>('name');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

    const handleSort = useCallback((key: string, order: 'asc' | 'desc') => {
      setSortKey(key);
      setSortOrder(order);
    }, []);

    const allData = generateRows(200);
    const sorted = [...allData].sort((a, b) => {
      const aVal = a[sortKey as keyof Row] ?? '';
      const bVal = b[sortKey as keyof Row] ?? '';
      const cmp = String(aVal).localeCompare(String(bVal));
      return sortOrder === 'asc' ? cmp : -cmp;
    });

    return (
      <VirtualizedDataTable
        columns={columns}
        data={sorted}
        sortKey={sortKey}
        sortOrder={sortOrder}
        onSort={handleSort}
        rowKey={(r) => r.id}
        label="Interactive sort"
      />
    );
  },
};
