/**
 * axe-core a11y audit — VirtualizedDataTable
 *
 * VirtualizedDataTable renders a role="grid" container with a sticky header
 * (role="rowgroup" > role="row" > role="columnheader") and a virtualized body
 * (role="rowgroup" > role="row" > role="cell"). Sort buttons use aria-sort
 * and aria-label; clickable rows receive tabIndex={-1} and aria-label.
 *
 * We mock @tanstack/react-virtual because jsdom cannot compute scroll
 * container dimensions, so the real virtualizer would produce zero items.
 * The mock provides deterministic virtual items matching the data count.
 *
 * @phase Phase 7 — Design System & Feature Hardening
 */
import { render } from '@testing-library/react';
import { vi } from 'vitest';

import { testA11y } from '@/test-utils';

import type { DataTableColumn } from './DataTable';
import { VirtualizedDataTable } from './VirtualizedDataTable';

// ---------------------------------------------------------------------------
// Mock @tanstack/react-virtual — jsdom lacks layout, so the real virtualizer
// would never produce virtual items.  This mock generates items based on the
// count passed to useVirtualizer so we can test the actual rendered DOM.
// ---------------------------------------------------------------------------
vi.mock('@tanstack/react-virtual', () => ({
  useVirtualizer: (opts: { count: number }) => {
    const items = Array.from({ length: opts.count }, (_, i) => ({
      index: i,
      start: i * 48,
      size: 48,
      key: i,
      lane: 0,
    }));
    return {
      getVirtualItems: () => items,
      getTotalSize: () => opts.count * 48,
      scrollToIndex: () => {},
    };
  },
}));

// ---------------------------------------------------------------------------
// Test data & helpers
// ---------------------------------------------------------------------------
interface TestItem {
  readonly id: string;
  readonly name: string;
  readonly status: string;
  readonly role: string;
}

const columns: ReadonlyArray<DataTableColumn<TestItem>> = [
  { key: 'name', label: 'Name', sortable: true, render: (item) => item.name },
  {
    key: 'status',
    label: 'Status',
    sortable: true,
    render: (item) => item.status,
  },
  { key: 'role', label: 'Role', render: (item) => item.role },
];

const data: ReadonlyArray<TestItem> = [
  { id: '1', name: 'Project Alpha', status: 'Active', role: 'Owner' },
  { id: '2', name: 'Project Beta', status: 'Review', role: 'Editor' },
  { id: '3', name: 'Project Gamma', status: 'Complete', role: 'Viewer' },
];

const rowKey = (item: TestItem): string => item.id;

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('VirtualizedDataTable a11y', () => {
  it('table with data has no a11y violations', async () => {
    const { container } = render(
      <VirtualizedDataTable
        columns={columns}
        data={data}
        rowKey={rowKey}
        label="Projects list"
      />,
    );
    await testA11y(container);
  });

  it('table with sortable columns (no active sort) has no a11y violations', async () => {
    const { container } = render(
      <VirtualizedDataTable
        columns={columns}
        data={data}
        rowKey={rowKey}
        label="Sortable projects"
        onSort={vi.fn()}
      />,
    );
    await testA11y(container);
  });

  it('table with ascending sort indicator has no a11y violations', async () => {
    const { container } = render(
      <VirtualizedDataTable
        columns={columns}
        data={data}
        rowKey={rowKey}
        label="Ascending projects"
        onSort={vi.fn()}
        sortKey="name"
        sortOrder="asc"
      />,
    );
    await testA11y(container);
  });

  it('table with descending sort indicator has no a11y violations', async () => {
    const { container } = render(
      <VirtualizedDataTable
        columns={columns}
        data={data}
        rowKey={rowKey}
        label="Descending projects"
        onSort={vi.fn()}
        sortKey="status"
        sortOrder="desc"
      />,
    );
    await testA11y(container);
  });

  it('table with row click handler has no a11y violations', async () => {
    const { container } = render(
      <VirtualizedDataTable
        columns={columns}
        data={data}
        rowKey={rowKey}
        label="Clickable projects"
        onRowClick={vi.fn()}
      />,
    );
    await testA11y(container);
  });

  it('table with sort and row click has no a11y violations', async () => {
    const { container } = render(
      <VirtualizedDataTable
        columns={columns}
        data={data}
        rowKey={rowKey}
        label="Interactive projects"
        onSort={vi.fn()}
        sortKey="name"
        sortOrder="asc"
        onRowClick={vi.fn()}
      />,
    );
    await testA11y(container);
  });

  it('table with single row has no a11y violations', async () => {
    const singleRowData: ReadonlyArray<TestItem> = [
      { id: '1', name: 'Solo Project', status: 'Active', role: 'Owner' },
    ];
    const { container } = render(
      <VirtualizedDataTable
        columns={columns}
        data={singleRowData}
        rowKey={rowKey}
        label="Single project"
      />,
    );
    await testA11y(container);
  });

  it('table with column alignment and custom widths has no a11y violations', async () => {
    const styledColumns: ReadonlyArray<DataTableColumn<TestItem>> = [
      {
        key: 'name',
        label: 'Name',
        align: 'left',
        width: '240px',
        render: (item) => item.name,
      },
      {
        key: 'status',
        label: 'Status',
        align: 'center',
        width: '120px',
        sortable: true,
        render: (item) => item.status,
      },
      {
        key: 'role',
        label: 'Role',
        align: 'right',
        width: '100px',
        render: (item) => item.role,
      },
    ];
    const { container } = render(
      <VirtualizedDataTable
        columns={styledColumns}
        data={data}
        rowKey={rowKey}
        label="Styled columns"
      />,
    );
    await testA11y(container);
  });

  it('non-sortable columns have no a11y violations', async () => {
    const viewColumns: ReadonlyArray<DataTableColumn<TestItem>> = [
      { key: 'name', label: 'Name', render: (item) => item.name },
      { key: 'status', label: 'Status', render: (item) => item.status },
    ];
    const { container } = render(
      <VirtualizedDataTable
        columns={viewColumns}
        data={data}
        rowKey={rowKey}
        label="View-only projects"
      />,
    );
    await testA11y(container);
  });
});
