/**
 * Project module types — Zod schemas + derived TypeScript types.
 *
 * All project data is validated at runtime via these Zod schemas.
 * TypeScript types are inferred; hand-written interfaces are for
 * non-serializable or composite shapes.
 *
 * @see docs/plans/phase-2-data-and-features.md §6.3
 */
import { z } from 'zod';

import { asProjectId } from '@/shared/types/brand';

export const ProjectStatusSchema = z.enum(['active', 'paused', 'completed', 'archived']);
export type ProjectStatus = z.infer<typeof ProjectStatusSchema>;

export const ProjectSchema = z.object({
  id: z.string().min(1).transform(asProjectId),
  name: z.string().min(1).max(200),
  description: z.string().max(2000).default(''),
  status: ProjectStatusSchema,
  leadName: z.string().min(1).max(120),
  memberCount: z.number().nonnegative(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type Project = z.infer<typeof ProjectSchema>;

export const ProjectInputSchema = z.object({
  name: z.string().min(1, 'Name is required.').max(200),
  description: z.string().max(2000).optional(),
  status: ProjectStatusSchema.optional().default('active'),
  leadName: z.string().min(1, 'Lead name is required.').max(120),
});
export type ProjectInput = z.infer<typeof ProjectInputSchema>;

export interface ProjectListParams {
  readonly page: number;
  readonly pageSize: number;
  readonly sort?: 'name' | 'status' | 'createdAt' | 'updatedAt';
  readonly order?: 'asc' | 'desc';
  readonly search?: string;
  readonly status?: ProjectStatus;
}

export interface ProjectListResponse {
  readonly items: ReadonlyArray<Project>;
  readonly total: number;
  readonly page: number;
  readonly pageSize: number;
  readonly totalPages: number;
}
