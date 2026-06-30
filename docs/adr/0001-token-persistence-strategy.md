# ADR 0001 — Token Persistence Strategy

**Status:** Accepted
**Date:** 2026-06-30

## Context

Phase 1 requires auth state to survive page reloads. The session token (opaque
string, min 20 chars) is returned by the login endpoint and used as a Bearer
token for subsequent API requests. When the user refreshes the page, the token
must be available synchronously to avoid a flash to the login screen.

## Options considered

1. **HttpOnly cookie** — Set by the server on login, sent automatically on every
   request. Most secure (not accessible to JS). Requires a secure backend endpoint
   that sets the cookie, and the token is unavailable to the client for
   preloadedState — the app would need a `GET /me` call on every reload.

2. **In-memory + refresh endpoint** — Store token only in memory; on reload,
   call a refresh endpoint that reads an HttpOnly refresh cookie. Most
   secure pattern, but requires the refresh endpoint and adds a network round
   trip on every page load.

3. **localStorage** — Write the token to `localStorage` on login; read it
   synchronously on store creation for `preloadedState`. Simple, synchronous,
   but XSS-vulnerable (any JS on the origin can read it).

## Decision

Use **localStorage** for Phase 1.

The session token and user info are stored together in a single `tcs.auth` key.
The value is validated via Zod schema (`SessionSchema`) on read from storage
and on write from API responses.

## Consequences

### Positive

- **Synchronous read** — `preloadedState` is computed in the store creation
  file before React renders, so the app sees `'authenticated'` state immediately
  on reload. No flash to login.
- **Simple to implement and debug** — `localStorage` is browser-native, no
  additional infrastructure needed.
- **Single source of truth** — the `tcs.auth` key holds both the token and
  user info, validated by the same Zod schema used for API responses.

### Negative

- **XSS vulnerability** — Any script executing on the same origin can read
  `localStorage` and exfiltrate the token. Mitigated by CSP headers and
  minimal JS surface, but not eliminated.
- **No automatic refresh** — If the token expires server-side while the user
  has the tab open, the next API call will 401 and the app transitions to
  `'anonymous'` state. No silent refresh mechanism exists yet.
- **Storage size limit** — ~5–10 MB per origin; not a concern for auth data
  (<1 KB) but a hard ceiling to be aware of.

## Mitigation plan (Phase 2)

Migrate to **HttpOnly cookies with a refresh-token pattern**:

1. Login endpoint returns a short-lived access token as an HttpOnly cookie
   and a longer-lived refresh token (also HttpOnly).
2. API client response interceptor detects 401, calls a refresh endpoint,
   and retries the original request once.
3. On page reload, the access token cookie is sent with the first request;
   if expired, the refresh flow kicks in transparently.

The API client already handles 401 via the `'unauthorized'` error kind —
the refresh logic will slot into a response interceptor without changing
the component layer.
