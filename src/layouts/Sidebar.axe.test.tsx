/**
 * axe-core a11y audit — Sidebar
 *
 * Tests sidebar in open, pinned, and closed states.
 *
 * @phase Phase 6 — Testing & A11y Hardening
 */

import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import { testA11y } from '@/test-utils';

import { Sidebar } from './Sidebar';

describe('Sidebar a11y', () => {
  const onToggle = vi.fn();

  it('open sidebar has no a11y violations', async () => {
    const { container } = render(
      <MemoryRouter>
        <Sidebar state="open" onToggle={onToggle}>
          <nav>
            <a href="/dashboard">Dashboard</a>
            <a href="/settings">Settings</a>
          </nav>
        </Sidebar>
      </MemoryRouter>,
    );
    await testA11y(container);
  });

  it('pinned sidebar has no a11y violations', async () => {
    const { container } = render(
      <MemoryRouter>
        <Sidebar state="pinned" onToggle={onToggle}>
          <nav>
            <a href="/dashboard">Dashboard</a>
            <a href="/settings">Settings</a>
          </nav>
        </Sidebar>
      </MemoryRouter>,
    );
    await testA11y(container);
  });

  it('closed sidebar has no a11y violations', async () => {
    const { container } = render(
      <MemoryRouter>
        <Sidebar state="closed" onToggle={onToggle}>
          <nav>
            <a href="/dashboard">Dashboard</a>
          </nav>
        </Sidebar>
      </MemoryRouter>,
    );
    await testA11y(container);
  });
});
