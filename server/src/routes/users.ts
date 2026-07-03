import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import * as userService from '../services/user.js';
import * as notificationService from '../services/notification.js';
import type { AuthenticatedRequest } from '../types/index.js';

const router = Router();

// ─── Zod schemas ───────────────────────────────────────────────

const UpdateProfileBodySchema = z.object({
  name: z.string().min(1, 'Name is required.').max(120).optional(),
  email: z.string().email('Valid email is required.').optional(),
  avatarUrl: z.string().url('Must be a valid URL.').max(500).optional().nullable(),
});

const ChangePasswordBodySchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required.'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters.').max(200),
});

const UpdateNotificationBodySchema = z.object({
  emailNotifications: z.boolean().optional(),
  pushNotifications: z.boolean().optional(),
  inAppNotifications: z.boolean().optional(),
  dailyDigest: z.boolean().optional(),
  marketingEmails: z.boolean().optional(),
});

// ─── User profile routes ────────────────────────────────────────

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
 * Update the current user's name, email, and/or avatar URL.
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

// ─── Notification preferences routes ────────────────────────────

/**
 * GET /api/users/me/notification-preferences
 * Return the current user's notification preferences.
 */
router.get('/me/notification-preferences', requireAuth, async (req: AuthenticatedRequest, res, next) => {
  try {
    const prefs = await notificationService.getNotificationPreferences(req.user.id);
    res.json(prefs);
  } catch (err) {
    next(err);
  }
});

/**
 * PUT /api/users/me/notification-preferences
 * Update the current user's notification preferences.
 */
router.put('/me/notification-preferences', requireAuth, validate(UpdateNotificationBodySchema), async (req: AuthenticatedRequest, res, next) => {
  try {
    const prefs = await notificationService.updateNotificationPreferences(req.user.id, req.body);
    res.json(prefs);
  } catch (err) {
    next(err);
  }
});

export default router;
