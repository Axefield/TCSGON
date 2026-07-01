import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { vi } from 'vitest';

import { mockFetchResponse } from '@/shared/test/mockFetch';
import { renderWithProviders, screen, userEvent, waitFor } from '@/test-utils';

import { ProjectListPage } from './ProjectListPage';

const PROJECT_LIST_RESPONSE = {
  items: [
    {
      id: 'proj-005',
      name: 'Security Audit Q3',
      description: 'Third-party security audit for all production services.',
      status: 'active',
      leadName: 'Eve Johnson',
      memberCount: 4,
      createdAt: new Date('2026-06-01T07:00:00Z').toISOString(),
      updatedAt: new Date('2026-06-29T08:30:00Z').toISOString(),
    },
  ],
  total: 1,
  page: 1,
  pageSize: 3,
  totalPages: 1,
};

describe('ProjectListPage', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders projects and navigates to create page CTA', async () => {
    mockFetchResponse(PROJECT_LIST_RESPONSE);

    renderWithProviders(
      <MemoryRouter initialEntries={['/projects']}>
        <Routes>
          <Route path="/projects" element={<ProjectListPage />} />
          <Route path="/projects/new" element={<div>Create project page</div>} />
          <Route path="/projects/:id" element={<div>Project detail page</div>} />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /view projects proj-005/i })).toBeInTheDocument();
    });

    await userEvent.click(screen.getByRole('button', { name: /new project/i }));
    expect(screen.getByText('Create project page')).toBeInTheDocument();
  });
});
