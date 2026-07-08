# ADR 0002 — State Management: Redux + React Query Split

**Status:** Accepted  
**Date:** 2026-07-07  
**Decision makers:** Architecture Agent, Tech Lead  
**Tags:** state-management, react, redux, react-query

---

## Context

The application needs to manage several kinds of state:

1. **Server state** — data fetched from the API (projects, users, dashboard stats)
2. **Auth state** — current user, session token, authentication status
3. **UI state** — theme, sidebar collapsed, toasts, modals, reduced-motion preference
4. **Form state** — controlled inputs with validation

We evaluated three approaches:
- **Redux only** — everything in the store
- **React Query only** — everything as query/mutation hooks
- **Split approach** — Redux for global UI + auth, React Query for server data

---

## Decision

Use a **split approach**: Redux Toolkit for global auth + UI state, React Query for all server-derived state.

### Redux owns

- `authSlice` — user, session token, authentication status (`AuthState` discriminated union)
- `uiSlice` — theme (light/dark), sidebar collapsed, toasts, modals, reducedMotion

### React Query owns

- All API data — projects, dashboard stats, user profiles, notification preferences
- Cache invalidation, background refetch, optimistic updates, retry logic
- Loading/error states for data fetching

### Neither owns

- Form state — React Hook Form handles this locally

---

## Rationale

1. **Auth needs synchronous reads.** Route guards (`RequireAuth`, `RedirectIfAuth`) must know auth status synchronously to prevent flash-of-wrong-route. Redux provides this via `store.getState()`.

2. **Server data benefits from React Query.** Automatic background refetch, stale-while-revalidate, cache deduplication, and retry logic are features Redux does not provide without significant boilerplate.

3. **UI state is small and synchronous.** Theme, sidebar, and toasts don't benefit from React Query's caching model. Redux slices are simpler.

4. **Separation of concerns.** Mixing server data and UI state in one store creates an implicit dependency — dispatching an action that happens to fetch data. The split enforces a clean boundary.

---

## Consequences

### Positive

- Route guards read auth state synchronously (no flash of login page)
- Server state benefits from React Query's caching, refetch, and retry
- Redux store stays small (2 slices, ~50 lines total)
- Clear ownership: UI → Redux, data → React Query

### Negative

- Two state libraries to learn
- Auth flow crosses boundaries: React Query mutation → dispatches to Redux on success
- Must ensure `getToken` in API client always reads fresh Redux state

### Mitigations

- `useAuth` composable hook wraps both Redux selectors and React Query mutations
- `getToken` resolver reads `store.getState()` at request time (not closed-over stale value)
- Redux dispatch happens in mutation `onSuccess`/`onError` callbacks

---

## Alternatives considered

### Redux only

Rejected: Would require manual caching, refetch logic, and retry handling — duplicating features React Query provides for free.

### React Query only

Rejected: Route guards would need to await `useSession()` before rendering, causing visible flash. React Query's synchronous cache is not guaranteed to be populated on initial mount.

---

## Related

- ADR 0001 — Token Persistence Strategy
- ADR 0004 — Routing Strategy (auth guards)
