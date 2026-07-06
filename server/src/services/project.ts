/**
 * Project service — CRUD operations with activity logging.
 *
 * All methods require a `userId` parameter for audit trail purposes.
 * Projects are currently single-tenant: every user sees all projects.
 * Multi-tenant scoping (filter by userId) is reserved for a future phase.
 *
 * @see docs/plans/phase-4-server-endpoints.md §6
 */
import { prisma } from '../lib/prisma.js';
import { AppError } from '../types/index.js';
import { generateToken } from '../lib/crypto.js';
import type { Prisma } from '@prisma/client';

// ─── Types ───────────────────────────────────────────────────────────

export interface ListProjectsOptions {
  page: number;
  pageSize: number;
  sort?: 'name' | 'status' | 'createdAt' | 'updatedAt';
  order?: 'asc' | 'desc';
  search?: string;
  status?: string;
}

export interface ListProjectsResult {
  items: Array<Record<string, unknown>>;
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface CreateProjectInput {
  name: string;
  description?: string;
  status?: string;
  leadName: string;
}

export interface UpdateProjectInput {
  name?: string;
  description?: string;
  status?: string;
  leadName?: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────

const SORT_FIELD_MAP: Record<string, string> = {
  name: 'name',
  status: 'status',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
};

/**
 * Serialize a Prisma project to a plain object matching the frontend schema.
 */
function serializeProject(project: Record<string, unknown>): Record<string, unknown> {
  return {
    ...project,
    createdAt: project.createdAt instanceof Date
      ? project.createdAt.toISOString()
      : project.createdAt,
    updatedAt: project.updatedAt instanceof Date
      ? project.updatedAt.toISOString()
      : project.updatedAt,
  };
}

/**
 * Log a project activity event.
 */
async function logActivity(params: {
  projectId: string;
  userId: string;
  type: string;
  message: string;
}): Promise<void> {
  await prisma.activityLog.create({
    data: {
      id: generateToken(),
      projectId: params.projectId,
      userId: params.userId,
      type: params.type,
      message: params.message,
    },
  });
}

// ─── Service methods ─────────────────────────────────────────────────

/**
 * List projects with pagination, filtering, and sorting.
 */
export async function listProjects(
  options: ListProjectsOptions,
): Promise<ListProjectsResult> {
  const { page, pageSize, sort, order, search, status } = options;

  // Build where clause — exclude soft-deleted projects
  const where: Prisma.ProjectWhereInput = {
    deletedAt: null,
  };

  if (status) {
    where.status = status;
  }

  if (search) {
    where.name = { contains: search, mode: 'insensitive' };
  }

  // Build orderBy
  const sortField = sort ? SORT_FIELD_MAP[sort] ?? 'createdAt' : 'createdAt';
  const sortOrder = order ?? 'desc';
  const orderBy = { [sortField]: sortOrder };

  // Run query + count in parallel
  const [items, total] = await Promise.all([
    prisma.project.findMany({
      where,
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.project.count({ where }),
  ]);

  return {
    items: items.map(serializeProject),
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize) || 1,
  };
}

/**
 * Get a single project by ID.
 * Throws AppError 404 if not found or soft-deleted.
 */
export async function getProjectById(
  id: string,
): Promise<Record<string, unknown>> {
  const project = await prisma.project.findUnique({ where: { id } });

  if (!project || project.deletedAt) {
    throw new AppError(404, 'NOT_FOUND', 'Project not found.');
  }

  return serializeProject(project);
}

/**
 * Create a new project and log a project_created activity.
 */
export async function createProject(
  userId: string,
  input: CreateProjectInput,
): Promise<Record<string, unknown>> {
  const project = await prisma.project.create({
    data: {
      id: generateToken(),
      name: input.name,
      description: input.description ?? '',
      status: input.status ?? 'active',
      leadName: input.leadName,
      memberCount: 0,
    },
  });

  await logActivity({
    projectId: project.id,
    userId,
    type: 'project_created',
    message: `Project "${project.name}" was created.`,
  });

  return serializeProject(project);
}

/**
 * Update a project and log relevant activities.
 * Creates both a `project_updated` event and (if status changed) a
 * `status_changed` event.
 * Throws AppError 404 if the project does not exist.
 */
export async function updateProject(
  id: string,
  userId: string,
  input: UpdateProjectInput,
): Promise<Record<string, unknown>> {
  const existing = await prisma.project.findUnique({ where: { id } });

  if (!existing || existing.deletedAt) {
    throw new AppError(404, 'NOT_FOUND', 'Project not found.');
  }

  // Build update payload from non-undefined fields
  const data: Prisma.ProjectUpdateInput = {};
  if (input.name !== undefined) data.name = input.name;
  if (input.description !== undefined) data.description = input.description;
  if (input.leadName !== undefined) data.leadName = input.leadName;
  if (input.status !== undefined) data.status = input.status;

  const updated = await prisma.project.update({
    where: { id },
    data,
  });

  // Log project_updated
  await logActivity({
    projectId: id,
    userId,
    type: 'project_updated',
    message: `Project "${updated.name}" was updated.`,
  });

  // Log status_changed if status changed
  if (input.status !== undefined && input.status !== existing.status) {
    await logActivity({
      projectId: id,
      userId,
      type: 'status_changed',
      message: `Project "${updated.name}" status changed from "${existing.status}" to "${input.status}".`,
    });
  }

  return serializeProject(updated);
}

/**
 * Soft-delete a project by setting its `deletedAt` timestamp.
 * Activity logs are preserved for audit trail purposes.
 * Throws AppError 404 if the project does not exist or is already deleted.
 */
export async function deleteProject(
  id: string,
): Promise<void> {
  const existing = await prisma.project.findUnique({ where: { id } });

  if (!existing || existing.deletedAt) {
    throw new AppError(404, 'NOT_FOUND', 'Project not found.');
  }

  await prisma.project.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
}
