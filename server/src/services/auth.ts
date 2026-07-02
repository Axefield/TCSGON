import type { User } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { generateToken, hashToken, expiryDate, comparePassword } from '../lib/crypto.js';
import { AppError } from '../types/index.js';
import * as userService from './user.js';
import * as sessionService from './session.js';


export interface SignupInput {
  name: string;
  email: string;
  password: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface ResetPasswordInput {
  token: string;
  password: string;
}

export interface AuthResult {
  user: Omit<User, 'passwordHash'>;
  session: {
    id: string;
    token: string;
    expiresAt: Date;
  };
}

/**
 * Create an account and return an auth session.
 */
export async function signup(input: SignupInput): Promise<AuthResult> {
  const user = await userService.createUser(input);
  const { session, token } = await sessionService.createSession(user.id);

  return {
    user: userService.sanitizeUser(user),
    session: {
      id: session.id,
      token,
      expiresAt: session.expiresAt,
    },
  };
}

/**
 * Authenticate with email + password and return a session.
 */
export async function login(input: LoginInput): Promise<AuthResult> {
  const user = await userService.getUserByEmail(input.email);
  if (!user) {
    throw new AppError(401, 'UNAUTHORIZED', 'Invalid email or password.');
  }

  const valid = await comparePassword(input.password, user.passwordHash);
  if (!valid) {
    throw new AppError(401, 'UNAUTHORIZED', 'Invalid email or password.');
  }

  const { session, token } = await sessionService.createSession(user.id);

  return {
    user: userService.sanitizeUser(user),
    session: {
      id: session.id,
      token,
      expiresAt: session.expiresAt,
    },
  };
}

/**
 * Logout by revoking the current session.
 */
export async function logout(sessionId: string): Promise<void> {
  await sessionService.revokeSession(sessionId);
}

/**
 * Initiate a password reset.
 * Always returns success to prevent email enumeration.
 */
export async function forgotPassword(email: string): Promise<void> {
  const user = await userService.getUserByEmail(email);
  if (!user) return; // Silent fail — don't reveal user existence

  const token = generateToken();
  const tokenHash = hashToken(token);

  await prisma.passwordResetToken.create({
    data: {
      id: generateToken(),
      userId: user.id,
      tokenHash,
      expiresAt: expiryDate(1), // 1-hour expiry
    },
  });

  // In development, log the reset token for testing
  if (process.env.NODE_ENV !== 'production') {
    console.log(`[DEV] Password reset token for ${email}: ${token}`);
  }
}

/**
 * Complete a password reset with a valid token.
 */
export async function resetPassword(input: ResetPasswordInput): Promise<AuthResult> {
  const tokenHash = hashToken(input.token);

  const resetToken = await prisma.passwordResetToken.findUnique({
    where: { tokenHash },
    include: { user: true },
  });

  if (!resetToken) {
    throw new AppError(400, 'VALIDATION_ERROR', 'Invalid or expired reset token.');
  }

  if (resetToken.usedAt) {
    throw new AppError(400, 'VALIDATION_ERROR', 'This reset token has already been used.');
  }

  if (resetToken.expiresAt < new Date()) {
    throw new AppError(400, 'VALIDATION_ERROR', 'Reset token has expired. Please request a new one.');
  }

  // Mark token as used
  await prisma.passwordResetToken.update({
    where: { id: resetToken.id },
    data: { usedAt: new Date() },
  });

  // Update user's password
  await userService.updatePasswordHash(resetToken.userId, input.password);

  // Create new session
  const { session, token } = await sessionService.createSession(resetToken.userId);

  return {
    user: userService.sanitizeUser(resetToken.user),
    session: {
      id: session.id,
      token,
      expiresAt: session.expiresAt,
    },
  };
}
