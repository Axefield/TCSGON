/**
 * Notification preferences service.
 *
 * @see docs/plans/phase-5-settings.md
 */
import type { NotificationPreference } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { v4 as uuid } from 'uuid';
import { AppError } from '../types/index.js';

export interface UpdateNotificationInput {
  emailNotifications?: boolean;
  pushNotifications?: boolean;
  inAppNotifications?: boolean;
  dailyDigest?: boolean;
  marketingEmails?: boolean;
}

/**
 * Get notification preferences for a user.
 * Creates default preferences if none exist.
 */
export async function getNotificationPreferences(userId: string): Promise<NotificationPreference> {
  const existing = await prisma.notificationPreference.findUnique({
    where: { userId },
  });

  if (existing) return existing;

  // Create default preferences
  return prisma.notificationPreference.create({
    data: {
      id: uuid(),
      userId,
      emailNotifications: true,
      pushNotifications: true,
      inAppNotifications: true,
      dailyDigest: false,
      marketingEmails: false,
    },
  });
}

/**
 * Update notification preferences for a user.
 * Creates default preferences first if none exist, then applies updates.
 */
export async function updateNotificationPreferences(
  userId: string,
  input: UpdateNotificationInput,
): Promise<NotificationPreference> {
  // Ensure record exists before updating
  await getNotificationPreferences(userId);

  return prisma.notificationPreference.update({
    where: { userId },
    data: {
      ...(input.emailNotifications !== undefined ? { emailNotifications: input.emailNotifications } : {}),
      ...(input.pushNotifications !== undefined ? { pushNotifications: input.pushNotifications } : {}),
      ...(input.inAppNotifications !== undefined ? { inAppNotifications: input.inAppNotifications } : {}),
      ...(input.dailyDigest !== undefined ? { dailyDigest: input.dailyDigest } : {}),
      ...(input.marketingEmails !== undefined ? { marketingEmails: input.marketingEmails } : {}),
    },
  });
}
