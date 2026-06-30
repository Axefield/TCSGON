/**
 * Discriminated `ApiError` union — every error the API client can surface.
 *
 * @see docs/plans/phase-1-core-infrastructure.md §16, §6
 *
 * Rules:
 *  - `kind` is a string-literal discriminator — exhaustive `switch (e.kind)`
 *    must compile without a `default` branch in non-error paths.
 *  - `correlationId` is present on every variant for log correlation.
 *  - The custom `ApiError` class wraps the union so `instanceof ApiError`
 *    still works for `throw` sites.
 */
import type { ZodIssue } from 'zod';

export type ApiErrorKind =
  | 'network'
  | 'timeout'
  | 'aborted'
  | 'http'
  | 'validation'
  | 'unauthorized';

export interface ApiErrorBase {
  readonly kind: ApiErrorKind;
  readonly message: string;
  readonly correlationId: string;
}

export type ApiErrorPayload =
  | (ApiErrorBase & { readonly kind: 'network'; readonly cause?: unknown })
  | (ApiErrorBase & { readonly kind: 'timeout'; readonly timeoutMs: number })
  | (ApiErrorBase & { readonly kind: 'aborted' })
  | (ApiErrorBase & {
      readonly kind: 'http';
      readonly status: number;
      readonly body: unknown;
    })
  | (ApiErrorBase & {
      readonly kind: 'validation';
      readonly issues: ReadonlyArray<{ readonly path: string; readonly message: string }>;
    })
  | (ApiErrorBase & {
      readonly kind: 'unauthorized';
      readonly loginUrl?: string;
    });

export class ApiError extends Error {
  readonly detail: ApiErrorPayload;

  constructor(detail: ApiErrorPayload) {
    super(detail.message);
    this.name = 'ApiError';
    this.detail = detail;
  }

  get kind(): ApiErrorKind {
    return this.detail.kind;
  }

  get correlationId(): string {
    return this.detail.correlationId;
  }
}

/**
 * User-safe error message. Never exposes stack traces or internal field names.
 * Use this in UI surfaces; the full `ApiError` object is for logging.
 */
export function apiErrorMessage(e: ApiError): string {
  switch (e.detail.kind) {
    case 'network':
      return 'Offline. Check your connection.';
    case 'timeout':
      return 'Request timed out. Please try again.';
    case 'aborted':
      return 'Request cancelled.';
    case 'http': {
      const status = e.detail.status;
      if (status >= 500) return 'Server error. Please try again in a moment.';
      if (status === 404) return 'Not found.';
      if (status === 403) return 'You do not have permission to do that.';
      return `Request failed (${String(status)}).`;
    }
    case 'validation':
      return e.detail.issues
        .map((i) => `${i.path}: ${i.message}`)
        .join('; ');
    case 'unauthorized':
      return 'Please sign in again.';
  }
}

/** Type-guard helpers for narrowing in non-exhaustive contexts. */
export const isApiErrorKind = <K extends ApiErrorKind>(
  err: unknown,
  kind: K,
): err is ApiError & { detail: { kind: K } } =>
  err instanceof ApiError && err.detail.kind === kind;

/** Convert raw Zod issues to the flat shape the API error expects. */
export function flattenZodIssues(
  issues: ReadonlyArray<ZodIssue>,
): ReadonlyArray<{ readonly path: string; readonly message: string }> {
  return issues.map((i) => ({
    path: i.path.join('.'),
    message: i.message,
  }));
}

/** New correlation id per call — readable + greppable. */
export function newCorrelationId(): string {
  return `${Date.now().toString(36)}-${crypto.randomUUID().slice(0, 8)}`;
}
