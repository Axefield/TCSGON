import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import * as userService from '../services/user.js';
import type { AuthenticatedRequest } from '../types/index.js';

const router = Router();

// ─── Zod schemas ───────────────────────────────────────────────

const UpdateProfileBodySchema = z.object({
  name: z.string().min(1, 'Name is required.').max(120).optional(),
  email: z.string().email('Valid email is required.').optional(),
});

const ChangePasswordBodySchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required.'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters.').max(200),
});

// ─── Routes ─────────────────────────────────────────────────────

/**
 * GET /api/users/me
 * Return the current user's profile.
 */
router.get('/me', requireAuth, (req: AuthenticatedRequest, res) => {
  const safe = userService.sanitizeUser(req.user);
  res.json(safe);
});

/**
 * PUT /api/users/me
 * Update the current user's name and/or email.
 */
router.put('/me', requireAuth, validate(UpdateProfileBodySchema), async (req: AuthenticatedRequest, res, next) => {
  try {
    const updated = await userService.updateUser(req.user.id, req.body);
    const safe = userService.sanitizeUser(updated);
    res.json(safe);
  } catch (err) {
    next(err);
  }
});

/**
 * PUT /api/users/me/password
 * Change the current user's password.
 */
router.put('/me/password', requireAuth, validate(ChangePasswordBodySchema), async (req: AuthenticatedRequest, res, next) => {
  try {
    await userService.changePassword(req.user.id, req.body.currentPassword, req.body.newPassword);
    res.json({ message: 'Password changed successfully.' });
  } catch (err) {
    next(err);
  }
});

export default router;
