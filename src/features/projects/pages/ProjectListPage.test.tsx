import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { vi } from 'vitest';

import { RootErrorBoundary } from '@/routes/RootErrorBoundary';
import { buildFetchResponse, mockFetchResponse } from '@/shared/test/mockFetch';
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

describe('ProjectListPage', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('shows heading and new project button on load', () => {
    mockFetchResponse(PROJECT_LIST_RESPONSE);

    renderPage();

    expect(screen.getByText('Project portfolio')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /new project/i })).toBeInTheDocument();
  });

  it('renders project list on success', async () => {
    mockFetchResponse(PROJECT_LIST_RESPONSE);

    renderPage();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /view projects proj-005/i })).toBeInTheDocument();
    });

    expect(screen.getByText('Security Audit Q3')).toBeInTheDocument();
    expect(screen.getByText(/lead:.*eve johnson/i)).toBeInTheDocument();
  });

  it('navigates to create project page', async () => {
    mockFetchResponse(PROJECT_LIST_RESPONSE);

    renderPage();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /view projects proj-005/i })).toBeInTheDocument();
    });

    await userEvent.click(screen.getByRole('button', { name: /new project/i }));
    expect(screen.getByText('Create project page')).toBeInTheDocument();
  });

  it('navigates to project detail on view button click', async () => {
    mockFetchResponse(PROJECT_LIST_RESPONSE);

    renderPage();

    await screen.findByRole('button', { name: /view projects proj-005/i });

    await userEvent.click(screen.getByRole('button', { name: /view projects proj-005/i }));
    expect(screen.getByText('Project detail page')).toBeInTheDocument();
  });

  it('shows empty state when no projects match', async () => {
    mockFetchResponse(EMPTY_RESPONSE);

    renderPage();

    await waitFor(() => {
      expect(screen.getByText(/no projects match these filters/i)).toBeInTheDocument();
    });

    expect(
      screen.getByRole('button', { name: /create project/i }),
    ).toBeInTheDocument();
  });

  it('shows error display on fetch failure', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      buildFetchResponse(null, { status: 500 }),
    );

    renderPage();

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    expect(screen.getByText(/failed to load projects/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
  });

  it('refetches when retry button is clicked', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    fetchSpy
      .mockResolvedValueOnce(buildFetchResponse(null, { status: 500 }))
      .mockResolvedValueOnce(buildFetchResponse(PROJECT_LIST_RESPONSE));

    renderPage();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
    });

    screen.getByRole('button', { name: /retry/i }).click();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /view projects proj-005/i })).toBeInTheDocument();
    });

    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });

  // ── Error boundary ─────────────────────────────────────────────

  it('shows error boundary fallback when a child component crashes', () => {
    const ThrowingChild = () => {
      throw new Error('ProjectList render crash');
    };

    renderWithProviders(
      <RootErrorBoundary>
        <ThrowingChild />
      </RootErrorBoundary>,
    );

    expect(screen.getByRole('heading', { name: /something went wrong/i })).toBeInTheDocument();
    expect(screen.getByText(/projectlist render crash/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
  });
});
