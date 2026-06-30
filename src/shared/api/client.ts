/**
 * Typed fetch wrapper — the only way the app talks to the network.
 *
 * @see docs/plans/phase-1-core-infrastructure.md §6
 *
 * Rules:
 *  - Never throws. Always returns `RequestResult<TOut>` (discriminated by `ok`).
 *  - Validates response body via Zod when `config.schema` is provided.
 *  - Auth header injected via a `getToken` resolver (default: `() => null`).
 *    The actual default is wired in `createApiClient` with a store-aware
 *    resolver at app boot; this keeps `shared/` ignorant of Redux.
 *  - One retry layer only — controlled by `config.retry` (default: off).
 *    React Query owns the cross-request retry policy.
 *  - AbortSignal respected on every attempt.
 */
import { z } from 'zod';

import { ApiError, newCorrelationId } from './errors';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface RequestConfig<TIn, TOut> {
  readonly method: HttpMethod;
  readonly path: string;
  readonly body?: TIn;
  readonly params?: Readonly<Record<string, string | number | boolean>>;
  readonly headers?: Readonly<Record<string, string>>;
  readonly signal?: AbortSignal;
  readonly skipAuth?: boolean;
  readonly schema?: z.ZodType<TOut>;
  readonly timeoutMs?: number;
  /** When true, the client retries on `network`/`timeout`/5xx (per retry policy). */
  readonly retry?: boolean;
}

export type RequestResult<TOut> =
  | { readonly ok: true; readonly data: TOut; readonly status: number }
  | { readonly ok: false; readonly error: ApiError };

export type TokenResolver = () => string | null;

export interface ApiClient {
  request<TIn = void, TOut = unknown>(config: RequestConfig<TIn, TOut>): Promise<RequestResult<TOut>>;
  setBaseUrl(url: string): void;
}

const DEFAULT_BASE_URL = '/api';
const DEFAULT_TIMEOUT_MS = 15_000;
const MAX_RETRIES = 3;

function isRetriableStatus(status: number): boolean {
  return status === 502 || status === 503 || status === 504;
}

function isRetriable(err: ApiError): boolean {
  return (
    err.detail.kind === 'network' ||
    err.detail.kind === 'timeout' ||
    (err.detail.kind === 'http' && isRetriableStatus(err.detail.status))
  );
}

function backoffMs(attempt: number): number {
  const base = 500 * 2 ** attempt;
  const jitter = Math.floor(Math.random() * 250);
  return Math.min(30_000, base + jitter);
}

async function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  if (signal?.aborted) {
    throw new DOMException('Aborted', 'AbortError');
  }
  return new Promise<void>((resolve, reject) => {
    const timer = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort);
      resolve();
    }, ms);
    const onAbort = (): void => {
      clearTimeout(timer);
      reject(new DOMException('Aborted', 'AbortError'));
    };
    signal?.addEventListener('abort', onAbort, { once: true });
  });
}

