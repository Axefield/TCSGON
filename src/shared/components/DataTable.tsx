/**
 * DataTable — accessible sortable table with sticky header, loading skeleton,
 * empty state, and keyboard navigation.
 *
 * @example
 *   <DataTable
 *     columns={[
 *       { key: 'name', label: 'Name', sortable: true, render: (p) => p.name },
 *       { key: 'status', label: 'Status', render: (p) => p.status },
 *     ]}
 *     data={projects}
 *     sortKey="name"
 *     sortOrder="asc"
 *     onSort={(key, order) => setSort(key, order)}
 *     isLoading={isLoading}
 *     emptyState={<EmptyState heading="No projects" />}
 *     onRowClick={(p) => navigate(p.id)}
 *     rowKey={(p) => p.id}
 *     label="Projects list"
 *   />
 */
import {
  type ReactElement,
  type ReactNode,
  useCallback,
} from 'react';

import styles from './DataTable.module.css';

export interface DataTableColumn<T> {
  readonly key: string;
  readonly label: string;
  readonly sortable?: boolean;
  readonly render: (item: T) => ReactNode;
  readonly align?: 'left' | 'right' | 'center';
  readonly width?: string;
}

export interface DataTableProps<T> {
  readonly columns: ReadonlyArray<DataTableColumn<T>>;
  readonly data: ReadonlyArray<T>;
  readonly sortKey?: string;
  readonly sortOrder?: 'asc' | 'desc';
  readonly onSort?: (key: string, order: 'asc' | 'desc') => void;
  readonly isLoading?: boolean;
  readonly emptyState?: ReactNode;
  readonly onRowClick?: (item: T) => void;
  readonly rowKey: (item: T) => string;
  readonly label: string;
}

const LOADING_ROW_COUNT = 5;
const SKELETON_COL_WIDTH = 100;

function SkeletonRow({ columns }: { columns: number }): ReactElement {
  return (
    <tr className={styles.skeletonRow} aria-hidden="true">
      {Array.from({ length: columns }, (_, i) => (
        <td key={i} className={styles.cell}>
          <span
            className={styles.skeleton}
            style={{
              width: `${SKELETON_COL_WIDTH + Math.floor(Math.random() * 80)}px`,
              height: '1rem',
            }}
          />
        </td>
      ))}
    </tr>
  );
}

function SortIcon({ direction }: { direction?: 'asc' | 'desc' }): ReactElement {
  return (
    <span className={styles.sortIcon} aria-hidden="true">
      {direction === 'asc' ? ' ▲' : direction === 'desc' ? ' ▼' : ' ⇅'}
    </span>
  );
}

export function DataTable<T>({
  columns,
  data,
  sortKey,
  sortOrder,
  onSort,
  isLoading = false,
  emptyState,
  onRowClick,
  rowKey,
  label,
}: DataTableProps<T>): ReactElement {
  const hasData = data.length > 0;
  const showBody = !isLoading && hasData;
  const showEmpty = !isLoading && !hasData;
  const showSkeleton = isLoading;

  const handleSort = useCallback(
    (key: string): void => {
      if (!onSort) return;
      const newOrder = sortKey === key && sortOrder === 'asc' ? 'desc' : 'asc';
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
    <div className={styles.wrapper}>
      <table className={styles.table} aria-label={label}>
        <thead className={styles.header}>
          <tr>
            {columns.map((col) => {
              const isSorted = sortKey === col.key;
              const ariaSort = isSorted
                ? (sortOrder === 'asc' ? 'ascending' : 'descending')
                : 'none';

              return (
                <th
                  key={col.key}
                  className={`${styles.headerCell} ${col.align ? styles[col.align] : ''}`}
                  scope="col"
                  aria-sort={col.sortable ? ariaSort : undefined}
                  style={{ width: col.width }}
                >
                  {col.sortable ? (
                    <button
                      className={styles.sortButton}
                      type="button"
                      onClick={() => handleSort(col.key)}
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
                </th>
              );
            })}
          </tr>
        </thead>

        <tbody>
          {showSkeleton
            ? Array.from({ length: LOADING_ROW_COUNT }, (_, i) => (
                <SkeletonRow key={`skel-${i}`} columns={columns.length} />
              ))
            : null}

          {showBody
            ? data.map((item) => {
                const key = rowKey(item);

                return (
                  <tr
                    key={key}
                    className={`${styles.row} ${onRowClick ? styles.clickable : ''}`}
                    onClick={onRowClick ? handleRowClick(item) : undefined}
                    onKeyDown={onRowClick ? handleRowKeyDown(item) : undefined}
                    tabIndex={onRowClick ? 0 : undefined}
                    role={onRowClick ? 'button' : undefined}
                    aria-label={onRowClick ? `View ${label} ${key}` : undefined}
                  >
                    {columns.map((col) => (
                      <td
                        key={col.key}
                        className={`${styles.cell} ${col.align ? styles[col.align] : ''}`}
                      >
                        {col.render(item)}
                      </td>
                    ))}
                  </tr>
                );
              })
            : null}
        </tbody>
      </table>

      {showEmpty && emptyState
        ? <div className={styles.emptyWrapper}>{emptyState}</div>
        : null}
    </div>
  );
}
