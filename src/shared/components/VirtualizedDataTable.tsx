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
 * Accessibility (WCAG 2.2 AA):
 *  - The scrollable container is `tabindex="0"` with `role="grid"` and
 *    `aria-activedescendant` for roving-tabindex navigation.
 *  - Arrow keys (Up/Down/Home/End) move the active row; Enter/Space
 *    activates the row when `onRowClick` is provided.
 *  - The grid element carries `aria-rowcount`.
 *  - Each visible row has `aria-rowindex` and `aria-selected` for AT context.
 *  - A visible `:focus-visible` outline is applied to the grid container
 *    for keyboard users.
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
import { useVirtualizer } from '@tanstack/react-virtual';
import {
  type ReactElement,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';

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
  const [activeIndex, setActiveIndex] = useState(0);

  // Clamp activeIndex when data shrinks (e.g. filtering).
  useEffect(() => {
    setActiveIndex((prev) => Math.min(prev, Math.max(0, data.length - 1)));
  }, [data.length]);

  const activeDescendantId = `virtual-grid-${label.replace(/\s+/g, '-')}-row-${String(activeIndex)}`;

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

  /** Navigate the active row index with arrow keys. */
  const moveActiveIndex = (delta: number): void => {
    setActiveIndex((prev) => {
      const next = Math.min(Math.max(prev + delta, 0), data.length - 1);
      virtualizer.scrollToIndex(next, { align: 'auto' });
      return next;
    });
  };

  /** Handle keyboard events on the grid container (roving tabindex). */
  const handleGridKeyDown = (
    e: React.KeyboardEvent<HTMLDivElement>,
  ): void => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        moveActiveIndex(1);
        break;
      case 'ArrowUp':
        e.preventDefault();
        moveActiveIndex(-1);
        break;
      case 'Home':
        e.preventDefault();
        setActiveIndex(0);
        virtualizer.scrollToIndex(0, { align: 'start' });
        break;
      case 'End':
        e.preventDefault();
        setActiveIndex(data.length - 1);
        virtualizer.scrollToIndex(data.length - 1, { align: 'end' });
        break;
      case 'Enter':
      case ' ':
        if (onRowClick) {
          e.preventDefault();
          const item = data[activeIndex];
          if (item) onRowClick(item);
        }
        break;
    }
  };

  return (
    <div className={tableStyles.wrapper}>
      <div
        ref={scrollRef}
        role="grid"
        aria-label={label}
        aria-rowcount={data.length}
        aria-activedescendant={activeDescendantId}
        tabIndex={0}
        onKeyDown={onRowClick ? handleGridKeyDown : undefined}
        className={tableStyles.gridContainer}
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
              const rowId = `virtual-grid-${label.replace(/\s+/g, '-')}-row-${String(virtualRow.index)}`;

              return (
                <div
                  key={key}
                  id={rowId}
                  role="row"
                  aria-rowindex={virtualRow.index + 1}
                  aria-selected={virtualRow.index === activeIndex}
                  tabIndex={onRowClick ? -1 : undefined}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    display: 'flex',
                    transform: `translateY(${String(virtualRow.start)}px)`,
                    borderBottom: '1px solid var(--color-border, #e2e8f0)',
                    cursor: onRowClick ? 'pointer' : undefined,
                    background:
                      virtualRow.index === activeIndex
                        ? 'var(--color-bg-active, #f1f5f9)'
                        : undefined,
                  }}
                  onClick={
                    onRowClick
                      ? () => {
                          onRowClick(item);
                        }
                      : undefined
                  }
                  onKeyDown={
                    onRowClick
                      ? (e: React.KeyboardEvent<HTMLDivElement>) => {
                          if (
                            e.key === 'Enter' ||
                            e.key === ' '
                          ) {
                            e.preventDefault();
                            onRowClick(item);
                          }
                        }
                      : undefined
                  }
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
