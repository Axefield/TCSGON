/**
 * client.ts unit tests.
 *
 * @see docs/plans/phase-1-core-infrastructure.md §51, §57
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';

import { createApiClient } from './client';

function mockFetch(response?: Partial<Response>, reject = false): void {
  const res: Response = {
    ok: response?.ok ?? true,
    status: response?.status ?? 200,
    statusText: response?.statusText ?? 'OK',
    headers: response?.headers ?? new Headers({ 'content-type': 'application/json' }),
    json: response?.json ?? (() => Promise.resolve({})),
    text: response?.text ?? (() => Promise.resolve('')),
    ...response,
  } as Response;

  if (reject) {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('Network error'));
  } else {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(res);
  }
}

describe('createApiClient', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns an ApiClient with request and setBaseUrl', () => {
    const client = createApiClient({ baseUrl: 'http://test.com' });
    expect(client.request).toBeInstanceOf(Function);
    expect(client.setBaseUrl).toBeInstanceOf(Function);
  });

  it('request builds correct URL', async () => {
    mockFetch();
    const client = createApiClient({ baseUrl: 'http://test.com/api' });
    await client.request({ method: 'GET', path: '/auth/login' });

    const callArgs = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0]!;
    expect(callArgs[0]).toBe('http://test.com/api/auth/login');
    expect(callArgs[1].method).toBe('GET');
  });

  it('request includes Content-Type: application/json when body is present', async () => {
    mockFetch();
    const client = createApiClient({ baseUrl: 'http://test.com' });
    await client.request({ method: 'POST', path: '/test', body: { key: 'value' } });

    const callArgs = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0]!;
    expect(callArgs[1].headers['Content-Type']).toBe('application/json');
  });

  it('request injects auth token from getToken resolver', async () => {
    mockFetch();
    const client = createApiClient({
      baseUrl: 'http://test.com',
      getToken: () => 'tok_test',
    });
    await client.request({ method: 'GET', path: '/test' });

    const callArgs = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0]!;
    expect(callArgs[1].headers['Authorization']).toBe('Bearer tok_test');
  });

  it('request does not send Authorization header when getToken returns null', async () => {
    mockFetch();
    const client = createApiClient({
      baseUrl: 'http://test.com',
      getToken: () => null,
    });
    await client.request({ method: 'GET', path: '/test' });

    const callArgs = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0]!;
    expect(callArgs[1].headers['Authorization']).toBeUndefined();
  });

  it('request returns success result', async () => {
    mockFetch({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ id: '1', name: 'Test' }),
    });
    const client = createApiClient({ baseUrl: 'http://test.com' });
    const result = await client.request({ method: 'GET', path: '/test' });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toEqual({ id: '1', name: 'Test' });
      expect(result.status).toBe(200);
    }
  });

  it('request returns error result for 4xx', async () => {
    mockFetch({
      ok: false,
      status: 400,
      json: () => Promise.resolve({ message: 'Bad request' }),
    });
    const client = createApiClient({ baseUrl: 'http://test.com' });
    const result = await client.request({ method: 'GET', path: '/test' });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.kind).toBe('http');
    }
  });

  it('request returns unauthorized error for 401', async () => {
    mockFetch({
      ok: false,
      status: 401,
      json: () => Promise.resolve({ message: 'Unauthorized' }),
    });
    const client = createApiClient({ baseUrl: 'http://test.com' });
    const result = await client.request({ method: 'GET', path: '/test' });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.kind).toBe('unauthorized');
    }
  });

  it('request returns network error on fetch rejection', async () => {
    mockFetch({}, true);
    const client = createApiClient({ baseUrl: 'http://test.com' });
    const result = await client.request({ method: 'GET', path: '/test' });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.kind).toBe('network');
    }
  });

  it('request does not include status in error result (discriminated union)', async () => {
    mockFetch({
      ok: false,
      status: 400,
      json: () => Promise.resolve({}),
    });
    const client = createApiClient({ baseUrl: 'http://test.com' });
    const result = await client.request({ method: 'GET', path: '/test' });

    // When ok is false, the error result doesn't have a "data" property.
    if (!result.ok) {
      expect('data' in result).toBe(false);
    }
  });

  it('setBaseUrl updates base URL for subsequent requests', async () => {
    mockFetch();
    const client = createApiClient({ baseUrl: 'http://old.com' });

    client.setBaseUrl('http://new.com/api');
    await client.request({ method: 'GET', path: '/test' });

    const callArgs = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0]!;
    expect(callArgs[0]).toBe('http://new.com/api/test');
  });

  it('request adds correlationId header', async () => {
    mockFetch();
    const client = createApiClient({ baseUrl: 'http://test.com' });
    await client.request({ method: 'GET', path: '/test' });

    const callArgs = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0]!;
    const headers = callArgs[1].headers as Record<string, string>;
    expect(headers['X-Correlation-Id']).toBeDefined();
    expect(typeof headers['X-Correlation-Id']).toBe('string');
  });

  it('request appends query params', async () => {
    mockFetch();
    const client = createApiClient({ baseUrl: 'http://test.com' });
    await client.request({ method: 'GET', path: '/search', params: { q: 'hello', page: 1, active: true } });

    const callArgs = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0]!;
    expect(callArgs[0]).toBe('http://test.com/search?q=hello&page=1&active=true');
  });

  it('request sends POST body as JSON', async () => {
    mockFetch();
    const client = createApiClient({ baseUrl: 'http://test.com' });
    await client.request({ method: 'POST', path: '/data', body: { name: 'test' } });

    const callArgs = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0]!;
    expect(callArgs[1].method).toBe('POST');
    expect(JSON.parse(callArgs[1].body as string)).toEqual({ name: 'test' });
  });

  it('request sends DELETE method', async () => {
    mockFetch();
    const client = createApiClient({ baseUrl: 'http://test.com' });
    await client.request({ method: 'DELETE', path: '/resource/1' });

    const callArgs = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0]!;
    expect(callArgs[1].method).toBe('DELETE');
  });

  it('request merges custom headers', async () => {
    mockFetch();
    const client = createApiClient({ baseUrl: 'http://test.com' });
    await client.request({ method: 'GET', path: '/test', headers: { 'X-Custom': 'value' } });

    const callArgs = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0]!;
    const headers = callArgs[1].headers as Record<string, string>;
    expect(headers['X-Custom']).toBe('value');
    expect(headers['X-Correlation-Id']).toBeDefined();
  });

  it('request skips auth when skipAuth is true', async () => {
    const getToken = vi.fn(() => 'secret');
    mockFetch();
    const client = createApiClient({ baseUrl: 'http://test.com', getToken });
    await client.request({ method: 'GET', path: '/public', skipAuth: true });

    expect(getToken).not.toHaveBeenCalled();
    const callArgs = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0]!;
    expect((callArgs[1].headers as Record<string, string>)['Authorization']).toBeUndefined();
  });

  it('request retries on network error when retry is true', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('Network error'));
    const client = createApiClient({ baseUrl: 'http://test.com' });
    // Network errors are retriable; after MAX_RETRIES+1 attempts we get a network error.
    const result = await client.request({ method: 'GET', path: '/test', retry: true });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.kind).toBe('network');
    }
    // Should have been called multiple times (initial + MAX_RETRIES retries)
    expect(vi.mocked(globalThis.fetch).mock.calls.length).toBeGreaterThan(1);
  });

  it('request retries on 503 when retry is true', async () => {
    const mock = vi.spyOn(globalThis, 'fetch');
    // First call returns 503 (retriable), second returns success.
    mock
      .mockResolvedValueOnce({
        ok: false, status: 503, statusText: 'Service Unavailable',
        headers: new Headers(), json: () => Promise.resolve({}), text: () => Promise.resolve(''),
      } as Response)
      .mockResolvedValueOnce({
        ok: true, status: 200,
        headers: new Headers({ 'content-type': 'application/json' }), json: () => Promise.resolve({ id: 1 }), text: () => Promise.resolve(''),
      } as Response);

    const client = createApiClient({ baseUrl: 'http://test.com' });
    const result = await client.request({ method: 'GET', path: '/test', retry: true });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toEqual({ id: 1 });
    }
    expect(mock.mock.calls.length).toBe(2);
  });

  it('request does NOT retry on 4xx even when retry is true', async () => {
    const mock = vi.spyOn(globalThis, 'fetch');
    mock.mockResolvedValue({
      ok: false, status: 422, statusText: 'Unprocessable',
      headers: new Headers(), json: () => Promise.resolve({}), text: () => Promise.resolve(''),
    } as Response);

    const client = createApiClient({ baseUrl: 'http://test.com' });
    const result = await client.request({ method: 'GET', path: '/test', retry: true });

    expect(result.ok).toBe(false);
    expect(mock.mock.calls.length).toBe(1);
  });

  it('request does NOT retry when retry is false/undefined', async () => {
    const mock = vi.spyOn(globalThis, 'fetch');
    mock.mockRejectedValue(new Error('Network error'));

    const client = createApiClient({ baseUrl: 'http://test.com' });
    const result = await client.request({ method: 'GET', path: '/test' });

    expect(result.ok).toBe(false);
    expect(mock.mock.calls.length).toBe(1);
  });

  it('request aborts when signal is already aborted', async () => {
    const controller = new AbortController();
    controller.abort();
    mockFetch();
    const client = createApiClient({ baseUrl: 'http://test.com' });
    const result = await client.request({ method: 'GET', path: '/test', signal: controller.signal });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.kind).toBe('aborted');
    }
  });

  it('handles non-JSON response body gracefully', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: false, status: 500, statusText: 'Server Error',
      headers: new Headers({ 'content-type': 'text/plain' }),
      json: () => Promise.reject(new Error('Not JSON')),
      text: () => Promise.resolve('Internal error'),
    } as unknown as Response);

    const client = createApiClient({ baseUrl: 'http://test.com' });
    const result = await client.request({ method: 'GET', path: '/test' });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.kind).toBe('http');
    }
  });

  it('handles absolute URLs without prepending baseUrl', async () => {
    mockFetch();
    const client = createApiClient({ baseUrl: 'http://test.com' });
    await client.request({ method: 'GET', path: 'https://other.com/api/data' });

    const callArgs = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0]!;
    expect(callArgs[0]).toBe('https://other.com/api/data');
  });

  // ---------------------------------------------------------------------------
  // Remediation: bring line coverage to ≥ 80%
  // ---------------------------------------------------------------------------

  it('request returns success with undefined data for 204', async () => {
    mockFetch({
      ok: true,
      status: 204,
      headers: new Headers({}),
    });
    const client = createApiClient({ baseUrl: 'http://test.com' });
    const result = await client.request({ method: 'DELETE', path: '/resource/1' });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.status).toBe(204);
      expect(result.data).toBeUndefined();
    }
  });

  it('request returns error for unexpected content-type on successful response', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
      headers: new Headers({ 'content-type': 'text/plain' }),
      json: () => Promise.reject(new Error('Not JSON')),
      text: () => Promise.resolve('plain text'),
    } as unknown as Response);

    const client = createApiClient({ baseUrl: 'http://test.com' });
    const result = await client.request({ method: 'GET', path: '/test' });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.kind).toBe('http');
      expect(result.error.message).toContain('content-type');
    }
  });

  it('request returns error when JSON parsing fails on 2xx response', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
      headers: new Headers({ 'content-type': 'application/json' }),
      json: () => Promise.reject(new SyntaxError('Unexpected token')),
      text: () => Promise.resolve('{invalid}'),
    } as unknown as Response);

    const client = createApiClient({ baseUrl: 'http://test.com' });
    const result = await client.request({ method: 'GET', path: '/test' });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.kind).toBe('http');
    }
  });

  it('request retries when JSON parsing fails on retriable status', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch');
    // First: 503 with broken JSON body
    fetchMock.mockResolvedValueOnce({
      ok: false, status: 503, statusText: 'Service Unavailable',
      headers: new Headers({ 'content-type': 'application/json' }),
      json: () => Promise.reject(new SyntaxError('Unexpected token')),
    } as unknown as Response);
    // Second: success
    fetchMock.mockResolvedValueOnce({
      ok: true, status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: () => Promise.resolve({ id: 1 }),
    } as unknown as Response);

    const client = createApiClient({ baseUrl: 'http://test.com' });
    const result = await client.request({ method: 'GET', path: '/test', retry: true });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toEqual({ id: 1 });
    }
    expect(fetchMock.mock.calls.length).toBe(2);
  });

  it('request does not set Content-Type for FormData body', async () => {
    mockFetch();
    const client = createApiClient({ baseUrl: 'http://test.com' });
    const formData = new FormData();
    formData.append('key', 'value');
    await client.request({ method: 'POST', path: '/upload', body: formData });

    const callArgs = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0]!;
    expect(callArgs[1].headers['Content-Type']).toBeUndefined();
  });

  it('request returns validation error when schema validation fails', async () => {
    const schema = z.object({ id: z.string() });
    mockFetch({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ id: 123 }),
    });
    const client = createApiClient({ baseUrl: 'http://test.com' });
    const result = await client.request({ method: 'GET', path: '/test', schema });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.kind).toBe('validation');
      const detail = result.error.detail;
      if (detail.kind === 'validation') {
        expect(detail.issues).toBeDefined();
        expect(detail.issues.length).toBeGreaterThan(0);
      }
    }
  });

  it('request returns validated data when schema validation succeeds', async () => {
    const schema = z.object({ id: z.string(), name: z.string() });
    mockFetch({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ id: '1', name: 'Test' }),
    });
    const client = createApiClient({ baseUrl: 'http://test.com' });
    const result = await client.request({ method: 'GET', path: '/test', schema });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toEqual({ id: '1', name: 'Test' });
      expect(result.status).toBe(200);
    }
  });

  it('returns timeout error when request exceeds timeoutMs', async () => {
    vi.useFakeTimers();

    vi.spyOn(globalThis, 'fetch').mockImplementation((_url, init) => {
      return new Promise((_resolve, reject) => {
        const signal = init?.signal as AbortSignal | undefined;
        if (signal?.aborted) {
          reject(new DOMException('Aborted', 'AbortError'));
          return;
        }
        signal?.addEventListener('abort', () => {
          reject(new DOMException('Aborted', 'AbortError'));
        }, { once: true });
      });
    });

    const client = createApiClient({ baseUrl: 'http://test.com' });
    const promise = client.request({ method: 'GET', path: '/test', timeoutMs: 50 });

    await vi.advanceTimersByTimeAsync(50);

    const result = await promise;
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.kind).toBe('timeout');
    }

    vi.useRealTimers();
  });

  it('returns aborted error when caller aborts during request', async () => {
    const controller = new AbortController();

    vi.spyOn(globalThis, 'fetch').mockImplementation((_url, init) => {
      return new Promise((_resolve, reject) => {
        const signal = init?.signal as AbortSignal | undefined;
        if (signal?.aborted) {
          reject(new DOMException('Aborted', 'AbortError'));
          return;
        }
        signal?.addEventListener('abort', () => {
          reject(new DOMException('Aborted', 'AbortError'));
        }, { once: true });
      });
    });

    const client = createApiClient({ baseUrl: 'http://test.com' });
    const promise = client.request({ method: 'GET', path: '/test', signal: controller.signal });

    controller.abort();

    const result = await promise;
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.kind).toBe('aborted');
    }
  });

  it('aborts retry sleep when signal is cancelled', async () => {
    vi.useFakeTimers();

    const controller = new AbortController();

    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: false, status: 503, statusText: 'Service Unavailable',
      headers: new Headers(), json: () => Promise.resolve({}), text: () => Promise.resolve(''),
    } as Response);

    const client = createApiClient({ baseUrl: 'http://test.com' });
    const promise = client.request({
      method: 'GET', path: '/test', retry: true,
      signal: controller.signal,
    });

    // Schedule abort during the first backoff sleep
    setTimeout(() => controller.abort(), 100);

    // Advance past the first fetch + into sleep, then trigger the abort
    await vi.advanceTimersByTimeAsync(200);

    const result = await promise;
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.kind).toBe('aborted');
    }

    vi.useRealTimers();
  });

  it('request does NOT retry on 500 (non-retriable server error) even when retry is true', async () => {
    const mock = vi.spyOn(globalThis, 'fetch');
    mock.mockResolvedValue({
      ok: false, status: 500, statusText: 'Internal Server Error',
      headers: new Headers(), json: () => Promise.resolve({}), text: () => Promise.resolve(''),
    } as Response);

    const client = createApiClient({ baseUrl: 'http://test.com' });
    const result = await client.request({ method: 'GET', path: '/test', retry: true });

    expect(result.ok).toBe(false);
    expect(mock.mock.calls.length).toBe(1);
  });

  it('retries on timeout when retry is true', async () => {
    vi.useFakeTimers();

    const fetchMock = vi.spyOn(globalThis, 'fetch');
    // First call: hangs then times out
    fetchMock.mockImplementationOnce((_url, init) => {
      return new Promise((_resolve, reject) => {
        const signal = init?.signal as AbortSignal | undefined;
        if (signal?.aborted) {
          reject(new DOMException('Aborted', 'AbortError'));
          return;
        }
        signal?.addEventListener('abort', () => {
          reject(new DOMException('Aborted', 'AbortError'));
        }, { once: true });
      });
    })
    // Second call: succeeds
    .mockImplementationOnce(() => Promise.resolve({
      ok: true, status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: () => Promise.resolve({ id: 1 }),
    } as Response));

    const client = createApiClient({ baseUrl: 'http://test.com' });
    const promise = client.request({ method: 'GET', path: '/test', timeoutMs: 50, retry: true });

    // Advance past first timeout (50ms) + backoff sleep (~500ms) + second request
    await vi.advanceTimersByTimeAsync(5000);

    const result = await promise;
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toEqual({ id: 1 });
    }
    expect(fetchMock.mock.calls.length).toBe(2);

    vi.useRealTimers();
  });

  it('applies exponential backoff between retries', async () => {
    vi.useFakeTimers();

    const fetchMock = vi.spyOn(globalThis, 'fetch');
    fetchMock.mockResolvedValue({
      ok: false, status: 503, statusText: 'Service Unavailable',
      headers: new Headers(), json: () => Promise.resolve({}), text: () => Promise.resolve(''),
    } as Response);

    const setTimeoutSpy = vi.spyOn(globalThis, 'setTimeout');

    const client = createApiClient({ baseUrl: 'http://test.com' });
    const promise = client.request({ method: 'GET', path: '/test', retry: true });

    // Run all timers to completion
    await vi.runAllTimersAsync();

    const result = await promise;
    expect(result.ok).toBe(false);

    // Must have exhausted all retries
    expect(fetchMock.mock.calls.length).toBe(4); // initial + 3 retries

    // Extract the backoff sleep delays (positive delays < 10s)
    const sleepDelays = setTimeoutSpy.mock.calls
      .map((call) => call[1] as number)
      .filter((delay) => delay > 0 && delay < 10_000)
      .sort((a, b) => a - b);

    // We should have at least 3 sleep calls (attempts 0, 1, 2)
    expect(sleepDelays.length).toBeGreaterThanOrEqual(3);
    // Exponential backoff: each delay is strictly larger than the previous
    for (let i = 1; i < sleepDelays.length; i++) {
      expect(sleepDelays[i]!).toBeGreaterThan(sleepDelays[i - 1]!);
    }
    // First retry base is 500 * 2^0 = 500 (plus jitter 0-250)
    expect(sleepDelays[0]!).toBeGreaterThanOrEqual(500);
    expect(sleepDelays[0]!).toBeLessThan(750);

    vi.useRealTimers();
  });
});