function buildUrl(baseUrl: string, path: string, params?: Readonly<Record<string, string | number | boolean>>): string {
  let url = path.startsWith('http') ? path : `${baseUrl.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
  if (params) {
    const usp = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) {
      usp.set(k, String(v));
    }
    const qs = usp.toString();
    if (qs) url += (url.includes('?') ? '&' : '?') + qs;
  }
  return url;
}

async function fetchWithTimeout(
  input: string,
  init: RequestInit,
  timeoutMs: number,
  signal?: AbortSignal,
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(new DOMException('Timeout', 'TimeoutError')), timeoutMs);

  // Forward caller-supplied abort to the internal controller.
  const onCallerAbort = (): void => controller.abort(signal?.reason);
  signal?.addEventListener('abort', onCallerAbort, { once: true });

  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', onCallerAbort);
  }
}

export function createApiClient(
  options: { baseUrl?: string; getToken?: TokenResolver } = {},
): ApiClient {
  let baseUrl = options.baseUrl ?? DEFAULT_BASE_URL;
  const getToken = options.getToken ?? ((): string | null => null);

  return {
    setBaseUrl(url: string): void {
      baseUrl = url;
    },

    async request<TIn, TOut>(
      config: RequestConfig<TIn, TOut>,
    ): Promise<RequestResult<TOut>> {
      const correlationId = newCorrelationId();
      const url = buildUrl(baseUrl, config.path, config.params);
      const timeoutMs = config.timeoutMs ?? DEFAULT_TIMEOUT_MS;
      const shouldRetry = config.retry === true;
      const headers: Record<string, string> = {
        Accept: 'application/json',
        'X-Request-Id': correlationId,
        ...(config.headers ?? {}),
      };
      if (config.body !== undefined && !(config.body instanceof FormData)) {
        headers['Content-Type'] = 'application/json';
      }
      if (!config.skipAuth) {
        const token = getToken();
        if (token) headers['Authorization'] = `Bearer ${token}`;
      }

      const init: RequestInit = {
        method: config.method,
        headers,
        ...(config.body !== undefined ? { body: JSON.stringify(config.body) } : {}),
      };

      let lastError: ApiError | null = null;
      for (let attempt = 0; attempt <= MAX_RETRIES; attempt += 1) {
        try {
          if (config.signal?.aborted) {
            return {
              ok: false,
              error: new ApiError({ kind: 'aborted', message: 'Request cancelled.', correlationId }),
            };
          }

          const response = await fetchWithTimeout(url, init, timeoutMs, config.signal);

          if (response.status === 401) {
            return {
              ok: false,
              error: new ApiError({
                kind: 'unauthorized',
                message: 'Authentication required.',
                correlationId,
              }),
            };
          }

          if (response.status === 204) {
            return { ok: true, data: undefined as unknown as TOut, status: 204 };
          }

          const contentType = response.headers.get('content-type') ?? '';
          if (!contentType.includes('application/json') && response.status >= 200 && response.status < 300) {
            return {
              ok: false,
              error: new ApiError({
                kind: 'http',
                status: response.status,
                body: null,
                message: `Unexpected content-type: ${contentType}`,
                correlationId,
              }),
            };
          }

          let body: unknown = null;
          if (contentType.includes('application/json')) {
            try {
              body = await response.json();
            } catch (cause) {
              lastError = new ApiError({
                kind: 'http',
                status: response.status,
                body: null,
                message: 'Invalid JSON in response.',
                correlationId,
              });
              if (shouldRetry && isRetriable(lastError) && attempt < MAX_RETRIES) {
                await sleep(backoffMs(attempt), config.signal);
                continue;
              }
              return { ok: false, error: lastError };
            }
          }

          if (!response.ok) {
            lastError = new ApiError({
              kind: 'http',
              status: response.status,
              body,
              message: `Request failed with status ${String(response.status)}.`,
              correlationId,
            });
            if (shouldRetry && isRetriable(lastError) && attempt < MAX_RETRIES) {
              await sleep(backoffMs(attempt), config.signal);
              continue;
            }
            return { ok: false, error: lastError };
          }

          if (config.schema) {
            const parsed = config.schema.safeParse(body);
            if (!parsed.success) {
              return {
                ok: false,
                error: new ApiError({
                  kind: 'validation',
                  issues: parsed.error.issues.map((i) => ({
                    path: i.path.join('.'),
                    message: i.message,
                  })),
                  message: 'Response did not match schema.',
                  correlationId,
                }),
              };
            }
            return { ok: true, data: parsed.data, status: response.status };
          }

          return { ok: true, data: body as TOut, status: response.status };
        } catch (cause) {
          if (cause instanceof DOMException && cause.name === 'AbortError') {
            // Distinguish caller-abort from timeout-abort via signal state.
            if (config.signal?.aborted) {
              return {
                ok: false,
                error: new ApiError({
                  kind: 'aborted',
                  message: 'Request cancelled.',
                  correlationId,
                }),
              };
            }
            lastError = new ApiError({
              kind: 'timeout',
              timeoutMs,
              message: `Request timed out after ${String(timeoutMs)}ms.`,
              correlationId,
            });
            if (shouldRetry && attempt < MAX_RETRIES) {
              await sleep(backoffMs(attempt), config.signal);
              continue;
            }
            return { ok: false, error: lastError };
          }

          lastError = new ApiError({
            kind: 'network',
            cause,
            message: 'Network error.',
            correlationId,
          });
          if (shouldRetry && attempt < MAX_RETRIES) {
            await sleep(backoffMs(attempt), config.signal);
            continue;
          }
          return { ok: false, error: lastError };
        }
      }

      // Loop exited via max retries — return the last error we accumulated.
      return { ok: false, error: lastError ?? new ApiError({ kind: 'network', message: 'Unknown error.', correlationId }) };
    },
  };
}
