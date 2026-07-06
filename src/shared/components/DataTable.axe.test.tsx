/**
 * axe-core a11y audit — DataTable
 *
 * DataTable renders a `<table>` with `aria-label`, sortable column headers
 * (with `aria-sort`), clickable rows (role="button"), and skeleton loading
 * rows. All states must be accessible.
 */
import { render } from '@testing-library/react';

import { testA11y } from '@/test-utils';

import { DataTable, type DataTableColumn } from './DataTable';

interface TestItem {
  readonly id: string;
  readonly name: string;
  readonly status: string;
}

const columns: ReadonlyArray<DataTableColumn<TestItem>> = [
  { key: 'name', label: 'Name', sortable: true, render: (item) => item.name },
  { key: 'status', label: 'Status', sortable: true, render: (item) => item.status },
];

const data: ReadonlyArray<TestItem> = [
  { id: '1', name: 'Project Alpha', status: 'Active' },
  { id: '2', name: 'Project Beta', status: 'Pending' },
  { id: '3', name: 'Project Gamma', status: 'Completed' },
];

const rowKey = (item: TestItem): string => item.id;

describe('DataTable a11y', () => {
  it('basic table with data has no violations', async () => {
    const { container } = render(
      <DataTable
        columns={columns}
        data={data}
        rowKey={rowKey}
        label="Projects list"
      />,
    );
    await testA11y(container);
  });

  it('sorted table has no violations', async () => {
    const { container } = render(
      <DataTable
        columns={columns}
        data={data}
        sortKey="name"
        sortOrder="asc"
        onSort={() => {}}
        rowKey={rowKey}
        label="Sorted projects"
      />,
    );
    await testA11y(container);
  });

  it('table with clickable rows has no violations', async () => {
    const { container } = render(
      <DataTable
        columns={columns}
        data={data}
        onRowClick={() => {}}
        rowKey={rowKey}
        label="Clickable projects"
      />,
    );
    await testA11y(container);
  });

  it('loading skeleton table has no violations', async () => {
    const { container } = render(
      <DataTable
        columns={columns}
        data={[]}
        isLoading
        rowKey={rowKey}
        label="Loading projects"
      />,
    );
    await testA11y(container);
  });

  it('empty table with empty state has no violations', async () => {
    const { container } = render(
      <DataTable
        columns={columns}
        data={[]}
        emptyState={<p>No projects found.</p>}
        rowKey={rowKey}
        label="Empty projects"
      />,
    );
    await testA11y(container);
  });

  it('right-aligned columns have no violations', async () => {
    const cols: ReadonlyArray<DataTableColumn<TestItem>> = [
      { key: 'name', label: 'Name', render: (item) => item.name },
      { key: 'status', label: 'Status', render: (item) => item.status, align: 'right' },
    ];
    const { container } = render(
      <DataTable
        columns={cols}
        data={data}
        rowKey={rowKey}
        label="Aligned columns"
      />,
    );
    await testA11y(container);
  });

  it('sorted descending table has no violations', async () => {
    const { container } = render(
      <DataTable
        columns={columns}
        data={data}
        sortKey="status"
        sortOrder="desc"
        onSort={() => {}}
        rowKey={rowKey}
        label="Descending sort"
      />,
    );
    await testA11y(container);
  });
});
