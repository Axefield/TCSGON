/**
 * axe-core a11y audit — AppShell
 *
 * AppShell composes SkipLink, SessionCheck, TopBar, Outlet, ToastRegion.
 * Requires both Redux and Router context. The outlet child content uses
 * a <div> rather than <main> to avoid nested main landmark violations.
 *
 * @phase Phase 6 — Testing & A11y Hardening
 */

import { Route, Routes } from 'react-router-dom';

import { testA11y } from '@/test-utils';
import { renderWithProviders } from '@/test-utils';

import { AppShell } from './AppShell';

describe('AppShell a11y', () => {
  it('default shell with dashboard outlet has no a11y violations', async () => {
    const { container } = renderWithProviders(
      <Routes>
        <Route element={<AppShell />}>
          <Route
            index
            element={<div><h1>Dashboard</h1></div>}
          />
        </Route>
      </Routes>,
      { initialEntries: ['/'] },
    );
    await testA11y(container);
  });
});
