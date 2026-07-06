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

describe('GET /api/projects', () => {
  it('returns paginated list of projects for authenticated user', async () => {
    // Create 2 projects
    for (let i = 0; i < 2; i++) {
      await prisma.project.create({
        data: {
          id: generateToken(),
          name: `Route Project ${i + 1}`,
          description: '',
          status: 'active',
          leadName: 'Test Lead',
          memberCount: 0,
        },
      });
    }

    const res = await request(app)
      .get('/api/projects')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body.items.length).toBe(2);
    expect(res.body.total).toBe(2);
    expect(res.body.page).toBe(1);
    expect(res.body.pageSize).toBe(20);
  });

  it('respects page and pageSize query parameters', async () => {
    // Create 3 projects
    for (let i = 0; i < 3; i++) {
      await prisma.project.create({
        data: {
          id: generateToken(),
          name: `Paged Project ${i + 1}`,
          description: '',
          status: 'active',
          leadName: 'Test Lead',
          memberCount: 0,
        },
      });
    }

    const res = await request(app)
      .get('/api/projects?page=1&pageSize=2')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body.items.length).toBe(2);
    expect(res.body.total).toBe(3);
    expect(res.body.totalPages).toBe(2);
  });

  it('returns 401 without authentication', async () => {
    const res = await request(app)
      .get('/api/projects')
      .expect(401);

    expect(res.body.error).toBeDefined();
  });
});

describe('GET /api/projects/:id', () => {
  it('returns a project by ID', async () => {
    const created = await prisma.project.create({
      data: {
        id: generateToken(),
        name: 'Specific Project',
        description: 'A specific project',
        status: 'active',
        leadName: 'Specific Lead',
        memberCount: 3,
      },
    });

    const res = await request(app)
      .get(`/api/projects/${created.id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body.name).toBe('Specific Project');
    expect(res.body.leadName).toBe('Specific Lead');
    expect(res.body.memberCount).toBe(3);
  });

  it('returns 404 for non-existent project', async () => {
    const res = await request(app)
      .get(`/api/projects/${generateToken()}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(404);

    expect(res.body.error.code).toBe('NOT_FOUND');
  });
});

describe('POST /api/projects', () => {
  it('creates a project and returns 201', async () => {
    const res = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'New Project',
        description: 'Brand new project',
        status: 'active',
        leadName: 'New Lead',
      })
      .expect(201);

    expect(res.body.id).toBeTruthy();
    expect(res.body.name).toBe('New Project');
    expect(res.body.leadName).toBe('New Lead');
    expect(typeof res.body.createdAt).toBe('string');
  });

  it('returns 400 for invalid body (missing name)', async () => {
    const res = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${token}`)
      .send({})
      .expect(400);

    expect(res.body.error).toBeDefined();
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});

describe('PUT /api/projects/:id', () => {
  it('updates a project and returns it', async () => {
    const created = await prisma.project.create({
      data: {
        id: generateToken(),
        name: 'Before Update',
        description: '',
        status: 'active',
        leadName: 'Old Lead',
        memberCount: 0,
      },
    });

    const res = await request(app)
      .put(`/api/projects/${created.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'After Update', leadName: 'New Lead' })
      .expect(200);

    expect(res.body.name).toBe('After Update');
    expect(res.body.leadName).toBe('New Lead');
  });

  it('returns 404 for non-existent project', async () => {
    const res = await request(app)
      .put(`/api/projects/${generateToken()}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Ghost' })
      .expect(404);

    expect(res.body.error.code).toBe('NOT_FOUND');
  });
});

describe('DELETE /api/projects/:id', () => {
  it('soft-deletes a project and returns 204', async () => {
    const created = await prisma.project.create({
      data: {
        id: generateToken(),
        name: 'To Be Deleted',
        description: '',
        status: 'active',
        leadName: 'Delete Lead',
        memberCount: 0,
      },
    });

    await request(app)
      .delete(`/api/projects/${created.id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(204);

    // Verify soft-delete: project still exists but has deletedAt set
    const found = await prisma.project.findUnique({ where: { id: created.id } });
    expect(found).not.toBeNull();
    expect(found?.deletedAt).not.toBeNull();
    expect(found?.deletedAt).toBeInstanceOf(Date);
  });

  it('returns 404 for non-existent project', async () => {
    const res = await request(app)
      .delete(`/api/projects/${generateToken()}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(404);

    expect(res.body.error.code).toBe('NOT_FOUND');
  });

  it('returns 404 for already soft-deleted project', async () => {
    const created = await prisma.project.create({
      data: {
        id: generateToken(),
        name: 'Double Delete',
        description: '',
        status: 'active',
        leadName: 'Test Lead',
        memberCount: 0,
      },
    });

    // First delete
    await request(app)
      .delete(`/api/projects/${created.id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(204);

    // Second delete should 404
    const res = await request(app)
      .delete(`/api/projects/${created.id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(404);

    expect(res.body.error.code).toBe('NOT_FOUND');
  });
});
