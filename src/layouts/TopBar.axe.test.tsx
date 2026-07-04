/**
 * axe-core a11y audit — TopBar
 *
 * TopBar requires Redux (for useAuth) and Router (for useNavigate/Link).
 * We use renderWithProviders with initialEntries to provide router context.
 *
 * @phase Phase 6 — Testing & A11y Hardening
 */

import { testA11y } from '@/test-utils';
import { renderWithProviders } from '@/test-utils';

import { TopBar } from './TopBar';

describe('TopBar a11y', () => {
  it('default top bar has no a11y violations', async () => {
    const { container } = renderWithProviders(<TopBar />, {
      initialEntries: ['/'],
    });
    await testA11y(container);
  });

  it('top bar with custom title has no a11y violations', async () => {
    const { container } = renderWithProviders(<TopBar title="Reports" />, {
      initialEntries: ['/reports'],
    });
    await testA11y(container);
  });

  it('top bar with sidebar toggle has no a11y violations', async () => {
    const { container } = renderWithProviders(
      <TopBar isSidebarOpen onMenuClick={vi.fn()} />,
      { initialEntries: ['/'] },
    );
    await testA11y(container);
  });

  it('top bar with theme toggle has no a11y violations', async () => {
    const { container } = renderWithProviders(<TopBar onThemeToggle={vi.fn()} />, {
      initialEntries: ['/'],
    });
    await testA11y(container);
  });
});
