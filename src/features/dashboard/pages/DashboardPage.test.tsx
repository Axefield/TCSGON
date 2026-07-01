/**
 * Integration tests for DashboardPage.
 *
 * Uses mockFetch utility instead of MSW because MSW's setupServer does not
 * intercept native `fetch` on Node.js 24 in the jsdom environment.
 */
import { waitFor } from '@testing-library/react';
import { vi } from 'vitest';

import { buildFetchResponse } from '@/shared/test/mockFetch';
import { renderWithProviders, screen } from '@/test-utils';

import { DashboardPage } from './DashboardPage';

const MOCK_STATS = {
  totalProjects: 42,
  activeProjects: 18,
  teamMembers: 12,
  completionRate: 73.5,
  recentActivity: [
    {
      id: 'act-001',
      type: 'project_created',
      message: 'Mobile App Redesign project created',
      createdAt: new Date(Date.now() - 3_600_000).toISOString(),
      projectId: 'proj-001',
    },
  ],
};

describe('DashboardPage', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('shows loading skeleton initially', () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(buildFetchResponse(MOCK_STATS));

    renderWithProviders(<DashboardPage />);

    expect(screen.getByRole('status', { name: 'Dashboard is loading' })).toBeInTheDocument();
  });

  it('renders stat cards and activity list on success', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(buildFetchResponse(MOCK_STATS));

    renderWithProviders(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
    });

    // Stat cards
    expect(screen.getByText('Total Projects')).toBeInTheDocument();
    expect(screen.getByText('42')).toBeInTheDocument();
    expect(screen.getByText('Active Projects')).toBeInTheDocument();
    expect(screen.getByText('18')).toBeInTheDocument();
    expect(screen.getByText('Team Members')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();
    expect(screen.getByText('Completion Rate')).toBeInTheDocument();
    expect(screen.getByText('74%')).toBeInTheDocument();

    // Activity
    expect(screen.getByText('Mobile App Redesign project created')).toBeInTheDocument();
  });

  it('renders error state on failure', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      buildFetchResponse(null, { status: 500 }),
    );

    renderWithProviders(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
  });

  it('refetches data when retry button is clicked', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    fetchSpy
      .mockResolvedValueOnce(buildFetchResponse(null, { status: 500 }))
      .mockResolvedValueOnce(buildFetchResponse(MOCK_STATS));

    renderWithProviders(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
    });

    // Click retry
    screen.getByRole('button', { name: /retry/i }).click();

    await waitFor(() => {
      expect(screen.getByText('Total Projects')).toBeInTheDocument();
    });

    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });
});
