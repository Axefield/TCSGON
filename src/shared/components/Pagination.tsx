/**
 * Pagination — accessible page navigation with `aria-current="page"`.
 *
 * States: single page (hidden), multi-page (visible), first/last page (prev/next disabled).
 *
 * @example
 *   <Pagination
 *     currentPage={1}
 *     totalPages={10}
 *     onPageChange={(p) => setPage(p)}
 *   />
 */
import type { ReactElement } from 'react';

import { Button } from './Button';
import styles from './Pagination.module.css';

export interface PaginationProps {
  readonly currentPage: number;
  readonly totalPages: number;
  readonly onPageChange: (page: number) => void;
  readonly label?: string;
}

/** Number of page buttons to show around current page (excluding ellipsis). */
const SIBLING_COUNT = 1;

function range(start: number, end: number): number[] {
  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
}

/**
 * Compute visible page numbers.
 * Always shows first, last, current, and siblings around current.
 * Ellipsis represented as `null`.
 */
function getPageNumbers(
  current: number,
  total: number,
): (number | null)[] {
  if (total <= 7) {
    return range(1, total);
  }

  const pages: (number | null)[] = [];
  const leftEnd = Math.max(2, current - SIBLING_COUNT);
  const rightStart = Math.min(total - 1, current + SIBLING_COUNT);

  pages.push(1);

  if (leftEnd > 2) {
    pages.push(null);
  }

  for (let i = leftEnd; i <= rightStart; i += 1) {
    pages.push(i);
  }

  if (rightStart < total - 1) {
    pages.push(null);
  }

  pages.push(total);

  return pages;
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  label = 'Pagination',
}: PaginationProps): ReactElement | null {
  if (totalPages <= 1) return null;

  const pages = getPageNumbers(currentPage, totalPages);
  const isFirst = currentPage <= 1;
  const isLast = currentPage >= totalPages;

  return (
    <nav className={styles.nav} aria-label={label}>
      <ul className={styles.list}>
        {/* Previous */}
        <li className={styles.item}>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={isFirst}
            aria-label="Previous page"
          >
            ‹ Prev
          </Button>
        </li>

        {/* Page numbers */}
        {pages.map((page, idx) =>
          page === null ? (
            <li key={`ellipsis-${idx}`} className={styles.item}>
              <span className={styles.ellipsis} aria-hidden="true">
                …
              </span>
            </li>
          ) : (
            <li key={page} className={styles.item}>
              <Button
                variant={page === currentPage ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => onPageChange(page)}
                aria-current={page === currentPage ? 'page' : undefined}
                aria-label={`Page ${String(page)}`}
              >
                {page}
              </Button>
            </li>
          ),
        )}

        {/* Next */}
        <li className={styles.item}>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={isLast}
            aria-label="Next page"
          >
            Next ›
          </Button>
        </li>
      </ul>
    </nav>
  );
}
