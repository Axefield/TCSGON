import type { User } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { hashPassword, comparePassword, generateToken } from '../lib/crypto.js';
import { AppError } from '../types/index.js';

export interface CreateUserInput {
  name: string;
  email: string;
  password: string;
}

export interface UpdateUserInput {
  name?: string;
  email?: string;
  avatarUrl?: string | null;
}

/**
 * Create a new user with a hashed password.
 * Throws 409 if email already exists.
 */
export async function createUser(input: CreateUserInput): Promise<User> {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) {
    throw new AppError(409, 'CONFLICT', 'A user with this email already exists.');
  }

  const passwordHash = await hashPassword(input.password);

  return prisma.user.create({
    data: {
      id: generateToken(),
      name: input.name,
      email: input.email,
      passwordHash,
    },
  });
}

/**
 * Find a user by email.
 */
export async function getUserByEmail(email: string): Promise<User | null> {
  return prisma.user.findUnique({ where: { email } });
}

/**
 * Find a user by ID.
 */
export async function getUserById(id: string): Promise<User | null> {
  return prisma.user.findUnique({ where: { id } });
}

/**
 * Update a user's name and/or email.
 * Throws 409 if the new email is taken by another user.
 */
export async function updateUser(
  userId: string,
  input: UpdateUserInput,
): Promise<User> {
  if (input.email) {
    const existing = await prisma.user.findUnique({ where: { email: input.email } });
    if (existing && existing.id !== userId) {
      throw new AppError(409, 'CONFLICT', 'This email is already in use.');
    }
  }

  return prisma.user.update({
    where: { id: userId },
    data: {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.email !== undefined ? { email: input.email } : {}),
      ...(input.avatarUrl !== undefined ? { avatarUrl: input.avatarUrl } : {}),
    },
  });
}

/**
 * Change a user's password.
 * Throws 401 if current password is incorrect.
 */
export async function changePassword(
  userId: string,
  currentPassword: string,
  newPassword: string,
): Promise<void> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new AppError(404, 'NOT_FOUND', 'User not found.');
  }

  const valid = await comparePassword(currentPassword, user.passwordHash);
  if (!valid) {
    throw new AppError(401, 'UNAUTHORIZED', 'Current password is incorrect.');
  }

  const passwordHash = await hashPassword(newPassword);

  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash },
  });
}

/**
 * Update a user's password hash directly (for password reset).
 */
export async function updatePasswordHash(userId: string, passwordHash: string): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash },
  });
}

/**
 * Return public-safe user data (no password hash).
 */
export function sanitizeUser(user: User): Omit<User, 'passwordHash'> {
  const { passwordHash: _, ...safe } = user;
  void _;
  return safe;
}
