/**
 * Avatar — displays a user's profile picture, initials fallback, or generic icon.
 *
 * Pure presentational component using `img` for photos. Tracks load errors
 * internally via `useState`; falls back to initials derived from `name`, or
 * to a generic user icon when neither image nor name is available.
 *
 * @example
 *   <Avatar src="/photos/alice.jpg" alt="Alice Chen" name="Alice Chen" />
 *   <Avatar alt="Bob" name="Bob Smith" size="lg" />
 *   <Avatar alt="Unknown user" />
 */
import { useState } from 'react';

import styles from './Avatar.module.css';

export interface AvatarProps {
  /**
   * Image URL for the avatar photo.
   * When provided, attempts to load and display the image.
   * Falls back to initials or icon on error.
   */
  readonly src?: string | undefined;

  /**
   * Responsive `srcset` attribute for the avatar image. Use `buildSrcSet`
   * from `@/shared/utils/image` to generate. When provided, the browser
   * selects the best image size for the current viewport.
   */
  readonly srcSet?: string | undefined;

  /**
   * `sizes` attribute for the avatar image. Required when `srcSet` is used.
   * Describes the image's display width at different viewport sizes.
   * Example: `'(max-width: 640px) 100vw, 48px'`.
   */
  readonly sizes?: string | undefined;

  /**
   * Alt text for the image. REQUIRED for accessibility even when using
   * initials fallback. Describes who the avatar represents.
   */
  readonly alt: string;

  /**
   * User's full name. Used to derive initials (first letter of first and
   * last name). Example: "John Doe" → "JD". Empty/whitespace-only values
   * result in the fallback icon.
   */
  readonly name?: string | undefined;

  /** Size variant. Default: 'md' */
  readonly size?: 'sm' | 'md' | 'lg' | 'xl';

  /**
   * Loading strategy for the image.
   * - `'lazy'` (default): defers loading until near viewport.
   * - `'eager'`: loads immediately. Use for above-the-fold avatars (e.g.,
   *   the primary user avatar in the top bar) to avoid LCP regression.
   */
  readonly loading?: 'lazy' | 'eager';

  readonly className?: string;
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

export function Avatar({
  src,
  srcSet,
  sizes,
  alt,
  name,
  size = 'md',
  loading = 'lazy',
  className,
}: AvatarProps) {
  const [imgError, setImgError] = useState(false);
  const showImage = src !== undefined && !imgError;
  const trimmedName = name?.trim() ?? '';
  const initials = trimmedName ? getInitials(trimmedName) : '';

  const classes = [
    styles.avatar,
    styles[size],
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <span className={classes} role="img" aria-label={alt}>
      {showImage ? (
        <img
          key={src}
          src={src}
          srcSet={srcSet}
          sizes={sizes}
          alt={alt}
          loading={loading}
          className={styles.image}
          onError={() => { setImgError(true); }}
          onLoad={() => { setImgError(false); }}
        />
      ) : initials ? (
        <span className={styles.initials} aria-hidden="true">
          {initials}
        </span>
      ) : (
        <svg
          className={styles.fallbackIcon}
          viewBox="0 0 24 24"
          aria-hidden="true"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <circle cx="12" cy="8" r="4" />
          <path d="M4 22c0-4 4-7 8-7s8 3 8 7" />
        </svg>
      )}
    </span>
  );
}
