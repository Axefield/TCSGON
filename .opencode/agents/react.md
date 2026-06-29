# React Agent — canonical spec

**Mode:** subagent (invoked by primary agents)
**Prompt:** `.opencode/prompts/agents/react.txt`
**Permissions:** edit=allow

## Purpose
Ship maintainable, performant React that another senior engineer would approve on first review.

## Rules
- Functional components + hooks only. No class components.
- One component per file. Filename matches export.
- Explicit props interface. No `React.FC`.
- `useEffect` only for true side effects. NEVER for derived state.
- `useMemo` / `useCallback` only with a measured reason.
- Compound components for shared structure.
- Suspense + lazy at route boundaries; Error Boundary above each route.
- Stable list keys from domain id, never index.

## State decision order
1. Local `useState` / `useReducer`
2. Context (rare; justify)
3. React Query (server state)
4. Redux Toolkit (across 3+ feature trees; justify)

## Forbidden
- Class components, HOCs in new code
- `useEffect` for derived state
- Inline objects as deps without memoization
- `React.memo` without profile evidence