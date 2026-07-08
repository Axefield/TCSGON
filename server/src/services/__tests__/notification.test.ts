import { describe, it, expect, beforeEach } from 'vitest';
import * as notificationService from '../notification.js';
import * as userService from '../user.js';
import { prisma } from '../../lib/prisma.js';

let userId: string;

beforeEach(async () => {
  await prisma.notificationPreference.deleteMany();
  await prisma.user.deleteMany();

  const user = await userService.createUser({
    name: 'Alice',
    email: 'alice@test.com',
    password: 'SecurePass1',
  });
  userId = user.id;
});

describe('notificationService.getNotificationPreferences', () => {
  it('creates and returns default preferences when none exist', async () => {
    const prefs = await notificationService.getNotificationPreferences(userId);

    expect(prefs).toBeDefined();
    expect(prefs.userId).toBe(userId);
    expect(prefs.emailNotifications).toBe(true);
    expect(prefs.pushNotifications).toBe(true);
    expect(prefs.inAppNotifications).toBe(true);
    expect(prefs.dailyDigest).toBe(false);
    expect(prefs.marketingEmails).toBe(false);
  });

  it('returns existing preferences without creating duplicates', async () => {
    const first = await notificationService.getNotificationPreferences(userId);
    const second = await notificationService.getNotificationPreferences(userId);

    expect(second.id).toBe(first.id);
    expect(second.userId).toBe(first.userId);
  });

  it('returns preferences with the same values on repeated calls', async () => {
    await notificationService.getNotificationPreferences(userId);
    // Update preferences directly in the database to confirm fetch returns persisted state
    await prisma.notificationPreference.update({
      where: { userId },
      data: { emailNotifications: false },
    });

    const afterDbUpdate = await notificationService.getNotificationPreferences(userId);
    expect(afterDbUpdate.emailNotifications).toBe(false);
  });

  it('throws a foreign key error for a userId that does not exist', async () => {
    const fakeId = '00000000-0000-0000-0000-000000000001';

    await expect(
      notificationService.getNotificationPreferences(fakeId),
    ).rejects.toThrow();
  });
});

describe('notificationService.updateNotificationPreferences', () => {
  it('updates all specified fields', async () => {
    // Create defaults first
    await notificationService.getNotificationPreferences(userId);

    const updated = await notificationService.updateNotificationPreferences(userId, {
      emailNotifications: false,
      pushNotifications: false,
      inAppNotifications: false,
      dailyDigest: true,
      marketingEmails: true,
    });

    expect(updated.emailNotifications).toBe(false);
    expect(updated.pushNotifications).toBe(false);
    expect(updated.inAppNotifications).toBe(false);
    expect(updated.dailyDigest).toBe(true);
    expect(updated.marketingEmails).toBe(true);
  });

  it('partially updates only the provided fields', async () => {
    await notificationService.getNotificationPreferences(userId);

    const updated = await notificationService.updateNotificationPreferences(userId, {
      emailNotifications: false,
    });

    expect(updated.emailNotifications).toBe(false);
    // All other fields should retain their defaults
    expect(updated.pushNotifications).toBe(true);
    expect(updated.inAppNotifications).toBe(true);
    expect(updated.dailyDigest).toBe(false);
    expect(updated.marketingEmails).toBe(false);
  });

  it('creates default preferences then applies update when none exist', async () => {
    const updated = await notificationService.updateNotificationPreferences(userId, {
      dailyDigest: true,
    });

    expect(updated.dailyDigest).toBe(true);
    expect(updated.emailNotifications).toBe(true);
    expect(updated.pushNotifications).toBe(true);
    expect(updated.inAppNotifications).toBe(true);
    expect(updated.marketingEmails).toBe(false);
  });

  it('returns the full updated preference record', async () => {
    await notificationService.getNotificationPreferences(userId);

    const updated = await notificationService.updateNotificationPreferences(userId, {
      marketingEmails: true,
    });

    expect(updated.id).toBeDefined();
    expect(updated.userId).toBe(userId);
    expect(updated.marketingEmails).toBe(true);
    expect(updated.updatedAt).toBeInstanceOf(Date);
  });

  it('persists updates to the database', async () => {
    await notificationService.getNotificationPreferences(userId);

    await notificationService.updateNotificationPreferences(userId, {
      pushNotifications: false,
      inAppNotifications: false,
    });

    const stored = await prisma.notificationPreference.findUnique({
      where: { userId },
    });
    expect(stored).not.toBeNull();
    expect(stored!.pushNotifications).toBe(false);
    expect(stored!.inAppNotifications).toBe(false);
    expect(stored!.emailNotifications).toBe(true);
  });

  it('allows toggling values back and forth', async () => {
    await notificationService.getNotificationPreferences(userId);

    const first = await notificationService.updateNotificationPreferences(userId, {
      dailyDigest: true,
    });
    expect(first.dailyDigest).toBe(true);

    const second = await notificationService.updateNotificationPreferences(userId, {
      dailyDigest: false,
    });
    expect(second.dailyDigest).toBe(false);
  });

  it('throws for a userId that does not exist', async () => {
    const fakeId = '00000000-0000-0000-0000-000000000001';

    await expect(
      notificationService.updateNotificationPreferences(fakeId, {
        emailNotifications: false,
      }),
    ).rejects.toThrow();
  });
});
