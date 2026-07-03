import { describe, it, expect, beforeEach } from 'vitest';
import * as projectService from '../project.js';
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

describe('projectService.createProject', () => {
  it('creates a project and writes a project_created activity log', async () => {
    const project = await projectService.createProject(user.id, {
      name: 'Alpha Project',
      description: 'First project',
      status: 'active',
      leadName: 'Alice',
    });

    // Project fields
    expect(project).toBeDefined();
    expect(project.name).toBe('Alpha Project');
    expect(project.description).toBe('First project');
    expect(project.status).toBe('active');
    expect(project.leadName).toBe('Alice');
    expect(project.memberCount).toBe(0);
    expect(typeof project.createdAt).toBe('string');
    expect(typeof project.updatedAt).toBe('string');

    // Activity log created
    const logs = await prisma.activityLog.findMany({
      where: { projectId: project.id as string },
    });
    expect(logs.length).toBe(1);
    expect(logs[0]?.type).toBe('project_created');
    expect(logs[0]?.message).toContain('Alpha Project');
  });
});

describe('projectService.getProjectById', () => {
  it('returns a project by ID', async () => {
    const created = await projectService.createProject(user.id, {
      name: 'Beta Project',
      leadName: 'Bob',
    });

    const found = await projectService.getProjectById(
      created.id as string,
    );
    expect(found.id).toBe(created.id);
    expect(found.name).toBe('Beta Project');
  });

  it('throws AppError 404 for non-existent project', async () => {
    await expect(
      projectService.getProjectById(generateToken()),
    ).rejects.toMatchObject({
      statusCode: 404,
      code: 'NOT_FOUND',
    });
  });
});

describe('projectService.listProjects', () => {
  beforeEach(async () => {
    for (let i = 0; i < 3; i++) {
      await prisma.project.create({
        data: {
          id: generateToken(),
          name: `Project ${i + 1}`,
          description: '',
          status: i === 0 ? 'active' : i === 1 ? 'archived' : 'active',
          leadName: `Lead ${i + 1}`,
          memberCount: i,
        },
      });
    }
  });

  it('returns paginated results with total', async () => {
    const result = await projectService.listProjects({
      page: 1,
      pageSize: 2,
    });
    expect(result.items.length).toBe(2);
    expect(result.total).toBe(3);
    expect(result.page).toBe(1);
    expect(result.pageSize).toBe(2);
    expect(result.totalPages).toBe(2);
  });

  it('respects page/pageSize for offset pagination', async () => {
    const result = await projectService.listProjects({
      page: 2,
      pageSize: 2,
    });
    expect(result.items.length).toBe(1);
    expect(result.total).toBe(3);
    expect(result.page).toBe(2);
  });

  it('filters by status', async () => {
    const result = await projectService.listProjects({
      page: 1,
      pageSize: 10,
      status: 'archived',
    });
    expect(result.items.length).toBe(1);
    expect(result.total).toBe(1);
    expect(result.items[0]?.status).toBe('archived');
  });

  it('searches by name case-insensitively', async () => {
    await prisma.project.create({
      data: {
        id: generateToken(),
        name: 'Alpha Project',
        description: '',
        status: 'active',
        leadName: 'Test Lead',
        memberCount: 0,
      },
    });

    const result = await projectService.listProjects({
      page: 1,
      pageSize: 10,
      search: 'alpha',
    });
    expect(result.items.length).toBe(1);
    expect(result.items[0]?.name).toBe('Alpha Project');
  });

  it('sorts by specified field', async () => {
    const result = await projectService.listProjects({
      page: 1,
      pageSize: 10,
      sort: 'name',
      order: 'asc',
    });
    expect(result.items.length).toBe(3);
    expect((result.items[0] as Record<string, string>).name).toBe('Project 1');
    expect((result.items[2] as Record<string, string>).name).toBe('Project 3');
  });
});

describe('projectService.updateProject', () => {
  let projectId: string;

  beforeEach(async () => {
    const project = await projectService.createProject(user.id, {
      name: 'Update Me',
      status: 'active',
      leadName: 'Original Lead',
    });
    projectId = project.id as string;
  });

  it('updates fields and creates project_updated activity', async () => {
    const updated = await projectService.updateProject(projectId, user.id, {
      name: 'Updated Name',
    });
    expect(updated.name).toBe('Updated Name');

    const logs = await prisma.activityLog.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
    });
    expect(logs.some((l) => l.type === 'project_updated')).toBe(true);
  });

  it('creates status_changed activity when status changes', async () => {
    await projectService.updateProject(projectId, user.id, {
      status: 'archived',
    });

    const logs = await prisma.activityLog.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
    });
    const statusChanged = logs.find((l) => l.type === 'status_changed');
    expect(statusChanged).toBeDefined();
    expect(statusChanged?.message).toContain('active');
    expect(statusChanged?.message).toContain('archived');
  });
});

describe('projectService.deleteProject', () => {
  let projectId: string;

  beforeEach(async () => {
    const project = await projectService.createProject(user.id, {
      name: 'Delete Me',
      leadName: 'Test Lead',
    });
    projectId = project.id as string;
  });

  it('deletes project and cascades activity logs', async () => {
    await projectService.deleteProject(projectId);

    const found = await prisma.project.findUnique({ where: { id: projectId } });
    expect(found).toBeNull();

    const logs = await prisma.activityLog.count({ where: { projectId } });
    expect(logs).toBe(0);
  });

  it('throws AppError 404 for non-existent project', async () => {
    await expect(
      projectService.deleteProject(generateToken()),
    ).rejects.toMatchObject({
      statusCode: 404,
      code: 'NOT_FOUND',
    });
  });
});
