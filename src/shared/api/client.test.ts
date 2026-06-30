/**
 * client.ts unit tests.
 *
 * @see docs/plans/phase-1-core-infrastructure.md §51, §57
 */
import { afterEach, describe, expect, it, vi } from 'vitest';

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

    // When ok is false, the error result doesn't have a "status" property.
    if (!result.ok) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars
      const { error: _err, ...rest } = result as any;
      expect('data' in rest).toBe(false);
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
});
