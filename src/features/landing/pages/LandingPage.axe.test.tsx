/**
 * axe-core a11y audit — LandingPage.
 *
 * The hero and features sections use semantic HTML, proper heading hierarchy,
 * and labelled landmarks. Test both the unauthenticated render and the
 * authenticated redirect path.
 */
import { screen } from '@testing-library/react';

import { renderWithProviders, testA11y } from '@/test-utils';

import { LandingPage } from './LandingPage';

describe('LandingPage a11y', () => {
  it('default landing page has no a11y violations', async () => {
    const { container } = renderWithProviders(<LandingPage />);

    // Verify key landmarks are present before running axe
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();

    await testA11y(container);
  });

  it('features section has no a11y violations', async () => {
    const { container } = renderWithProviders(<LandingPage />);

    // Wait for features section to render
    expect(screen.getByRole('heading', { level: 2, name: /everything you need/i })).toBeInTheDocument();

    await testA11y(container);
  });
});
