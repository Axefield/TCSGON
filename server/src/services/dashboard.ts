/**
 * Dashboard service — aggregate statistics for the dashboard view.
 *
 * Computes project counts, completion rate, and recent activity.
 * `teamMembers` returns 0 until a ProjectMember model is introduced.
 *
 * @see docs/plans/phase-4-server-endpoints.md §7
 */
import { prisma } from '../lib/prisma.js';

// ─── Types ───────────────────────────────────────────────────────────

export interface DashboardStatsResult {
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  teamMembers: number;
  completionRate: number;
  recentActivity: Array<{
    id: string;
    type: string;
    message: string;
    createdAt: string;
    projectId: string;
  }>;
}

// ─── Service methods ─────────────────────────────────────────────────

/**
 * Aggregate dashboard statistics.
 *
 * Runs all queries in parallel for performance.
 * `teamMembers` is hardcoded to 0 — no ProjectMember model exists yet.
 */
export async function getStats(): Promise<DashboardStatsResult> {
  const [totalProjects, activeProjects, completedProjects, recentActivity] =
    await Promise.all([
      prisma.project.count(),
      prisma.project.count({ where: { status: 'active' } }),
      prisma.project.count({ where: { status: 'completed' } }),
      prisma.activityLog.findMany({
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
    ]);

  return {
    totalProjects,
    activeProjects,
    completedProjects,
    teamMembers: 0,
    completionRate:
      totalProjects > 0
        ? Math.round((completedProjects / totalProjects) * 100)
        : 0,
    recentActivity: recentActivity.map((log) => ({
      id: log.id,
      type: log.type,
      message: log.message,
      createdAt: log.createdAt.toISOString(),
      projectId: log.projectId,
    })),
  };
}
