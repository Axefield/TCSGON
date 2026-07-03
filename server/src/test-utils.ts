import { prisma } from './lib/prisma.js';
import { hashToken, generateToken, expiryDate } from './lib/crypto.js';
import { hashPassword } from './lib/crypto.js';
import type { User, Session, Project } from '@prisma/client';

/**
 * Create a test user in the database.
 * Returns the created user.
 */
export async function createTestUser(overrides: Partial<User> = {}): Promise<User> {
  const passwordHash = await hashPassword(overrides.passwordHash ?? 'Password123!');

  return prisma.user.create({
    data: {
      id: generateToken(),
      name: 'Test User',
      email: `test-${Date.now()}@example.com`,
      passwordHash,
      ...overrides,
    },
  });
}

/**
 * Create a test session for a user.
 * Returns the session and the raw token.
 */
export async function createTestSession(
  userId: string,
  overrides: Partial<Session> = {},
): Promise<{ session: Session; token: string }> {
  const token = generateToken();
  const tokenHash = hashToken(token);

  const session = await prisma.session.create({
    data: {
      id: generateToken(),
      userId,
      tokenHash,
      expiresAt: expiryDate(),
      ...overrides,
    },
  });

  return { session, token };
}

/**
 * Create a test project in the database.
 * Returns the created project.
 */
export async function createTestProject(
  overrides: Partial<Project> = {},
): Promise<Project> {
  return prisma.project.create({
    data: {
      id: generateToken(),
      name: 'Test Project',
      description: 'A test project for testing',
      status: 'active',
      leadName: 'Test Lead',
      memberCount: 0,
      ...overrides,
    },
  });
}

/**
 * Create an authenticated test user with a session.
 * Returns the user, session, and raw token.
 */
export async function createAuthenticatedUser(): Promise<{
  user: User;
  session: Session;
  token: string;
}> {
  const user = await createTestUser();
  const { session, token } = await createTestSession(user.id);
  return { user, session, token };
}
