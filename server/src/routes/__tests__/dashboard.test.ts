import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../../app.js';
import { prisma } from '../../lib/prisma.js';
import { generateToken } from '../../lib/crypto.js';
import { createAuthenticatedUser } from '../../test-utils.js';

let token: string;

beforeEach(async () => {
  await prisma.activityLog.deleteMany();
  await prisma.project.deleteMany();
  await prisma.passwordResetToken.deleteMany();
  await prisma.session.deleteMany();
  await prisma.user.deleteMany();

  const auth = await createAuthenticatedUser();
  token = auth.token;
});

describe('GET /api/dashboard/stats', () => {
  it('returns aggregated dashboard stats', async () => {
    // Create 2 active + 1 archived project
    for (let i = 0; i < 2; i++) {
      await prisma.project.create({
        data: {
          id: generateToken(),
          name: `Dashboard Active ${i}`,
          description: '',
          status: 'active',
          leadName: 'Test Lead',
          memberCount: 0,
        },
      });
    }
    await prisma.project.create({
      data: {
        id: generateToken(),
        name: 'Dashboard Archived',
        description: '',
        status: 'archived',
        leadName: 'Test Lead',
        memberCount: 0,
      },
    });

    const res = await request(app)
      .get('/api/dashboard/stats')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body.totalProjects).toBe(3);
    expect(res.body.activeProjects).toBe(2);
    expect(res.body.completedProjects).toBe(0);
    expect(res.body.teamMembers).toBe(0);
    expect(res.body.completionRate).toBe(0);
    expect(Array.isArray(res.body.recentActivity)).toBe(true);
  });

  it('returns 401 without authentication', async () => {
    const res = await request(app)
      .get('/api/dashboard/stats')
      .expect(401);

    expect(res.body.error).toBeDefined();
  });
});
