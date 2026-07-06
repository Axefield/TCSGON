/**
 * axe-core a11y audit — Pagination
 *
 * Pagination renders `<nav aria-label="Pagination">` with page buttons
 * (`aria-current="page"` for the active page), prev/next with `aria-label`,
 * and ellipsis indicators. Returns null when totalPages <= 1.
 */
import { render } from '@testing-library/react';

import { testA11y } from '@/test-utils';

import { Pagination } from './Pagination';

describe('Pagination a11y', () => {
  it('first page of many has no violations', async () => {
    const { container } = render(
      <Pagination currentPage={1} totalPages={10} onPageChange={() => {}} />,
    );
    await testA11y(container);
  });

  it('middle page has no violations', async () => {
    const { container } = render(
      <Pagination currentPage={5} totalPages={10} onPageChange={() => {}} />,
    );
    await testA11y(container);
  });

  it('last page has no violations', async () => {
    const { container } = render(
      <Pagination currentPage={10} totalPages={10} onPageChange={() => {}} />,
    );
    await testA11y(container);
  });

  it('few pages (no ellipsis) has no violations', async () => {
    const { container } = render(
      <Pagination currentPage={3} totalPages={5} onPageChange={() => {}} />,
    );
    await testA11y(container);
  });

  it('custom aria label has no violations', async () => {
    const { container } = render(
      <Pagination
        currentPage={1}
        totalPages={8}
        onPageChange={() => {}}
        label="Search results pagination"
      />,
    );
    await testA11y(container);
  });

  it('large page count with ellipsis has no violations', async () => {
    const { container } = render(
      <Pagination currentPage={50} totalPages={100} onPageChange={() => {}} />,
    );
    await testA11y(container);
  });
});
