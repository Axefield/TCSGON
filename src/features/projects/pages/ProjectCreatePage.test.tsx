import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { vi } from 'vitest';

import { RootErrorBoundary } from '@/routes/RootErrorBoundary';
import { buildFetchResponse, mockFetchResponse } from '@/shared/test/mockFetch';
import { renderWithProviders, screen, userEvent, waitFor } from '@/test-utils';

import { ProjectCreatePage } from './ProjectCreatePage';

function renderPage() {
  return renderWithProviders(
    <MemoryRouter initialEntries={['/projects/new']}>
      <Routes>
        <Route path="/projects/new" element={<ProjectCreatePage />} />
        <Route path="/projects/:id" element={<div>Created detail page</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('ProjectCreatePage', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders the create project form', () => {
    mockFetchResponse({});
    renderPage();
    expect(screen.getByRole('heading', { name: /create project/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/project name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/lead name/i)).toBeInTheDocument();
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

    renderPage();

    await userEvent.type(screen.getByLabelText(/project name/i), 'Launch readiness');
    await userEvent.type(screen.getByLabelText(/lead name/i), 'Jordan Lee');
    await userEvent.click(screen.getByRole('button', { name: /create project/i }));

    await waitFor(() => {
      expect(screen.getByText('Created detail page')).toBeInTheDocument();
    });
  });

  it('shows error display on API failure', async () => {
    vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(buildFetchResponse(null, { status: 500 }))
      .mockResolvedValueOnce(buildFetchResponse(null, { status: 500 }));

    renderPage();

    await userEvent.type(screen.getByLabelText(/project name/i), 'Failing project');
    await userEvent.type(screen.getByLabelText(/lead name/i), 'Tester');
    await userEvent.click(screen.getByRole('button', { name: /create project/i }));

    await waitFor(() => {
      expect(screen.getByText(/failed to create project/i)).toBeInTheDocument();
    });
  });

  // ── Error boundary ─────────────────────────────────────────────

  it('shows error boundary fallback when a child component crashes', () => {
    const ThrowingChild = () => {
      throw new Error('CreateProject render crash');
    };

    renderWithProviders(
      <RootErrorBoundary>
        <ThrowingChild />
      </RootErrorBoundary>,
    );

    expect(screen.getByRole('heading', { name: /something went wrong/i })).toBeInTheDocument();
    expect(screen.getByText(/createproject render crash/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
  });
});
