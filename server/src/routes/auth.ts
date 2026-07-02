import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import * as authService from '../services/auth.js';
import type { AuthenticatedRequest } from '../types/index.js';

const router = Router();

// ─── Zod schemas ───────────────────────────────────────────────

const SignupBodySchema = z.object({
  name: z.string().min(1, 'Name is required.').max(120),
  email: z.string().email('Valid email is required.'),
  password: z.string().min(8, 'Password must be at least 8 characters.').max(200),
});

const LoginBodySchema = z.object({
  email: z.string().email('Valid email is required.'),
  password: z.string().min(1, 'Password is required.'),
});

const ForgotPasswordBodySchema = z.object({
  email: z.string().email('Valid email is required.'),
});

const ResetPasswordBodySchema = z.object({
  token: z.string().min(1, 'Reset token is required.'),
  password: z.string().min(8, 'Password must be at least 8 characters.').max(200),
});

// ─── Routes ─────────────────────────────────────────────────────

/**
 * POST /api/auth/signup
 * Create a new account. Returns user + session.
 */
router.post('/signup', validate(SignupBodySchema), async (req, res, next) => {
  try {
    const result = await authService.signup(req.body);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/auth/login
 * Authenticate with email + password. Returns user + session.
 */
router.post('/login', validate(LoginBodySchema), async (req, res, next) => {
  try {
    const result = await authService.login(req.body);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/auth/logout
 * Revoke current session. Requires auth.
 */
router.post('/logout', requireAuth, async (req: AuthenticatedRequest, res, next) => {
  try {
    await authService.logout(req.session.id);
    res.json({ message: 'Logged out successfully.' });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/auth/forgot-password
 * Request a password reset email. Always returns 200.
 */
router.post('/forgot-password', validate(ForgotPasswordBodySchema), async (req, res, next) => {
  try {
    await authService.forgotPassword(req.body.email);
    res.json({ message: 'If an account exists with this email, a reset link has been sent.' });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/auth/reset-password
 * Complete a password reset with a valid token. Returns new session.
 */
router.post('/reset-password', validate(ResetPasswordBodySchema), async (req, res, next) => {
  try {
    const result = await authService.resetPassword(req.body);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/auth/session
 * Validate current session. Requires auth.
 * Returns user + session metadata (no token — client already has it).
 */
router.get('/session', requireAuth, (req: AuthenticatedRequest, res) => {
  const { user, session } = req;
  res.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
    },
    session: {
      id: session.id,
      expiresAt: session.expiresAt,
    },
  });
});

export default router;
