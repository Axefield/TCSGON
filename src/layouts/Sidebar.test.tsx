/**
 * Sidebar component tests.
 *
 * @see docs/plans/phase-1-core-infrastructure.md §10, §34, §35
 */
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { Sidebar } from './Sidebar';

describe('Sidebar', () => {
  const baseProps = {
    state: 'closed' as const,
    onToggle: vi.fn(),
    onPin: vi.fn(),
    children: <nav aria-label="Main">Content</nav>,
  };

  it('renders as aside with aria-label', () => {
    render(<Sidebar {...baseProps} />);
    const aside = screen.getByRole('complementary', { name: /primary navigation/i });
    expect(aside).toBeInTheDocument();
  });

  it('shows collapsed toggle button when closed', () => {
    render(<Sidebar {...baseProps} state="closed" />);
    const btn = screen.getByRole('button', { name: /expand sidebar/i });
    expect(btn).toBeInTheDocument();
    expect(btn).toHaveAttribute('aria-expanded', 'false');
  });

  it('shows expanded toggle button when open', () => {
    render(<Sidebar {...baseProps} state="open" />);
    const btn = screen.getByRole('button', { name: /collapse sidebar/i });
    expect(btn).toBeInTheDocument();
    expect(btn).toHaveAttribute('aria-expanded', 'true');
  });

  it('shows expanded toggle button when pinned', () => {
    render(<Sidebar {...baseProps} state="pinned" />);
    const btn = screen.getByRole('button', { name: /collapse sidebar/i });
    expect(btn).toBeInTheDocument();
    expect(btn).toHaveAttribute('aria-expanded', 'true');
  });

  it('calls onToggle when toggle button is clicked', () => {
    const onToggle = vi.fn();
    render(<Sidebar {...baseProps} state="open" onToggle={onToggle} />);
    fireEvent.click(screen.getByRole('button', { name: /collapse sidebar/i }));
    expect(onToggle).toHaveBeenCalledOnce();
  });

  it('renders children in nav', () => {
    render(
      <Sidebar {...baseProps}>
        <a href="/test">Test Link</a>
      </Sidebar>,
    );
    expect(screen.getByRole('link', { name: /test link/i })).toBeInTheDocument();
  });
});
