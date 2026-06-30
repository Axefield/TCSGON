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
