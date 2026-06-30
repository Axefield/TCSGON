/**
 * ErrorDisplay — accessible API error message with optional retry.
 *
 * @example
 *   <ErrorDisplay
 *     error={apiError}
 *     onRetry={handleRetry}
 *     title="Failed to load projects"
 *   />
 */
import type { ReactElement } from 'react';

import type { ApiError } from '@/shared/api/errors';
import { apiErrorMessage } from '@/shared/api/errors';

import styles from './ErrorDisplay.module.css';

export interface ErrorDisplayProps {
  readonly error: ApiError | null;
  readonly onRetry?: () => void;
  readonly title?: string;
}

export function ErrorDisplay({
  error,
  onRetry,
  title,
}: ErrorDisplayProps): ReactElement | null {
  if (!error) return null;

  return (
    <div className={styles.container} role="alert">
      <div className={styles.icon} aria-hidden="true">⚠</div>
      <div className={styles.content}>
        {title ? <h3 className={styles.title}>{title}</h3> : null}
        <p className={styles.message}>{apiErrorMessage(error)}</p>
      </div>
      {onRetry ? (
        <button className={styles.retry} type="button" onClick={onRetry}>
          Retry
        </button>
      ) : null}
    </div>
  );
}
