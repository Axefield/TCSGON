/**
 * axe-core a11y audit — DashboardPage
 *
 * Provides mocked API data so the populated dashboard (StatGrid metrics +
 * RecentActivityList) is audited, not just the loading skeleton or error state.
 *
 * @phase Phase 6 — Testing & A11y Hardening
 */

import { screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { buildFetchResponse } from '@/shared/test/mockFetch';
import { testA11y, renderWithProviders } from '@/test-utils';

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

describe('DashboardPage a11y', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('default dashboard has no a11y violations', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      buildFetchResponse(MOCK_STATS),
    );

    const { container } = renderWithProviders(<DashboardPage />);

    // Wait for the populated dashboard to render before auditing
    expect(await screen.findByText('Total Projects')).toBeInTheDocument();
    expect(screen.getByText('42')).toBeInTheDocument();

    await testA11y(container);
  });
});
