/**
 * axe-core a11y audit — ProjectListPage
 *
 * Provides mocked API data so the populated project list (table, pagination)
 * is audited, not just the loading skeleton or error state.
 *
 * @phase Phase 6 — Testing & A11y Hardening
 */

import { screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { buildFetchResponse } from '@/shared/test/mockFetch';
import { testA11y, renderWithProviders } from '@/test-utils';

import { ProjectListPage } from './ProjectListPage';

const PROJECTS_RESPONSE = {
  items: [
    {
      id: 'proj-001',
      name: 'Mobile App Redesign',
      description: 'Complete overhaul of the mobile application UI and UX.',
      status: 'active',
      leadName: 'Alice Chen',
      memberCount: 6,
      createdAt: '2026-06-01T08:00:00Z',
      updatedAt: '2026-06-15T10:30:00Z',
    },
    {
      id: 'proj-002',
      name: 'API Gateway Migration',
      description: 'Migrate from legacy API gateway to Kong.',
      status: 'active',
      leadName: 'Bob Smith',
      memberCount: 4,
      createdAt: '2026-05-20T09:00:00Z',
      updatedAt: '2026-06-14T14:00:00Z',
    },
  ],
  total: 2,
  page: 1,
  pageSize: 3,
  totalPages: 1,
};

const EMPTY_RESPONSE = {
  items: [],
  total: 0,
  page: 1,
  pageSize: 3,
  totalPages: 1,
};

function renderPage(initialEntries = ['/projects']) {
  return renderWithProviders(
    <MemoryRouter initialEntries={initialEntries}>
      <Routes>
        <Route path="/projects" element={<ProjectListPage />} />
        <Route path="/projects/new" element={<div>Create project page</div>} />
        <Route path="/projects/:id" element={<div>Project detail page</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('ProjectListPage a11y', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('project list with populated data has no a11y violations', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      buildFetchResponse(PROJECTS_RESPONSE),
    );

    const { container } = renderPage();

    // Wait for the project table to render before auditing
    expect(await screen.findByText('Mobile App Redesign')).toBeInTheDocument();
    expect(screen.getByText('API Gateway Migration')).toBeInTheDocument();

    await testA11y(container);
  });

  it('project list with empty state has no a11y violations', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      buildFetchResponse(EMPTY_RESPONSE),
    );

    const { container } = renderPage();

    // Wait for the empty state to render
    expect(
      await screen.findByText(/no projects match these filters/i),
    ).toBeInTheDocument();

    await testA11y(container);
  });

  it('project list with page 2 query param has no a11y violations', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      buildFetchResponse(PROJECTS_RESPONSE),
    );

    const { container } = renderPage(['/projects?page=2']);

    // Wait for data to render
    expect(await screen.findByText('Mobile App Redesign')).toBeInTheDocument();

    await testA11y(container);
  });
});
