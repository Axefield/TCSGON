/**
 * Project routes — CRUD endpoints for project management.
 *
 * @see docs/plans/phase-4-server-endpoints.md §8
 */
import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth.js';
import { validate, validateQuery } from '../middleware/validate.js';
import * as projectService from '../services/project.js';
import type { AuthenticatedRequest } from '../types/index.js';

const router = Router();

// ─── Zod schemas ─────────────────────────────────────────────────────

const ListProjectsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
  sort: z.enum(['name', 'status', 'createdAt', 'updatedAt']).optional(),
  order: z.enum(['asc', 'desc']).optional(),
  search: z.string().max(200).optional(),
  status: z.enum(['active', 'paused', 'completed', 'archived']).optional(),
});

const CreateProjectBodySchema = z.object({
  name: z.string().min(1, 'Name is required.').max(200),
  description: z.string().max(2000).optional(),
  status: z
    .enum(['active', 'paused', 'completed', 'archived'])
    .optional()
    .default('active'),
  leadName: z.string().min(1, 'Lead name is required.').max(120),
});

const UpdateProjectBodySchema = z.object({
  name: z.string().min(1, 'Name is required.').max(200).optional(),
  description: z.string().max(2000).optional(),
  status: z.enum(['active', 'paused', 'completed', 'archived']).optional(),
  leadName: z.string().min(1, 'Lead name is required.').max(120).optional(),
});

// ─── Routes ──────────────────────────────────────────────────────────

/**
 * GET /api/projects
 * List projects with pagination, filtering, and sorting.
 */
router.get(
  '/',
  requireAuth,
  validateQuery(ListProjectsQuerySchema),
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const result = await projectService.listProjects(
        req.query as projectService.ListProjectsOptions,
      );
      res.json(result);
    } catch (err) {
      next(err);
    }
  },
);

/**
 * GET /api/projects/:id
 * Get a single project by ID.
 */
router.get(
  '/:id',
  requireAuth,
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const project = await projectService.getProjectById(
        req.params.id,
      );
      res.json(project);
    } catch (err) {
      next(err);
    }
  },
);

/**
 * POST /api/projects
 * Create a new project.
 */
router.post(
  '/',
  requireAuth,
  validate(CreateProjectBodySchema),
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const project = await projectService.createProject(
        req.user.id,
        req.body,
      );
      res.status(201).json(project);
    } catch (err) {
      next(err);
    }
  },
);

/**
 * PUT /api/projects/:id
 * Update an existing project.
 */
router.put(
  '/:id',
  requireAuth,
  validate(UpdateProjectBodySchema),
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const project = await projectService.updateProject(
        req.params.id,
        req.user.id,
        req.body,
      );
      res.json(project);
    } catch (err) {
      next(err);
    }
  },
);

/**
 * DELETE /api/projects/:id
 * Delete a project and cascade activity logs.
 */
router.delete(
  '/:id',
  requireAuth,
  async (req: AuthenticatedRequest, res, next) => {
    try {
      await projectService.deleteProject(req.params.id);
      res.status(204).end();
    } catch (err) {
      next(err);
    }
  },
);

export default router;
