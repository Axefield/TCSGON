/**
 * Dashboard routes — aggregate statistics endpoint.
 *
 * @see docs/plans/phase-4-server-endpoints.md §9
 */
import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import * as dashboardService from '../services/dashboard.js';
import type { AuthenticatedRequest } from '../types/index.js';

const router = Router();

/**
 * GET /api/dashboard/stats
 * Return aggregate project statistics for the dashboard view.
 */
router.get(
  '/stats',
  requireAuth,
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const stats = await dashboardService.getStats();
      res.json(stats);
    } catch (err) {
      next(err);
    }
  },
);

export default router;
