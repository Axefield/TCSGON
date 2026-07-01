import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { vi } from 'vitest';

import { renderWithProviders, screen, userEvent, waitFor } from '@/test-utils';
import { mockFetchResponse } from '@/shared/test/mockFetch';

import { ProjectCreatePage } from './ProjectCreatePage';

describe('ProjectCreatePage', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('submits a new project and navigates to the detail page', async () => {
    mockFetchResponse({
      id: 'proj-999',
      name: 'Launch readiness',
      description: '',
      status: 'active',
      leadName: 'Jordan Lee',
      memberCount: 0,
      createdAt: new Date('2026-06-30T12:00:00Z').toISOString(),
      updatedAt: new Date('2026-06-30T12:00:00Z').toISOString(),
    }, { status: 201 });

    renderWithProviders(
      <MemoryRouter initialEntries={['/projects/new']}>
        <Routes>
          <Route path="/projects/new" element={<ProjectCreatePage />} />
          <Route path="/projects/:id" element={<div>Created detail page</div>} />
        </Routes>
      </MemoryRouter>,
    );

    await userEvent.type(screen.getByLabelText(/project name/i), 'Launch readiness');
    await userEvent.type(screen.getByLabelText(/lead name/i), 'Jordan Lee');
    await userEvent.click(screen.getByRole('button', { name: /create project/i }));

    await waitFor(() => {
      expect(screen.getByText('Created detail page')).toBeInTheDocument();
    });
  });
});
