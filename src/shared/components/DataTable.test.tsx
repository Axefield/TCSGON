/**
 * DataTable component tests.
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { DataTable, type DataTableColumn } from './DataTable';
import { EmptyState } from './EmptyState';

interface TestItem {
  readonly id: string;
  readonly name: string;
  readonly status: string;
}

const columns: ReadonlyArray<DataTableColumn<TestItem>> = [
  { key: 'name', label: 'Name', sortable: true, render: (i) => i.name },
  { key: 'status', label: 'Status', render: (i) => i.status },
];

const data: ReadonlyArray<TestItem> = [
  { id: '1', name: 'Alpha', status: 'active' },
  { id: '2', name: 'Beta', status: 'paused' },
  { id: '3', name: 'Gamma', status: 'completed' },
];

describe('DataTable', () => {
  it('renders table with aria-label', () => {
    render(
      <DataTable
        columns={columns}
        data={data}
        rowKey={(i) => i.id}
        label="Projects"
      />,
    );
    const table = screen.getByRole('table', { name: 'Projects' });
    expect(table).toBeInTheDocument();
  });

  it('renders column headers', () => {
    render(
      <DataTable
        columns={columns}
        data={data}
        rowKey={(i) => i.id}
        label="Projects"
      />,
    );
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
  });

  it('renders data rows', () => {
    render(
      <DataTable
        columns={columns}
        data={data}
        rowKey={(i) => i.id}
        label="Projects"
      />,
    );
    expect(screen.getByText('Alpha')).toBeInTheDocument();
    expect(screen.getByText('Beta')).toBeInTheDocument();
    expect(screen.getByText('Gamma')).toBeInTheDocument();
  });

  it('renders loading skeleton rows when isLoading is true', () => {
    const { container } = render(
      <DataTable
        columns={columns}
        data={[]}
        isLoading={true}
        rowKey={(i) => i.id}
        label="Projects"
      />,
    );
    const hiddenRows = container.querySelectorAll('tr[aria-hidden="true"]');
    expect(hiddenRows.length).toBeGreaterThan(0);
  });

  it('shows emptyState when data is empty and not loading', () => {
    render(
      <DataTable
        columns={columns}
        data={[]}
        rowKey={(i) => i.id}
        label="Projects"
        emptyState={<EmptyState heading="No projects found" />}
      />,
    );
    expect(screen.getByText('No projects found')).toBeInTheDocument();
  });

  it('calls onSort with toggled order', async () => {
    const onSort = vi.fn();
    render(
      <DataTable
        columns={columns}
        data={data}
        sortKey="name"
        sortOrder="asc"
        onSort={onSort}
        rowKey={(i) => i.id}
        label="Projects"
      />,
    );
    await userEvent.click(screen.getByLabelText('Sort by Name'));
    expect(onSort).toHaveBeenCalledWith('name', 'desc');
  });

  it('sets aria-sort on sorted column', () => {
    render(
      <DataTable
        columns={columns}
        data={data}
        sortKey="name"
        sortOrder="asc"
        rowKey={(i) => i.id}
        label="Projects"
      />,
    );
    const header = screen.getByText('Name').closest('th');
    expect(header).toHaveAttribute('aria-sort', 'ascending');
  });

  it('calls onRowClick when row is clicked', async () => {
    const onRowClick = vi.fn();
    render(
      <DataTable
        columns={columns}
        data={data}
        rowKey={(i) => i.id}
        label="Projects"
        onRowClick={onRowClick}
      />,
    );
    await userEvent.click(screen.getByText('Beta'));
    expect(onRowClick).toHaveBeenCalledWith(data[1]);
  });

  it('makes rows focusable with tabindex when onRowClick', () => {
    render(
      <DataTable
        columns={columns}
        data={data}
        rowKey={(i) => i.id}
        label="Projects"
        onRowClick={() => {}}
      />,
    );
    const row = screen.getByText('Alpha').closest('tr');
    expect(row).toHaveAttribute('tabindex', '0');
    expect(row).toHaveAttribute('role', 'button');
  });
});
