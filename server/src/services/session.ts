import type { Session } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { generateToken, hashToken, expiryDate } from '../lib/crypto.js';

export interface CreateSessionResult {
  session: Session;
  token: string;
}

/**
 * Create a new session for a user.
 * Returns the raw token (to be returned to client once) and the DB record.
 */
export async function createSession(userId: string): Promise<CreateSessionResult> {
  const token = generateToken();
  const tokenHash = hashToken(token);

  const session = await prisma.session.create({
    data: {
      id: generateToken(),
      userId,
      tokenHash,
      expiresAt: expiryDate(),
    },
  });

  return { session, token };
}

/**
 * Find a session by its ID.
 */
export async function getSessionById(id: string): Promise<Session | null> {
  return prisma.session.findUnique({ where: { id } });
}

/**
 * Revoke a session by deleting it.
 */
export async function revokeSession(id: string): Promise<void> {
  await prisma.session.delete({ where: { id } });
}

/**
 * Revoke all sessions for a user.
 */
export async function revokeAllUserSessions(userId: string): Promise<void> {
  await prisma.session.deleteMany({ where: { userId } });
}
