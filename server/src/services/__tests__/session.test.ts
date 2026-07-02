import { describe, it, expect, beforeEach } from 'vitest';
import * as sessionService from '../session.js';
import * as userService from '../user.js';
import { prisma } from '../../lib/prisma.js';

beforeEach(async () => {
  await prisma.passwordResetToken.deleteMany();
  await prisma.session.deleteMany();
  await prisma.user.deleteMany();
});

describe('sessionService', () => {
  let userId: string;

  beforeEach(async () => {
    const user = await userService.createUser({
      name: 'Alice',
      email: 'alice@test.com',
      password: 'SecurePass1',
    });
    userId = user.id;
  });

  describe('createSession', () => {
    it('creates a session and returns raw token', async () => {
      const result = await sessionService.createSession(userId);

      expect(result.session).toBeDefined();
      expect(result.session.userId).toBe(userId);
      expect(result.token).toBeTruthy();
      expect(result.token.length).toBeGreaterThan(20);

      // Verify the session exists in DB
      const found = await prisma.session.findUnique({ where: { id: result.session.id } });
      expect(found).not.toBeNull();
    });

    it('stores a hashed token, not the raw token', async () => {
      const result = await sessionService.createSession(userId);

      const found = await prisma.session.findUnique({ where: { id: result.session.id } });
      expect(found?.tokenHash).not.toBe(result.token);
    });
  });

  describe('getSessionById', () => {
    it('returns session by id', async () => {
      const { session } = await sessionService.createSession(userId);

      const found = await sessionService.getSessionById(session.id);
      expect(found).not.toBeNull();
      expect(found?.id).toBe(session.id);
    });

    it('returns null for non-existent id', async () => {
      const found = await sessionService.getSessionById('00000000-0000-0000-0000-000000000001');
      expect(found).toBeNull();
    });
  });

  describe('revokeSession', () => {
    it('deletes the session', async () => {
      const { session } = await sessionService.createSession(userId);

      await sessionService.revokeSession(session.id);

      const found = await prisma.session.findUnique({ where: { id: session.id } });
      expect(found).toBeNull();
    });
  });

  describe('revokeAllUserSessions', () => {
    it('deletes all sessions for a user', async () => {
      await sessionService.createSession(userId);
      await sessionService.createSession(userId);

      await sessionService.revokeAllUserSessions(userId);

      const sessions = await prisma.session.findMany({ where: { userId } });
      expect(sessions.length).toBe(0);
    });
  });
});
