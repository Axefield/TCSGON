/**
 * Pagination component tests.
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { Pagination } from './Pagination';

describe('Pagination', () => {
  it('renders null when totalPages <= 1', () => {
    const { container } = render(
      <Pagination currentPage={1} totalPages={1} onPageChange={() => {}} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders navigation with aria-label', () => {
    render(
      <Pagination currentPage={1} totalPages={5} onPageChange={() => {}} />,
    );
    expect(screen.getByRole('navigation', { name: 'Pagination' })).toBeInTheDocument();
  });

  it('disables prev button on first page', () => {
    render(
      <Pagination currentPage={1} totalPages={5} onPageChange={() => {}} />,
    );
    expect(screen.getByLabelText('Previous page')).toBeDisabled();
    expect(screen.getByLabelText('Next page')).not.toBeDisabled();
  });

  it('disables next button on last page', () => {
    render(
      <Pagination currentPage={5} totalPages={5} onPageChange={() => {}} />,
    );
    expect(screen.getByLabelText('Next page')).toBeDisabled();
    expect(screen.getByLabelText('Previous page')).not.toBeDisabled();
  });

  it('marks current page with aria-current="page"', () => {
    render(
      <Pagination currentPage={3} totalPages={5} onPageChange={() => {}} />,
    );
    const current = screen.getByRole('button', { current: 'page' });
    expect(current).toHaveTextContent('3');
  });

  it('calls onPageChange with correct page number', async () => {
    const onPageChange = vi.fn();
    render(
      <Pagination currentPage={3} totalPages={5} onPageChange={onPageChange} />,
    );
    await userEvent.click(screen.getByLabelText('Page 5'));
    expect(onPageChange).toHaveBeenCalledWith(5);
  });

  it('calls onPageChange on prev and next buttons', async () => {
    const onPageChange = vi.fn();
    render(
      <Pagination currentPage={3} totalPages={5} onPageChange={onPageChange} />,
    );
    await userEvent.click(screen.getByLabelText('Previous page'));
    expect(onPageChange).toHaveBeenCalledWith(2);
    await userEvent.click(screen.getByLabelText('Next page'));
    expect(onPageChange).toHaveBeenCalledWith(4);
  });

  it('shows ellipsis for many pages', () => {
    render(
      <Pagination currentPage={5} totalPages={20} onPageChange={() => {}} />,
    );
    // Should have buttons: 1, ..., 4, 5, 6, ..., 20
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeLessThan(20); // not all pages rendered
  });

  it('accepts custom aria-label', () => {
    render(
      <Pagination
        currentPage={1}
        totalPages={3}
        onPageChange={() => {}}
        label="Project pages"
      />,
    );
    expect(
      screen.getByRole('navigation', { name: 'Project pages' }),
    ).toBeInTheDocument();
  });
});
