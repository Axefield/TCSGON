import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { OptimizedImage } from './OptimizedImage';

describe('OptimizedImage', () => {
  const defaultProps = {
    src: '/assets/hero',
    alt: 'Hero banner',
    widths: [480, 768, 1024] as const,
    sizes: { '(max-width: 768px)': '100vw', default: '80vw' },
  };

  it('renders a picture element', () => {
    const { container } = render(<OptimizedImage {...defaultProps} />);
    const picture = container.querySelector('picture');
    expect(picture).toBeInTheDocument();
  });

  it('renders three source elements (avif, webp, jpeg)', () => {
    const { container } = render(<OptimizedImage {...defaultProps} />);
    const sources = container.querySelectorAll('source');
    expect(sources).toHaveLength(3);
    expect(sources[0]).toHaveAttribute('type', 'image/avif');
    expect(sources[1]).toHaveAttribute('type', 'image/webp');
    expect(sources[2]).toHaveAttribute('type', 'image/jpeg');
  });

  it('renders a fallback img element', () => {
    const { container } = render(<OptimizedImage {...defaultProps} />);
    const img = container.querySelector('img');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('alt', 'Hero banner');
  });

  it('generates correct srcset values for each format', () => {
    const { container } = render(<OptimizedImage {...defaultProps} />);
    const sources = container.querySelectorAll('source');

    const avifSrcset = sources[0]?.getAttribute('srcset');
    expect(avifSrcset).toContain('/assets/hero-480w.avif 480w');
    expect(avifSrcset).toContain('/assets/hero-768w.avif 768w');
    expect(avifSrcset).toContain('/assets/hero-1024w.avif 1024w');

    const webpSrcset = sources[1]?.getAttribute('srcset');
    expect(webpSrcset).toContain('/assets/hero-480w.webp 480w');

    const jpegSrcset = sources[2]?.getAttribute('srcset');
    expect(jpegSrcset).toContain('/assets/hero-480w.jpg 480w');
  });

  it('generates correct sizes attribute', () => {
    const { container } = render(<OptimizedImage {...defaultProps} />);
    const img = container.querySelector('img');
    expect(img).toHaveAttribute(
      'sizes',
      '(max-width: 768px) 100vw, 80vw',
    );
  });

  it('fallback img src uses the first width', () => {
    const { container } = render(<OptimizedImage {...defaultProps} />);
    const img = container.querySelector('img');
    expect(img).toHaveAttribute('src', '/assets/hero-480w.jpg');
  });

  it('applies className to picture element', () => {
    const { container } = render(
      <OptimizedImage {...defaultProps} className="custom" />,
    );
    const picture = container.querySelector('picture');
    expect(picture).toHaveClass('custom');
  });

  it('uses lazy loading by default', () => {
    const { container } = render(<OptimizedImage {...defaultProps} />);
    const img = container.querySelector('img');
    expect(img).toHaveAttribute('loading', 'lazy');
  });

  it('accepts eager loading', () => {
    const { container } = render(
      <OptimizedImage {...defaultProps} loading="eager" />,
    );
    const img = container.querySelector('img');
    expect(img).toHaveAttribute('loading', 'eager');
  });

  it('renders an empty sizes attr for empty breakpoints', () => {
    const { container } = render(
      <OptimizedImage {...defaultProps} sizes={{}} />,
    );
    const img = container.querySelector('img');
    expect(img).toHaveAttribute('sizes', '');
  });

  it('renders decorative image with empty alt', () => {
    const { container } = render(<OptimizedImage {...defaultProps} alt="" />);
    const img = container.querySelector('img');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('alt', '');
  });
});
