/**
 * RouteErrorElement tests.
 *
 * @see docs/plans/phase-1-core-infrastructure.md §51, §57
 *
 * NOTE: We mock `useRouteError` rather than rendering through a data router
 * because `createMemoryRouter` creates `Request` objects internally that
 * trigger an AbortSignal incompatibility between jsdom and Node.js undici.
 * See vitest setup notes in docs/plans/phase-1-core-infrastructure.md.
 */
import { render, screen } from '@testing-library/react';
import { useRouteError } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { RouteErrorElement } from './RouteErrorElement';

// Mock useRouteError to return test errors without a data router.
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return {
    ...actual,
    useRouteError: vi.fn(),
  };
});

describe('RouteErrorElement', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders error message via useRouteError', () => {
    vi.mocked(useRouteError).mockReturnValue(new Error('Loader error!'));

    render(<RouteErrorElement />);

    expect(screen.getByRole('heading', { name: /page error/i })).toBeInTheDocument();
    expect(screen.getByText('Loader error!')).toBeInTheDocument();
  });

  it('renders a link to go home', () => {
    vi.mocked(useRouteError).mockReturnValue(new Error('Oops'));

    render(<RouteErrorElement />);

    const homeLink = screen.getByRole('link', { name: /go to home/i });
    expect(homeLink).toBeInTheDocument();
    expect(homeLink).toHaveAttribute('href', '/');
  });
});
