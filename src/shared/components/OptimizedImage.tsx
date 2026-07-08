/**
 * OptimizedImage — responsive, format‑negotiated image via `<picture>`.
 *
 * Automatically generates AVIF, WebP, and JPEG fallback `<source>` elements
 * from a single base URL and set of widths. The browser picks the best
 * supported format and resolution.
 *
 * @example
 *   <OptimizedImage
 *     src="/assets/hero"
 *     alt="Hero banner"
 *     widths={[480, 768, 1024, 1920]}
 *     sizes={{
 *       '(max-width: 768px)': '100vw',
 *       default: '80vw',
 *     }}
 *     loading="eager"
 *   />
 */
import { type ReactElement } from 'react';

import { buildSrcSet, buildSizes } from '@/shared/utils/image';

export interface OptimizedImageProps {
  /**
   * Base URL without width suffix or extension.
   * Example: `/assets/hero` → generates `/assets/hero-480w.avif`, etc.
   */
  readonly src: string;

  /** Alt text for the image (required for accessibility). */
  readonly alt: string;

  /** Image widths to include in srcset. */
  readonly widths: ReadonlyArray<number>;

  /**
   * Breakpoint map for the `sizes` attribute.
   * Include a `default` key for the fallback value.
   * Example: `{ '(max-width: 768px)': '100vw', default: '80vw' }`.
   */
  readonly sizes: Readonly<Record<string, string>>;

  readonly className?: string | undefined;

  /** Loading strategy. Default: `'lazy'`. */
  readonly loading?: 'lazy' | 'eager' | undefined;
}

/**
 * Renders a `<picture>` element with AVIF, WebP, and JPEG fallback sources
 * for optimal format negotiation and responsive resolution selection.
 */
export function OptimizedImage({
  src,
  alt,
  widths,
  sizes: sizesBreakpoints,
  className,
  loading = 'lazy',
}: OptimizedImageProps): ReactElement {
  const sizesAttr = buildSizes(sizesBreakpoints);
  const avifSrcSet = buildSrcSet(widths, src, '.avif');
  const webpSrcSet = buildSrcSet(widths, src, '.webp');
  const jpgSrcSet = buildSrcSet(widths, src, '.jpg');
  const firstWidth = widths[0];
  const fallbackSrc = firstWidth !== undefined
    ? `${src}-${String(firstWidth)}w.jpg`
    : `${src}.jpg`;

  return (
    <picture className={className}>
      <source srcSet={avifSrcSet} sizes={sizesAttr} type="image/avif" />
      <source srcSet={webpSrcSet} sizes={sizesAttr} type="image/webp" />
      <source srcSet={jpgSrcSet} sizes={sizesAttr} type="image/jpeg" />
      <img
        src={fallbackSrc}
        srcSet={jpgSrcSet}
        sizes={sizesAttr}
        alt={alt}
        loading={loading}
      />
    </picture>
  );
}
