/**
 * Image utility helpers — pure, tree‑shakeable functions for responsive images.
 *
 * @remarks
 * These functions generate standard HTML `srcset` and `sizes` attribute values
 * and provide format negotiation logic. They have zero dependencies and no
 * side effects, making them safe to tree‑shake when unused.
 *
 * @example
 *   buildSrcSet([320, 640], '/img/photo', 'webp')
 *   // → '/img/photo-320w.webp 320w, /img/photo-640w.webp 640w'
 */

/**
 * Build a `srcset` attribute value from an array of pixel widths.
 *
 * @param widths  – Desired image widths in pixels (e.g. `[320, 640, 960]`)
 * @param baseUrl – Path prefix **without** width suffix or extension
 *                  (e.g. `/assets/hero`)
 * @param ext     – File extension including the leading dot (e.g. `.webp`)
 * @returns       – A `srcset` string (e.g. `"...320w, ...640w"`)
 */
export function buildSrcSet(
  widths: ReadonlyArray<number>,
  baseUrl: string,
  ext: string,
): string {
  return widths
    .map((w) => `${baseUrl}-${w}w${ext} ${w}w`)
    .join(', ');
}

/**
 * Build a `sizes` attribute value from a breakpoint map.
 *
 * @param breakpoints – Ordered map where keys are media conditions and values
 *                      are CSS lengths (e.g. `{ '(max-width: 768px)': '100vw' }`).
 *                      Include a `default` key for the fallback value.
 * @returns           – A `sizes` string (e.g. `"(max-width: 768px) 100vw, 50vw"`)
 */
export function buildSizes(
  breakpoints: Readonly<Record<string, string>>,
): string {
  const entries = Object.entries(breakpoints);
  return entries
    .map(([condition, size]) =>
      condition === 'default' ? size : `${condition} ${size}`,
    )
    .join(', ');
}

/**
 * Determine the optimal image format based on browser support signals.
 *
 * Priority: AVIF → WebP → fallback (JPEG/PNG).
 *
 * @param acceptsAvif – `true` if the runtime supports AVIF decoding.
 * @param acceptsWebp – `true` if the runtime supports WebP decoding.
 * @returns           – The preferred format extension (`'avif'`, `'webp'`, or
 *                      `'fallback'` for JPEG/PNG).
 */
export function getOptimalFormat(
  acceptsAvif: boolean,
  acceptsWebp: boolean,
): 'avif' | 'webp' | 'fallback' {
  if (acceptsAvif) return 'avif';
  if (acceptsWebp) return 'webp';
  return 'fallback';
}
