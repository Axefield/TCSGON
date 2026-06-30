/**
 * MSW handlers for dashboard endpoints.
 *
 * @see docs/plans/phase-2-data-and-features.md §8.2
 */
import { http, HttpResponse } from 'msw';

const BASE = '/api/dashboard';

export const dashboardHandlers = [
  /** GET /api/dashboard/stats — aggregate metrics */
  http.get(`${BASE}/stats`, () => {
    return HttpResponse.json({
      totalProjects: 42,
      activeProjects: 18,
      teamMembers: 12,
      completionRate: 73.5,
      recentActivity: [
        {
          id: 'act-001',
          type: 'project_created',
          message: 'Mobile App Redesign project created',
          createdAt: new Date(Date.now() - 3_600_000).toISOString(),
          projectId: 'proj-001',
        },
        {
          id: 'act-002',
          type: 'status_changed',
          message: 'Q4 Roadmap moved to active',
          createdAt: new Date(Date.now() - 86_400_000).toISOString(),
          projectId: 'proj-002',
        },
        {
          id: 'act-003',
          type: 'project_updated',
          message: 'API Gateway docs updated',
          createdAt: new Date(Date.now() - 172_800_000).toISOString(),
          projectId: 'proj-003',
        },
      ],
    });
  }),
];
