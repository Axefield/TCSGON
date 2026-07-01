import {
  useCreateProject as useCreateProjectMutation,
  useDeleteProject as useDeleteProjectMutation,
  useProject as useProjectQuery,
  useProjects as useProjectsQuery,
  useUpdateProject as useUpdateProjectMutation,
} from '@/features/projects/api/projectsApi';
import type { ProjectInput, ProjectListParams } from '@/features/projects/types';
import type { ProjectId } from '@/shared/types/brand';

export function useProjectList(params: ProjectListParams) {
  return useProjectsQuery(params);
}

export function useProjectDetails(id: ProjectId) {
  return useProjectQuery(id);
}

export function useCreateProject() {
  return useCreateProjectMutation();
}

export function useUpdateProject() {
  return useUpdateProjectMutation();
}

export function useDeleteProject() {
  return useDeleteProjectMutation();
}

export type { ProjectInput };
