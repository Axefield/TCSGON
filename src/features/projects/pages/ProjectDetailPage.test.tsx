import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { vi } from 'vitest';

import { renderWithProviders, screen, waitFor } from '@/test-utils';
import { mockFetchResponse } from '@/shared/test/mockFetch';

import { ProjectDetailPage } from './ProjectDetailPage';

const PROJECT_DETAIL = {
  id: 'proj-001',
  name: 'Mobile App Redesign',
  description: 'Redesign the mobile application for better UX and performance.',
  status: 'active',
  leadName: 'Alice Chen',
  memberCount: 5,
  createdAt: new Date('2026-01-15T08:00:00Z').toISOString(),
  updatedAt: new Date('2026-06-28T14:30:00Z').toISOString(),
};

describe('ProjectDetailPage', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders project detail data', async () => {
    mockFetchResponse(PROJECT_DETAIL);

    renderWithProviders(
      <MemoryRouter initialEntries={['/projects/proj-001']}>
        <Routes>
          <Route path="/projects/:id" element={<ProjectDetailPage />} />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /mobile app redesign/i })).toBeInTheDocument();
    });

    expect(screen.getByText(/alice chen/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /delete project/i })).toBeInTheDocument();
  });
});
