/**
 * VirtualizedDataTable — performant table body for large datasets.
 *
 * Uses `@tanstack/react-virtual` to render only the visible rows,
 * keeping the DOM lean even for datasets of hundreds or thousands
 * of items. The threshold is 50 rows — below that, use the standard
 * DataTable; above it, this component provides the same visual
 * appearance and interaction model (sort headers, row clicks, keyboard
 * accessibility) with virtualized scrolling.
 *
 * Accessibility:
 *  - The scrollable container is `tabindex="0"` so keyboard users can
 *    scroll with arrow keys.
 *  - The table element carries `role="table"` and `aria-rowcount`.
 *  - Each visible row has `aria-rowindex` for AT context.
 *  - Sort buttons retain their existing ARIA attributes.
 *
 * @example
 *   <VirtualizedDataTable
 *     columns={columns}
 *     data={largeArray}
 *     rowKey={(p) => p.id}
 *     label="Large project list"
 *   />
 */
import {
  type ReactElement,
  useCallback,
  useRef,
} from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';

import type { DataTableColumn } from '@/shared/components/DataTable';

import tableStyles from './DataTable.module.css';

/** Default row height estimate in pixels. */
const ROW_HEIGHT = 48;
/** Number of extra rows rendered above/below the visible window. */
const OVERSCAN = 10;

export interface VirtualizedDataTableProps<T> {
  readonly columns: ReadonlyArray<DataTableColumn<T>>;
  readonly data: ReadonlyArray<T>;
  readonly rowKey: (item: T) => string;
  readonly onRowClick?: ((item: T) => void) | undefined;
  readonly label: string;
  readonly onSort?: ((key: string, order: 'asc' | 'desc') => void) | undefined;
  readonly sortKey?: string | undefined;
  readonly sortOrder?: 'asc' | 'desc' | undefined;
}

/**
 * Render sort indicator for columns that are sortable.
 */
function SortIcon({
  direction,
}: {
  direction?: 'asc' | 'desc' | undefined;
}): ReactElement {
  return (
    <span className={tableStyles.sortIcon} aria-hidden="true">
      {direction === 'asc' ? ' ▲' : direction === 'desc' ? ' ▼' : ' ⇅'}
    </span>
  );
}

/**
 * Virtualized table body + sticky header for large datasets.
 */
export function VirtualizedDataTable<T>({
  columns,
  data,
  rowKey,
  onRowClick,
  label,
  onSort,
  sortKey,
  sortOrder,
}: VirtualizedDataTableProps<T>): ReactElement {
  const scrollRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: data.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: OVERSCAN,
  });

  const virtualItems = virtualizer.getVirtualItems();
  const totalSize = virtualizer.getTotalSize();

  const handleSort = useCallback(
    (key: string): void => {
      if (!onSort) return;
      const newOrder =
        sortKey === key && sortOrder === 'asc' ? 'desc' : 'asc';
      onSort(key, newOrder);
    },
    [onSort, sortKey, sortOrder],
  );

  const handleRowClick = useCallback(
    (item: T) => () => onRowClick?.(item),
    [onRowClick],
  );

  const handleRowKeyDown = useCallback(
    (item: T) =>
      (e: React.KeyboardEvent<HTMLTableRowElement>): void => {
        if (!onRowClick) return;
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onRowClick(item);
        }
      },
    [onRowClick],
  );

  return (
    <div className={tableStyles.wrapper}>
      <div
        ref={scrollRef}
        role="table"
        aria-label={label}
        aria-rowcount={data.length}
        tabIndex={0}
        style={{
          overflow: 'auto',
          maxHeight: '70vh',
        }}
      >
        {/* Sticky header rendered outside the virtual scroll area */}
        <div
          role="rowgroup"
          style={{
            position: 'sticky',
            top: 0,
            zIndex: 1,
            background: 'var(--color-bg-elevated, #f8fafc)',
            borderBottom: '2px solid var(--color-border, #e2e8f0)',
          }}
        >
          <div role="row" style={{ display: 'flex' }}>
            {columns.map((col) => {
              const isSorted = sortKey === col.key;
              const ariaSort = isSorted
                ? (sortOrder === 'asc' ? 'ascending' : 'descending')
                : 'none';

              return (
                <div
                  key={col.key}
                  role="columnheader"
                  aria-sort={col.sortable ? ariaSort : undefined}
                  style={{
                    flex: col.width ? `0 0 ${col.width}` : 1,
                    padding: '0.75rem 1rem',
                    fontWeight: 600,
                    textAlign: col.align ?? 'left',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {col.sortable ? (
                    <button
                      type="button"
                      onClick={() => handleSort(col.key)}
                      className={tableStyles.sortButton}
                      aria-label={`Sort by ${col.label}`}
                    >
                      {col.label}
                      <SortIcon
                        {...(isSorted ? { direction: sortOrder } : {})}
                      />
                    </button>
                  ) : (
                    col.label
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Virtualized body: spacer + visible rows */}
        <div
          role="rowgroup"
          style={{
            height: `${String(totalSize)}px`,
            position: 'relative',
          }}
        >
          {virtualItems.map((virtualRow) => {
            const item = data[virtualRow.index];
            if (item === undefined) return null;
            const key = rowKey(item);

            return (
              <div
                key={key}
                role="row"
                aria-rowindex={virtualRow.index + 1}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  display: 'flex',
                  transform: `translateY(${String(virtualRow.start)}px)`,
                  borderBottom: '1px solid var(--color-border, #e2e8f0)',
                  cursor: onRowClick ? 'pointer' : undefined,
                }}
                onClick={onRowClick ? handleRowClick(item) : undefined}
                onKeyDown={onRowClick ? handleRowKeyDown(item) : undefined}
                tabIndex={onRowClick ? 0 : undefined}
                aria-label={
                  onRowClick ? `View ${label} ${key}` : undefined
                }
              >
                {columns.map((col) => {
                  return (
                    <div
                      key={col.key}
                      role="cell"
                      style={{
                        flex: col.width ? `0 0 ${col.width}` : 1,
                        padding: '0.75rem 1rem',
                        textAlign: col.align ?? 'left',
                      }}
                    >
                      {col.render(item)}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
