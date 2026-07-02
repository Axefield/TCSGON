/**
 * Zod schemas — single source of truth for entities crossing the network.
 *
 * @see docs/plans/phase-1-core-infrastructure.md §18
 *
 * Rule (AGENTS.md §3): hand-written `interface` is forbidden for entities
 * that travel on the wire. Always derive the TS type via `z.infer<...>`.
 */
import { z } from 'zod';

import { asSessionId, asUserId } from './brand';

export const UserSchema = z.object({
  id: z.string().min(1).transform(asUserId),
  name: z.string().min(1).max(120),
  email: z.string().email(),
});
export type User = z.infer<typeof UserSchema>;

export const SessionSchema = z.object({
  id: z.string().min(1).transform(asSessionId),
  user: UserSchema,
  token: z.string().min(20),
  expiresAt: z.string().datetime(),
});
export type Session = z.infer<typeof SessionSchema>;

export const LoginInputSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(200),
});
export type LoginInput = z.infer<typeof LoginInputSchema>;

// ─── Phase 3: Authentication Feature ───────────────────────────────────────

/**
 * Signup input — validates against the server's expected shape.
 * `confirmPassword` is validated client-side via `.refine()` and sent
 * to the server for verification. The derived type includes all fields.
 */
export const SignupInputSchema = z
  .object({
    name: z.string().min(1, 'Name is required').max(120),
    email: z.string().email('Valid email is required'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .max(200, 'Password must be at most 200 characters'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });
export type SignupInput = z.infer<typeof SignupInputSchema>;

/**
 * Forgot-password input — email-only request to trigger a reset email.
 */
export const ForgotPasswordInputSchema = z.object({
  email: z.string().email('Valid email is required'),
});
export type ForgotPasswordInput = z.infer<typeof ForgotPasswordInputSchema>;

/**
 * Reset-password input — token from email link + new password with confirmation.
 * `confirmPassword` is cross-validated against `password` via `.refine()`.
 */
export const ResetPasswordInputSchema = z
  .object({
    token: z.string().min(1, 'Reset token is required'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .max(200, 'Password must be at most 200 characters'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });
export type ResetPasswordInput = z.infer<typeof ResetPasswordInputSchema>;

/**
 * Forgot-password response — generic success message from the server.
 * The server always returns 200 to avoid leaking user existence.
 */
export const ForgotPasswordResponseSchema = z.object({
  message: z.string(),
});
export type ForgotPasswordResponse = z.infer<typeof ForgotPasswordResponseSchema>;

// ─── Server Response Wrappers ──────────────────────────────────────────────

/**
 * Server response for login/signup/reset-password endpoints.
 * Returns `{ user, session: { id, token, expiresAt } }`.
 * Transforms to flat `Session` shape for internal consumption.
 */
export const AuthResponseSchema = z
  .object({
    user: UserSchema,
    session: z.object({
      id: z.string().min(1).transform(asSessionId),
      token: z.string().min(20),
      expiresAt: z.string().datetime(),
    }),
  })
  .transform((data) => ({
    id: data.session.id,
    user: data.user,
    token: data.session.token,
    expiresAt: data.session.expiresAt,
  }));

/**
 * Server response for GET /api/auth/session (session check).
 * Returns `{ user, session: { id, expiresAt } }` — no token for security.
 * The client merges the stored token from localStorage.
 */
export const SessionCheckSchema = z.object({
  user: UserSchema,
  session: z.object({
    id: z.string().min(1).transform(asSessionId),
    expiresAt: z.string().datetime(),
  }),
});

// ═══════════════════════════════════════════════════════════════════════════════
// Profile / User Settings (Phase 3c.2)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Profile response from GET/PUT /api/users/me.
 * Server returns `Omit<User, 'passwordHash'>` with timestamps.
 * The `id` field transform is preserved from `UserSchema`.
 */
export const ProfileResponseSchema = z.object({
  id: z.string().min(1).transform(asUserId),
  name: z.string().min(1).max(120),
  email: z.string().email(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type Profile = z.infer<typeof ProfileResponseSchema>;

/**
 * Input for PUT /api/users/me — update profile.
 * At least one field must be provided for a meaningful update.
 */
export const UpdateProfileInputSchema = z.object({
  name: z.string().min(1, 'Name is required.').max(120).optional(),
  email: z.string().email('Valid email is required.').optional(),
});
export type UpdateProfileInput = z.infer<typeof UpdateProfileInputSchema>;

/**
 * Input for PUT /api/users/me/password — change password.
 */
export const ChangePasswordInputSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required.'),
  newPassword: z
    .string()
    .min(8, 'New password must be at least 8 characters.')
    .max(200, 'New password must be at most 200 characters.'),
});
export type ChangePasswordInput = z.infer<typeof ChangePasswordInputSchema>;

/**
 * Response from PUT /api/users/me/password.
 */
export const ChangePasswordResponseSchema = z.object({
  message: z.string(),
});
export type ChangePasswordResponse = z.infer<typeof ChangePasswordResponseSchema>;
