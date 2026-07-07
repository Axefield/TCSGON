import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
} from '@tanstack/react-query';
import { z } from 'zod';

import { dashboardKeys } from '@/features/dashboard/api/dashboardApi';
import {
  ProjectInputSchema,
  ProjectSchema,
  type Project,
  type ProjectInput,
  type ProjectListParams,
  type ProjectListResponse,
} from '@/features/projects/types';
import { useApiClient } from '@/shared/api/ApiClientContext';
import { ApiError } from '@/shared/api/errors';
import type { ProjectId } from '@/shared/types/brand';

const ProjectListResponseSchema = z.object({
  items: z.array(ProjectSchema),
  total: z.number().nonnegative(),
  page: z.number().int().positive(),
  pageSize: z.number().int().positive(),
  totalPages: z.number().int().positive(),
});

function toQueryParams(params: ProjectListParams): Readonly<Record<string, string | number | boolean>> {
  return {
    page: params.page,
    pageSize: params.pageSize,
    ...(params.sort ? { sort: params.sort } : {}),
    ...(params.order ? { order: params.order } : {}),
    ...(params.search ? { search: params.search } : {}),
    ...(params.status ? { status: params.status } : {}),
  };
}

export const projectKeys = {
  all: ['projects'] as const,
  lists: () => ['projects', 'list'] as const,
  list: (params: ProjectListParams) => ['projects', 'list', params] as const,
  details: () => ['projects', 'detail'] as const,
  detail: (id: ProjectId) => ['projects', 'detail', id] as const,
};

export interface UseProjectsResult {
  readonly data: ProjectListResponse | undefined;
  readonly isLoading: boolean;
  readonly isError: boolean;
  readonly error: ApiError | null;
  readonly refetch: () => Promise<unknown>;
}

export interface UseProjectResult {
  readonly project: Project | undefined;
  readonly isLoading: boolean;
  readonly isError: boolean;
  readonly error: ApiError | null;
  readonly refetch: () => Promise<unknown>;
}

function normalizeParams(params: ProjectListParams): ProjectListParams {
  return {
    page: Math.max(1, params.page),
    pageSize: Math.max(1, Math.min(100, params.pageSize)),
    ...(params.sort ? { sort: params.sort } : {}),
    ...(params.order ? { order: params.order } : {}),
    ...(params.search ? { search: params.search.trim() } : {}),
    ...(params.status ? { status: params.status } : {}),
  };
}

export function useProjects(params: ProjectListParams): UseProjectsResult {
  const apiClient = useApiClient();
  const normalized = normalizeParams(params);
  const query = useQuery({
    queryKey: projectKeys.list(normalized),
    queryFn: async ({ signal }) => {
      const result = await apiClient.request({
        method: 'GET',
        path: '/api/projects',
        params: toQueryParams(normalized),
        signal,
        schema: ProjectListResponseSchema,
      });

      if (!result.ok) {
        throw result.error;
      }

      return result.data as unknown as ProjectListResponse;
    },
  });

  return {
    data: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error instanceof ApiError ? query.error : null,
    refetch: query.refetch,
  };
}

export function useProject(id: ProjectId): UseProjectResult {
  const apiClient = useApiClient();
  const query = useQuery({
    queryKey: projectKeys.detail(id),
    queryFn: async ({ signal }) => {
      const result = await apiClient.request({
        method: 'GET',
        path: `/api/projects/${id}`,
        signal,
        schema: ProjectSchema,
      });

      if (!result.ok) {
        throw result.error;
      }

      return result.data as unknown as Project;
    },
  });

  return {
    project: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error instanceof ApiError ? query.error : null,
    refetch: query.refetch,
  };
}

export function useCreateProject(): UseMutationResult<Project, ApiError, ProjectInput> {
  const apiClient = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: ProjectInput) => {
      const payload = ProjectInputSchema.parse(input);
      const result = await apiClient.request({
        method: 'POST',
        path: '/api/projects',
        body: payload,
        schema: ProjectSchema,
      });

      if (!result.ok) {
        throw result.error;
      }

      return result.data as unknown as Project;
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: projectKeys.lists() }),
        queryClient.invalidateQueries({ queryKey: dashboardKeys.stats() }),
      ]);
    },
  });
}

export function useUpdateProject(): UseMutationResult<
  Project,
  ApiError,
  { readonly id: ProjectId; readonly input: ProjectInput }
> {
  const apiClient = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, input }) => {
      const payload = ProjectInputSchema.parse(input);
      const result = await apiClient.request({
        method: 'PUT',
        path: `/projects/${id}`,
        body: payload,
        schema: ProjectSchema,
      });

      if (!result.ok) {
        throw result.error;
      }

      return result.data as unknown as Project;
    },
    onSuccess: async (project) => {
      queryClient.setQueryData(projectKeys.detail(project.id), project);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: projectKeys.lists() }),
        queryClient.invalidateQueries({ queryKey: projectKeys.detail(project.id) }),
        queryClient.invalidateQueries({ queryKey: dashboardKeys.stats() }),
      ]);
    },
  });
}

export function useDeleteProject(): UseMutationResult<void, ApiError, ProjectId> {
  const apiClient = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: ProjectId) => {
      const result = await apiClient.request<void, void>({
        method: 'DELETE',
        path: `/projects/${id}`,
      });

      if (!result.ok) {
        throw result.error;
      }
    },
    onSuccess: async (_, id) => {
      queryClient.removeQueries({ queryKey: projectKeys.detail(id) });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: projectKeys.lists() }),
        queryClient.invalidateQueries({ queryKey: dashboardKeys.stats() }),
      ]);
    },
  });
}
