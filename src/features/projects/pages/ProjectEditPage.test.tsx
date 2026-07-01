import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { vi } from 'vitest';

import { renderWithProviders, screen, userEvent, waitFor } from '@/test-utils';
import { buildFetchResponse } from '@/shared/test/mockFetch';

import { ProjectEditPage } from './ProjectEditPage';

describe('ProjectEditPage', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('loads current project values and saves changes', async () => {
    vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(
        buildFetchResponse({
          id: 'proj-001',
          name: 'Mobile App Redesign',
          description: 'Redesign the mobile application for better UX and performance.',
          status: 'active',
          leadName: 'Alice Chen',
          memberCount: 5,
          createdAt: new Date('2026-01-15T08:00:00Z').toISOString(),
          updatedAt: new Date('2026-06-28T14:30:00Z').toISOString(),
        }),
      )
      .mockResolvedValueOnce(
        buildFetchResponse({
          id: 'proj-001',
          name: 'Mobile App Refresh',
          description: 'Redesign the mobile application for better UX and performance.',
          status: 'active',
          leadName: 'Alice Chen',
          memberCount: 5,
          createdAt: new Date('2026-01-15T08:00:00Z').toISOString(),
          updatedAt: new Date('2026-06-30T12:00:00Z').toISOString(),
        }),
      );

    renderWithProviders(
      <MemoryRouter initialEntries={['/projects/proj-001/edit']}>
        <Routes>
          <Route path="/projects/:id/edit" element={<ProjectEditPage />} />
          <Route path="/projects/:id" element={<div>Updated detail page</div>} />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByDisplayValue('Mobile App Redesign')).toBeInTheDocument();
    });

    const nameInput = screen.getByLabelText(/project name/i);
    await userEvent.clear(nameInput);
    await userEvent.type(nameInput, 'Mobile App Refresh');
    await userEvent.click(screen.getByRole('button', { name: /save changes/i }));

    await waitFor(() => {
      expect(screen.getByText('Updated detail page')).toBeInTheDocument();
    });
  });
});
