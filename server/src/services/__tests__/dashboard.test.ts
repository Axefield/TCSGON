import { describe, it, expect, beforeEach } from 'vitest';
import * as dashboardService from '../dashboard.js';
import { prisma } from '../../lib/prisma.js';
import { generateToken } from '../../lib/crypto.js';
import { createTestUser } from '../../test-utils.js';
import type { User } from '@prisma/client';

let user: User;

beforeEach(async () => {
  await prisma.activityLog.deleteMany();
  await prisma.project.deleteMany();
  await prisma.passwordResetToken.deleteMany();
  await prisma.session.deleteMany();
  await prisma.user.deleteMany();

  user = await createTestUser();
});

describe('dashboardService.getStats', () => {
  it('returns correct totals from sample data', async () => {
    const statuses = ['active', 'active', 'active', 'archived', 'archived', 'paused'];
    for (const status of statuses) {
      await prisma.project.create({
        data: {
          id: generateToken(),
          name: `Project ${status} ${Date.now()}`,
          description: '',
          status,
          leadName: 'Test Lead',
          memberCount: 0,
        },
      });
    }

    const stats = await dashboardService.getStats();
    expect(stats.totalProjects).toBe(6);
    expect(stats.activeProjects).toBe(3);
    expect(stats.completedProjects).toBe(0);
  });

  it('recentActivity returns most recent entries with limit', async () => {
    const project = await prisma.project.create({
      data: {
        id: generateToken(),
        name: 'Activity Test',
        description: '',
        status: 'active',
        leadName: 'Test Lead',
        memberCount: 0,
      },
    });

    // Create 15 activity logs with real user ID
    for (let i = 0; i < 15; i++) {
      await prisma.activityLog.create({
        data: {
          id: generateToken(),
          projectId: project.id,
          userId: user.id,
          type: 'project_updated',
          message: `Update ${i + 1}`,
          createdAt: new Date(Date.now() + i * 1000),
        },
      });
    }

    const stats = await dashboardService.getStats();
    expect(stats.recentActivity.length).toBe(10);
    expect(stats.recentActivity[0]?.message).toBe('Update 15');
  });

  it('completionRate computed correctly', async () => {
    const statuses = ['active', 'active', 'active', 'active', 'completed'];
    for (const status of statuses) {
      await prisma.project.create({
        data: {
          id: generateToken(),
          name: `Rate ${status} ${Date.now()}`,
          description: '',
          status,
          leadName: 'Test Lead',
          memberCount: 0,
        },
      });
    }

    const stats = await dashboardService.getStats();
    expect(stats.completedProjects).toBe(1);
    expect(stats.completionRate).toBe(20);
  });

  it('returns empty defaults when no projects exist', async () => {
    const stats = await dashboardService.getStats();
    expect(stats.totalProjects).toBe(0);
    expect(stats.activeProjects).toBe(0);
    expect(stats.completedProjects).toBe(0);
    expect(stats.recentActivity).toEqual([]);
    expect(stats.completionRate).toBe(0);
  });

  it('teamMembers returns 0 (no member model yet)', async () => {
    const stats = await dashboardService.getStats();
    expect(stats.teamMembers).toBe(0);
  });
});
