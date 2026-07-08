import { describe, expect, it } from 'vitest';

import { buildSrcSet, buildSizes, getOptimalFormat } from './image';

/* ── buildSrcSet ─────────────────────────────────────────────────── */

describe('buildSrcSet', () => {
  it('generates correct srcset for a single width', () => {
    const result = buildSrcSet([320], '/img/hero', '.webp');
    expect(result).toBe('/img/hero-320w.webp 320w');
  });

  it('generates correct srcset for multiple widths', () => {
    const result = buildSrcSet([320, 640, 960], '/img/hero', '.jpg');
    expect(result).toBe(
      '/img/hero-320w.jpg 320w, /img/hero-640w.jpg 640w, /img/hero-960w.jpg 960w',
    );
  });

  it('handles an empty widths array', () => {
    const result = buildSrcSet([], '/img/hero', '.png');
    expect(result).toBe('');
  });

  it('works with different extensions', () => {
    const result = buildSrcSet([480], '/assets/photo', '.avif');
    expect(result).toBe('/assets/photo-480w.avif 480w');
  });

  it('preserves special characters in baseUrl', () => {
    const result = buildSrcSet([200], '/img/project image', '.webp');
    expect(result).toBe('/img/project image-200w.webp 200w');
  });
});

/* ── buildSizes ──────────────────────────────────────────────────── */

describe('buildSizes', () => {
  it('generates sizes with default only', () => {
    const result = buildSizes({ default: '100vw' });
    expect(result).toBe('100vw');
  });

  it('generates sizes with one breakpoint and default', () => {
    const result = buildSizes({
      '(max-width: 768px)': '100vw',
      default: '50vw',
    });
    expect(result).toBe('(max-width: 768px) 100vw, 50vw');
  });

  it('generates sizes with multiple breakpoints and default', () => {
    const result = buildSizes({
      '(max-width: 480px)': '100vw',
      '(max-width: 1024px)': '50vw',
      default: '33vw',
    });
    expect(result).toBe(
      '(max-width: 480px) 100vw, (max-width: 1024px) 50vw, 33vw',
    );
  });

  it('handles an empty breakpoints map', () => {
    const result = buildSizes({});
    expect(result).toBe('');
  });

  it('treats "default" without condition prefix', () => {
    const result = buildSizes({ default: '300px' });
    expect(result).toBe('300px');
  });
});

/* ── getOptimalFormat ────────────────────────────────────────────── */

describe('getOptimalFormat', () => {
  it('returns avif when both avif and webp are supported', () => {
    expect(getOptimalFormat(true, true)).toBe('avif');
  });

  it('returns avif when only avif is supported', () => {
    expect(getOptimalFormat(true, false)).toBe('avif');
  });

  it('returns webp when only webp is supported', () => {
    expect(getOptimalFormat(false, true)).toBe('webp');
  });

  it('returns fallback when neither avif nor webp is supported', () => {
    expect(getOptimalFormat(false, false)).toBe('fallback');
  });
});
