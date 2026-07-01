/**
 * Tests for useDashboardStats query hook.
 *
 * Uses mockFetch utility instead of MSW because MSW's setupServer does not
 * intercept native `fetch` on Node.js 24 in the jsdom environment.
 * Phase 1's client.test.ts also uses vi.spyOn(globalThis, 'fetch') directly.
 *
 * @see docs/plans/phase-2-data-and-features.md §6.2
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { type ReactNode } from 'react';

import { ApiClientProvider } from '@/shared/api/ApiClientContext';
import { createApiClient } from '@/shared/api/client';
import { mockFetchResponse, mockFetchError } from '@/shared/test/mockFetch';

import { useDashboardStats } from './dashboardApi';

const testApiClient = createApiClient({ baseUrl: '/api' });

function createWrapper(): React.JSXElementConstructor<{ readonly children: ReactNode }> {
  const testQueryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return function Wrapper({ children }: { readonly children: ReactNode }) {
    return (
      <ApiClientProvider client={testApiClient}>
        <QueryClientProvider client={testQueryClient}>{children}</QueryClientProvider>
      </ApiClientProvider>
    );
  };
}

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
    {
      id: 'act-002',
      type: 'status_changed',
      message: 'Q4 Roadmap moved to active',
      createdAt: new Date(Date.now() - 86_400_000).toISOString(),
      projectId: 'proj-002',
    },
    {
      id: 'act-003',
      type: 'project_updated',
      message: 'API Gateway docs updated',
      createdAt: new Date(Date.now() - 172_800_000).toISOString(),
      projectId: 'proj-003',
    },
  ],
};

describe('useDashboardStats', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns loading state initially', () => {
    mockFetchResponse(MOCK_STATS);

    const { result } = renderHook(() => useDashboardStats(), { wrapper: createWrapper() });

    expect(result.current.isLoading).toBe(true);
    expect(result.current.stats).toBeUndefined();
    expect(result.current.isError).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('returns stats on success', async () => {
    mockFetchResponse(MOCK_STATS);

    const { result } = renderHook(() => useDashboardStats(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.isError).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.stats).toBeDefined();
    expect(result.current.stats?.totalProjects).toBe(42);
    expect(result.current.stats?.activeProjects).toBe(18);
    expect(result.current.stats?.teamMembers).toBe(12);
    expect(result.current.stats?.completionRate).toBe(73.5);
    expect(result.current.stats?.recentActivity).toHaveLength(3);
  });

  it('returns error state on server failure', async () => {
    mockFetchError(500);

    const { result } = renderHook(() => useDashboardStats(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.isError).toBe(true);
    expect(result.current.error).not.toBeNull();
    expect(result.current.stats).toBeUndefined();
  });

  it('refetches when refetch is called', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    fetchSpy.mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: () => Promise.resolve({
        totalProjects: 42,
        activeProjects: 18,
        teamMembers: 12,
        completionRate: 73.5,
        recentActivity: [],
      }),
      text: () => Promise.resolve(''),
    } as Response);

    const { result } = renderHook(() => useDashboardStats(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(fetchSpy).toHaveBeenCalledTimes(1);

    await result.current.refetch();
    // Wait for the refetch to settle
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });

  it('handles validation error when server returns malformed data', async () => {
    mockFetchResponse({
      totalProjects: 'not-a-number',
      activeProjects: 18,
      teamMembers: 12,
      completionRate: 73.5,
      recentActivity: [],
    });

    const { result } = renderHook(() => useDashboardStats(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.isError).toBe(true);
    expect(result.current.error?.detail.kind).toBe('validation');
  });
});
