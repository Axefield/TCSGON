/**
 * AppShell component tests.
 *
 * @see docs/plans/phase-1-core-infrastructure.md §8, §10, §34
 */
import { render, screen } from '@testing-library/react';
import { Provider as ReduxProvider } from 'react-redux';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it } from 'vitest';

import { store as appStore } from '@/store';

import { AppShell } from './AppShell';

describe('AppShell', () => {
  it('renders skip link', () => {
    render(
      <ReduxProvider store={appStore}>
        <MemoryRouter>
          <Routes>
            <Route element={<AppShell />}>
              <Route index element={<div>Content</div>} />
            </Route>
          </Routes>
        </MemoryRouter>
      </ReduxProvider>,
    );
    expect(screen.getByRole('link', { name: /skip to content/i })).toBeInTheDocument();
  });

  it('renders main content area with id for skip-link target', () => {
    render(
      <ReduxProvider store={appStore}>
        <MemoryRouter initialEntries={['/']}>
          <Routes>
            <Route element={<AppShell />}>
              <Route index element={<div data-testid="page-content">Hello</div>} />
            </Route>
          </Routes>
        </MemoryRouter>
      </ReduxProvider>,
    );
    const main = document.getElementById('main-content');
    expect(main).toBeInTheDocument();
    expect(screen.getByTestId('page-content')).toBeInTheDocument();
  });

  it('renders toast region', () => {
    render(
      <ReduxProvider store={appStore}>
        <MemoryRouter>
          <Routes>
            <Route element={<AppShell />}>
              <Route index element={<div>Content</div>} />
            </Route>
          </Routes>
        </MemoryRouter>
      </ReduxProvider>,
    );
    expect(screen.getByLabelText('Notifications')).toBeInTheDocument();
    expect(screen.getByLabelText('Error notifications')).toBeInTheDocument();
  });

  it('renders sidebar aside element', () => {
    render(
      <ReduxProvider store={appStore}>
        <MemoryRouter>
          <Routes>
            <Route element={<AppShell />}>
              <Route index element={<div>Content</div>} />
            </Route>
          </Routes>
        </MemoryRouter>
      </ReduxProvider>,
    );
    expect(screen.getByRole('complementary')).toBeInTheDocument();
  });
});
