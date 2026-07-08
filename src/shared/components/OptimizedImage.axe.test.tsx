/**
 * axe-core a11y audit — OptimizedImage
 *
 * OptimizedImage renders a `<picture>` element with AVIF, WebP, and JPEG
 * fallback `<source>` children and a visible `<img>`. The `alt` attribute
 * is required. Tests cover lazy/eager loading, single/multi-width srcsets,
 * decorative images, and custom classNames.
 *
 * All image src URLs are synthetic — no real network requests occur.
 *
 * @phase Phase 7 — Design System & Feature Hardening
 */
import { render } from '@testing-library/react';

import { testA11y } from '@/test-utils';

import { OptimizedImage } from './OptimizedImage';

const defaultProps = {
  src: '/assets/hero',
  alt: 'Hero banner',
  widths: [480, 768, 1024, 1920],
  sizes: { '(max-width: 768px)': '100vw', default: '80vw' },
};

describe('OptimizedImage a11y', () => {
  it('default lazy-loaded image has no a11y violations', async () => {
    const { container } = render(<OptimizedImage {...defaultProps} />);
    await testA11y(container);
  });

  it('eager-loaded image has no a11y violations', async () => {
    const { container } = render(
      <OptimizedImage {...defaultProps} loading="eager" />,
    );
    await testA11y(container);
  });

  it('image with single width has no a11y violations', async () => {
    const { container } = render(
      <OptimizedImage
        src="/assets/icon"
        alt="Settings icon"
        widths={[64]}
        sizes={{ default: '64px' }}
      />,
    );
    await testA11y(container);
  });

  it('decorative image (empty alt) has no a11y violations', async () => {
    const { container } = render(
      <OptimizedImage
        src="/assets/divider"
        alt=""
        widths={[1024]}
        sizes={{ default: '100vw' }}
      />,
    );
    await testA11y(container);
  });

  it('image with custom className has no a11y violations', async () => {
    const { container } = render(
      <OptimizedImage {...defaultProps} className="hero-image" />,
    );
    await testA11y(container);
  });

  it('image with multiple breakpoints has no a11y violations', async () => {
    const { container } = render(
      <OptimizedImage
        src="/assets/photo"
        alt="Photo gallery"
        widths={[320, 640, 960, 1280, 1920]}
        sizes={{
          '(max-width: 480px)': '100vw',
          '(max-width: 768px)': '90vw',
          '(max-width: 1200px)': '60vw',
          default: '1200px',
        }}
      />,
    );
    await testA11y(container);
  });
});
