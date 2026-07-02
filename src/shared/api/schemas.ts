/**
 * Schema registry — single source of truth for Zod schemas the API client
 * uses to validate responses.
 *
 * @see docs/plans/phase-1-core-infrastructure.md §6
 */
import { type z } from 'zod';

import {
  ForgotPasswordInputSchema,
  ForgotPasswordResponseSchema,
  LoginInputSchema,
  ResetPasswordInputSchema,
  SessionSchema,
  SignupInputSchema,
  UserSchema,
} from '@/shared/types/user';

export interface NamedSchema<T> {
  readonly name: string;
  readonly schema: z.ZodType<T>;
}

export function defineSchema<T>(name: string, schema: z.ZodType<T>): NamedSchema<T> {
  return { name, schema };
}

export const Schemas = {
  user: defineSchema('user', UserSchema),
  session: defineSchema('session', SessionSchema),
  loginInput: defineSchema('loginInput', LoginInputSchema),
  signupInput: defineSchema('signupInput', SignupInputSchema),
  forgotPasswordInput: defineSchema('forgotPasswordInput', ForgotPasswordInputSchema),
  resetPasswordInput: defineSchema('resetPasswordInput', ResetPasswordInputSchema),
  forgotPasswordResponse: defineSchema('forgotPasswordResponse', ForgotPasswordResponseSchema),
} as const;

export type SchemaName = keyof typeof Schemas;
