# Phase 2 Performance Baseline

**Date:** 2026-07-01  
**Environment:** Desktop (Chromium, 1920×1080)  
**Tooling:** Lighthouse CI (`lhci autorun`), `vite build --mode analyze`

---

## Bundle Budgets (gzip per route)

| Route | Phase 1 | Phase 2 Target | Measured | Status |
|-------|---------|----------------|----------|--------|
| `/dashboard` | ~15 kB | ≤ 80 kB | TBD | ⬜ |
| `/projects` | — | ≤ 120 kB | TBD | ⬜ |
| `/projects/new` | — | ≤ 100 kB | TBD | ⬜ |
| `/projects/:id` | — | ≤ 110 kB | TBD | ⬜ |
| Shell (eager) | ~80 kB | ≤ 160 kB | TBD | ⬜ |
| **Total initial** | ~80 kB | ≤ 160 kB | TBD | ⬜ |

**Note:** Run `pnpm build --mode analyze` and update "Measured" column with actual gzip sizes.

---

## Core Web Vitals

| Metric | Desktop Target | Measured (median of 3) | Status |
|--------|----------------|------------------------|--------|
| LCP | < 2.5s | TBD | ⬜ |
| INP | < 200ms p75 | TBD | ⬜ |
| CLS | < 0.1 | TBD | ⬜ |
| TBT | < 200ms | TBD | ⬜ |

**Note:** Run `lhci autorun` and update "Measured" column with actual values.

---

## Manual Chunks

Configured in `vite.config.ts`:

| Chunk | Contents |
|-------|----------|
| `vendor-react` | react, react-dom, react-router-dom |
| `vendor-state` | @reduxjs/toolkit, react-redux, @tanstack/react-query |
| `vendor-forms` | react-hook-form, @hookform/resolvers, zod |
| `dashboard` | DashboardPage |
| `projects` | ProjectListPage |
| `project-detail` | ProjectDetailPage |
| `project-form` | ProjectCreatePage, ProjectEditPage |

---

## Risks

1. **Dashboard chunk size** may increase when widgets are added in Phase 3+.
2. **`vendor-forms`** chunk is loaded on `/projects/new` — if Zod is already in the shell from other features, this chunk may be smaller than anticipated.
3. **E2E flakiness** due to MSW vs real API — monitor `waitFor` timeouts in CI.
4. **ManualChunks duplication** — Vite may place shared deps in multiple chunks if code is tree-shaken unevenly. Verify with `--mode analyze`.

---

## Measurement Protocol

1. `pnpm build --mode analyze` — check each route chunk against budget
2. `lhci autorun` — 3 runs, median, update table above
3. React DevTools profiler — verify no unnecessary re-renders on data refetch
4. DevTools Performance — record list render, form submit, pagination; identify long tasks > 50ms
