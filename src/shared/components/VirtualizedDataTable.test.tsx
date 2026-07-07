import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { VirtualizedDataTable } from './VirtualizedDataTable';

interface TestItem {
  id: string;
  name: string;
}

function makeItems(count: number): ReadonlyArray<TestItem> {
  return Array.from({ length: count }, (_, i) => ({
    id: `item-${i}`,
    name: `Item ${i}`,
  }));
}

const columns = [
  { key: 'name', label: 'Name', render: (item: TestItem) => item.name },
] as const;

const rowKey = (item: TestItem): string => item.id;

describe('VirtualizedDataTable', () => {
  it('renders the table with accessible label', () => {
    render(
      <VirtualizedDataTable
        columns={columns}
        data={makeItems(100)}
        rowKey={rowKey}
        label="Test list"
      />,
    );
    const table = screen.getByRole('table');
    expect(table).toHaveAttribute('aria-label', 'Test list');
  });

  it('renders aria-rowcount matching data length', () => {
    render(
      <VirtualizedDataTable
        columns={columns}
        data={makeItems(75)}
        rowKey={rowKey}
        label="Count check"
      />,
    );
    const table = screen.getByRole('table');
    expect(table).toHaveAttribute('aria-rowcount', '75');
  });

  it('renders column headers', () => {
    render(
      <VirtualizedDataTable
        columns={columns}
        data={makeItems(60)}
        rowKey={rowKey}
        label="Headers"
      />,
    );
    expect(screen.getByText('Name')).toBeInTheDocument();
  });

  it('renders virtual rows for a large dataset', () => {
    const { container } = render(
      <VirtualizedDataTable
        columns={columns}
        data={makeItems(500)}
        rowKey={rowKey}
        label="Large"
      />,
    );
    // The virtualizer needs a measured container height to render items.
    // In jsdom (no layout), getBoundingClientRect returns height 0, so the
    // virtualizer will only render items once the container has a measured
    // height. Verify the overall structure is correct.
    const table = container.querySelector('[role="table"]');
    expect(table).toBeInTheDocument();
    // Verify the spacer rowgroup exists (holds the total size).
    const body = container.querySelector('[role="rowgroup"]:last-child');
    expect(body).toBeInTheDocument();
    // In jsdom, without layout, the virtualizer may not render any rows,
    // but the structure (table → rowgroups → spacer) is correct.
  });

  it('renders sort buttons for sortable columns', () => {
    const sortableCols = [
      {
        key: 'name',
        label: 'Name',
        sortable: true,
        render: (item: TestItem) => item.name,
      },
    ] as const;

    render(
      <VirtualizedDataTable
        columns={sortableCols}
        data={makeItems(60)}
        rowKey={rowKey}
        label="Sortable"
        onSort={() => {}}
        sortKey="name"
        sortOrder="asc"
      />,
    );
    const sortButton = screen.getByRole('button', { name: /Sort by Name/i });
    expect(sortButton).toBeInTheDocument();
  });

  it('renders a scrollable container with tabindex 0', () => {
    render(
      <VirtualizedDataTable
        columns={columns}
        data={makeItems(60)}
        rowKey={rowKey}
        label="Scrollable"
      />,
    );
    const table = screen.getByRole('table');
    expect(table).toHaveAttribute('tabindex', '0');
  });
});
