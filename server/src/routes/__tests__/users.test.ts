import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../../app.js';
import { prisma } from '../../lib/prisma.js';
import { createAuthenticatedUser } from '../../test-utils.js';

beforeEach(async () => {
  await prisma.notificationPreference.deleteMany();
  await prisma.passwordResetToken.deleteMany();
  await prisma.session.deleteMany();
  await prisma.user.deleteMany();
});

describe('GET /api/users/me', () => {
  it('returns current user', async () => {
    const { token } = await createAuthenticatedUser();

    const res = await request(app)
      .get('/api/users/me')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body).toBeDefined();
    expect(res.body).not.toHaveProperty('passwordHash');
    expect(res.body.name).toBe('Test User');
  });

  it('returns current user with avatarUrl field', async () => {
    const { token, user } = await createAuthenticatedUser();
    // Set avatar URL
    await prisma.user.update({
      where: { id: user.id },
      data: { avatarUrl: 'https://example.com/avatar.png' },
    });

    const res = await request(app)
      .get('/api/users/me')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body.avatarUrl).toBe('https://example.com/avatar.png');
  });

  it('returns 401 without auth', async () => {
    await request(app).get('/api/users/me').expect(401);
  });
});

describe('PUT /api/users/me', () => {
  it('updates user name', async () => {
    const { token } = await createAuthenticatedUser();

    const res = await request(app)
      .put('/api/users/me')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Updated Name' })
      .expect(200);

    expect(res.body.name).toBe('Updated Name');
  });

  it('updates avatar URL', async () => {
    const { token } = await createAuthenticatedUser();

    const res = await request(app)
      .put('/api/users/me')
      .set('Authorization', `Bearer ${token}`)
      .send({ avatarUrl: 'https://example.com/avatar.png' })
      .expect(200);

    expect(res.body.avatarUrl).toBe('https://example.com/avatar.png');
  });

  it('clears avatar URL when set to null', async () => {
    const { token, user } = await createAuthenticatedUser();
    // Set avatar first
    await prisma.user.update({
      where: { id: user.id },
      data: { avatarUrl: 'https://example.com/avatar.png' },
    });

    const res = await request(app)
      .put('/api/users/me')
      .set('Authorization', `Bearer ${token}`)
      .send({ avatarUrl: null })
      .expect(200);

    expect(res.body.avatarUrl).toBeNull();
  });

  it('returns 400 for invalid avatar URL', async () => {
    const { token } = await createAuthenticatedUser();

    const res = await request(app)
      .put('/api/users/me')
      .set('Authorization', `Bearer ${token}`)
      .send({ avatarUrl: 'not-a-url' })
      .expect(400);

    expect(res.body.error).toBeDefined();
  });

  it('returns 400 for invalid data', async () => {
    const { token } = await createAuthenticatedUser();

    const res = await request(app)
      .put('/api/users/me')
      .set('Authorization', `Bearer ${token}`)
      .send({ email: 'not-an-email' })
      .expect(400);

    expect(res.body.error).toBeDefined();
  });

  it('returns 401 without auth', async () => {
    await request(app).put('/api/users/me').send({ name: 'Hacker' }).expect(401);
  });
});

describe('PUT /api/users/me/password', () => {
  it('changes password with correct current password', async () => {
    const { token } = await createAuthenticatedUser();

    const res = await request(app)
      .put('/api/users/me/password')
      .set('Authorization', `Bearer ${token}`)
      .send({ currentPassword: 'Password123!', newPassword: 'NewPassword456!' })
      .expect(200);

    expect(res.body.message).toBe('Password changed successfully.');
  });

  it('returns 401 for incorrect current password', async () => {
    const { token } = await createAuthenticatedUser();

    const res = await request(app)
      .put('/api/users/me/password')
      .set('Authorization', `Bearer ${token}`)
      .send({ currentPassword: 'wrongpass', newPassword: 'NewPassword456!' })
      .expect(401);

    expect(res.body.error).toBeDefined();
  });

  it('returns 400 for weak new password', async () => {
    const { token } = await createAuthenticatedUser();

    const res = await request(app)
      .put('/api/users/me/password')
      .set('Authorization', `Bearer ${token}`)
      .send({ currentPassword: 'Password123!', newPassword: 'short' })
      .expect(400);

    expect(res.body.error).toBeDefined();
  });

  it('returns 401 without auth', async () => {
    await request(app)
      .put('/api/users/me/password')
      .send({ currentPassword: 'x', newPassword: 'y' })
      .expect(401);
  });
});

// ════════════════════════════════════════════════════════════════════════
// Notification Preferences (Phase 5)
// ════════════════════════════════════════════════════════════════════════

describe('GET /api/users/me/notification-preferences', () => {
  it('returns notification preferences for authenticated user', async () => {
    const { token, user } = await createAuthenticatedUser();

    const res = await request(app)
      .get('/api/users/me/notification-preferences')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body).toBeDefined();
    expect(res.body.userId).toBe(user.id);
    expect(res.body.emailNotifications).toBe(true);
    expect(res.body.pushNotifications).toBe(true);
    expect(res.body.inAppNotifications).toBe(true);
    expect(res.body.dailyDigest).toBe(false);
    expect(res.body.marketingEmails).toBe(false);
  });

  it('returns 401 without auth', async () => {
    await request(app)
      .get('/api/users/me/notification-preferences')
      .expect(401);
  });
});

describe('PUT /api/users/me/notification-preferences', () => {
  it('updates notification preferences', async () => {
    const { token } = await createAuthenticatedUser();

    const res = await request(app)
      .put('/api/users/me/notification-preferences')
      .set('Authorization', `Bearer ${token}`)
      .send({ emailNotifications: false, dailyDigest: true })
      .expect(200);

    expect(res.body.emailNotifications).toBe(false);
    expect(res.body.dailyDigest).toBe(true);
    expect(res.body.pushNotifications).toBe(true); // unchanged
  });

  it('returns 400 for invalid field', async () => {
    const { token } = await createAuthenticatedUser();

    const res = await request(app)
      .put('/api/users/me/notification-preferences')
      .set('Authorization', `Bearer ${token}`)
      .send({ emailNotifications: 'not-a-boolean' })
      .expect(400);

    expect(res.body.error).toBeDefined();
  });

  it('returns 401 without auth', async () => {
    await request(app)
      .put('/api/users/me/notification-preferences')
      .send({ emailNotifications: false })
      .expect(401);
  });
});
