import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { type ReactNode } from 'react';
import { vi } from 'vitest';

import { ApiClientProvider } from '@/shared/api/ApiClientContext';
import { createApiClient } from '@/shared/api/client';
import { buildFetchResponse } from '@/shared/test/mockFetch';
import { asProjectId } from '@/shared/types/brand';

import { useCreateProject, useDeleteProject, useProject, useProjects, useUpdateProject } from './projectsApi';

const testApiClient = createApiClient({ baseUrl: '/api' });

function createWrapper(): React.JSXElementConstructor<{ readonly children: ReactNode }> {
  const testQueryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

  return function Wrapper({ children }: { readonly children: ReactNode }) {
    return (
      <ApiClientProvider client={testApiClient}>
        <QueryClientProvider client={testQueryClient}>{children}</QueryClientProvider>
      </ApiClientProvider>
    );
  };
}

describe('projectsApi', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('loads a paginated projects list', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      buildFetchResponse({
        items: [
          {
            id: 'proj-005',
            name: 'Security Audit Q3',
            description: 'Third-party security audit for all production services.',
            status: 'active',
            leadName: 'Eve Johnson',
            memberCount: 4,
            createdAt: new Date('2026-06-01T07:00:00Z').toISOString(),
            updatedAt: new Date('2026-06-29T08:30:00Z').toISOString(),
          },
        ],
        total: 5,
        page: 1,
        pageSize: 3,
        totalPages: 2,
      }),
    );

    const { result } = renderHook(
      () => useProjects({ page: 1, pageSize: 3, sort: 'updatedAt', order: 'desc' }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.data?.items).toHaveLength(1);
    expect(result.current.data?.total).toBeGreaterThanOrEqual(5);
  });

  it('loads a single project', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      buildFetchResponse({
        id: 'proj-001',
        name: 'Mobile App Redesign',
        description: 'Redesign the mobile application for better UX and performance.',
        status: 'active',
        leadName: 'Alice Chen',
        memberCount: 5,
        createdAt: new Date('2026-01-15T08:00:00Z').toISOString(),
        updatedAt: new Date('2026-06-28T14:30:00Z').toISOString(),
      }),
    );

    const { result } = renderHook(() => useProject(asProjectId('proj-001')), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.project?.name).toBe('Mobile App Redesign');
  });

  it('creates, updates, and deletes a project', async () => {
    vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(
        buildFetchResponse({
          id: 'proj-999',
          name: 'Migration command center',
          description: 'Track migration status.',
          status: 'active',
          leadName: 'Sam Rivera',
          memberCount: 0,
          createdAt: new Date('2026-06-30T12:00:00Z').toISOString(),
          updatedAt: new Date('2026-06-30T12:00:00Z').toISOString(),
        }, { status: 201 }),
      )
      .mockResolvedValueOnce(
        buildFetchResponse({
          id: 'proj-999',
          name: 'Migration command center',
          description: 'Track migration status daily.',
          status: 'paused',
          leadName: 'Sam Rivera',
          memberCount: 0,
          createdAt: new Date('2026-06-30T12:00:00Z').toISOString(),
          updatedAt: new Date('2026-06-30T13:00:00Z').toISOString(),
        }),
      )
      .mockResolvedValueOnce(buildFetchResponse(null, { status: 204 }));

    const create = renderHook(() => useCreateProject(), { wrapper: createWrapper() });

    create.result.current.mutate({
      name: 'Migration command center',
      leadName: 'Sam Rivera',
      description: 'Track migration status.',
      status: 'active',
    });

    await waitFor(() => expect(create.result.current.isSuccess).toBe(true));
    const createdId = create.result.current.data?.id;
    expect(createdId).toBeDefined();

    const update = renderHook(() => useUpdateProject(), { wrapper: createWrapper() });
    update.result.current.mutate({
      id: createdId!,
      input: {
        name: 'Migration command center',
        leadName: 'Sam Rivera',
        description: 'Track migration status daily.',
        status: 'paused',
      },
    });

    await waitFor(() => expect(update.result.current.isSuccess).toBe(true));
    expect(update.result.current.data?.status).toBe('paused');

    const remove = renderHook(() => useDeleteProject(), { wrapper: createWrapper() });
    remove.result.current.mutate(createdId!);
    await waitFor(() => expect(remove.result.current.isSuccess).toBe(true));
  });
});
