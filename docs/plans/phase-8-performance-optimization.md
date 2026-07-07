# Phase 8 — Performance Optimization

> **Status:** Planned  
> **Owner:** AI Workflow Agent  
> **Target branch:** `feat/phase-8-performance-optimization`  
> **Dependencies:** Phase 7 complete (PR #10 merged to `main`)

---

## 1. Feature Request

Measure, identify, optimize, and verify the application's runtime and loading performance. While route-level code splitting, bundle budgets, and Lighthouse CI are already in place, several optimization opportunities remain: eager loading of the LandingPage (it's always the first route), list virtualization (`@tanstack/react-virtual`) for future large datasets, an image pipeline (AVIF/WebP `<picture>` component), a measured memoization pass, and a formal Lighthouse baseline capture. Deliver a performance audit report, implement the high-impact fixes, and gate all improvements with before/after measurements.

### Scope

1. **Eager LandingPage** — Switch from `lazy()` to top-level import (index route, always visited first)
2. **VirtualizedDataTable** — New component wrapping `@tanstack/react-virtual`, gated at `data.length > 50`
3. **OptimizedImage** — Responsive `<picture>` component with AVIF/WebP fallback, lazy loading, CLS prevention
4. **Measured memoization** — `useCallback` on `DataTable.handleSort`, `useMemo` on `ProjectList` columns and `DashboardPage.statItems`
5. **Avatar augmentation** — Add `srcSet`, `sizes`, `loading` props
6. **Lighthouse baseline** — Capture pre/post scores, update config, re-enable `unused-css-rules` as warning

---

## 2. Architecture Overview

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                      PHASE 8 — PERFORMANCE OPTIMIZATION                      │
└──────────────────────────────────────────────────────────────────────────────┘

                    ┌──────────────────────────────────────┐
                    │      Lighthouse CI Baseline           │
                    │   (capture pre/post per change)       │
                    └──────────────┬───────────────────────┘
                                   │ asserts
                                   ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│  LAYER 1: EAGER LANDINGPAGE (routes/index.tsx)                               │
│                                                                              │
│  Before: lazy(() => import('@/features/landing/pages/LandingPage'))          │
│  After:  import { LandingPage } from '@/features/landing/pages/LandingPage'  │
│          → index: true, element: <LandingPage />                             │
│                                                                              │
│  Benefit: removes ~50-100ms network round-trip on first paint                │
│  Cost: +1.5–3 kB gzip on index chunk                                         │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│  LAYER 2: LIST VIRTUALIZATION (DataTable / VirtualizedDataTable)             │
│                                                                              │
│  DataTable (modified)                                                        │
│  ┌─────────────────────────────────────────┐                                │
│  │  virtualized=false (default)            │ → render all rows (existing)    │
│  │  virtualized=true + data.length <= 50   │ → render all rows (below gate) │
│  │  virtualized=true + data.length > 50    │ → VirtualizedDataTable          │
│  └─────────────────────────────────────────┘                                │
│                                               ┌──────────────────────────┐   │
│                                               │ VirtualizedDataTable<T>  │   │
│                                               │ useVirtualizer({         │   │
│                                               │   count, getScrollElement│   │
│                                               │   estimateSize, overscan │   │
│                                               │ })                       │   │
│                                               │ role="table"/"grid"      │   │
│                                               │ aria-rowcount/rowindex   │   │
│                                               │ scrollable, tabindex=0   │   │
│                                               └──────────────────────────┘   │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│  LAYER 3: IMAGE PIPELINE (OptimizedImage / Avatar)                           │
│                                                                              │
│  OptimizedImage                    Avatar (enhanced)                         │
│  ┌─────────────────────┐           ┌──────────────────────┐                  │
│  │ <picture>           │           │ srcSet?, sizes?,     │                  │
│  │  <source type=avif> │           │ loading="lazy"?      │                  │
│  │  <source type=webp> │           │ ...existing props    │                  │
│  │  <img src alt ...>  │           └──────────────────────┘                  │
│  │  aspectRatio for CLS│                                                    │
│  └─────────────────────┘                                                    │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│  LAYER 4: MEASURED MEMOIZATION                                               │
│                                                                              │
│  DataTable         ProjectList          DashboardPage                        │
│  handleSort        columns array        statItems                            │
│  → useCallback     → useMemo([])        → useMemo([stats])                   │
│  [onSort,sortKey,  (static config,      (prevents array                      │
│   sortOrder]        never changes)       re-creation)                        │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Folder Structure (Exact Paths)

### New files

```
src/
├── shared/
│   ├── components/
│   │   ├── OptimizedImage.tsx               ← Responsive <picture> component
│   │   ├── OptimizedImage.module.css         ← Styles
│   │   ├── OptimizedImage.test.tsx           ← Unit + behavior tests
│   │   ├── OptimizedImage.axe.test.tsx       ← a11y audit
│   │   ├── VirtualizedDataTable.tsx          ← Windowed table using @tanstack/react-virtual
│   │   ├── VirtualizedDataTable.test.tsx     ← Unit + behavior tests
│   │   ├── VirtualizedDataTable.axe.test.tsx ← a11y audit
│   │   └── VirtualizedDataTable.module.css   ← Styles
│   ├── hooks/
│   │   └── useRenderProfiler.ts              ← DEV-only render counter (optional)
│   └── utils/
│       ├── image.ts                          ← buildSrcSet, pickBestFormat, constants
│       └── image.test.ts                     ← Pure function tests
docs/
└── perf/
    └── 2026-07-07-phase8-baseline.md         ← Baseline measurement capture
```

### Modified files

```
M package.json                                    ← +@tanstack/react-virtual@^3
M src/routes/index.tsx                            ← LandingPage eager import
M src/shared/components/DataTable.tsx             ← +virtualized prop + delegation
M src/shared/components/DataTable.test.tsx        ← +4 new tests
M src/shared/components/Avatar.tsx                ← +srcSet/sizes/loading props
M src/shared/components/Avatar.test.tsx           ← +6 new tests
M src/shared/components/Avatar.axe.test.tsx       ← +new prop test case
M src/shared/components/index.ts                  ← export VirtualizedDataTable, OptimizedImage
M src/features/projects/components/ProjectList.tsx ← useMemo columns
M src/features/dashboard/pages/DashboardPage.tsx   ← useMemo statItems
M lighthouserc.cjs                                 ← re-enable unused-css-rules: warn
```

---

## 4. Interfaces (TypeScript Shapes)

### `src/shared/utils/image.ts`

```ts
export type ImageFormat = 'avif' | 'webp' | 'jpeg' | 'png';
export type ImageMimeType = 'image/avif' | 'image/webp' | 'image/jpeg' | 'image/png';

export const IMAGE_BREAKPOINTS: readonly number[] = [320, 640, 960, 1280, 1920];
export const FORMAT_TO_MIME: Record<ImageFormat, ImageMimeType>;
export const FORMAT_PREFERENCE: readonly ImageFormat[] = ['avif', 'webp', 'jpeg', 'png'];

export interface ImageThresholds {
  readonly MOBILE: number;
  readonly TABLET: number;
  readonly DESKTOP: number;
}

export function buildSrcSet(baseUrl: string, widths?: ReadonlyArray<number>): string;
export function pickBestFormat(supportedFormats: ReadonlyArray<ImageFormat>): ImageMimeType;
```

### `src/shared/components/OptimizedImage.tsx`

```ts
export interface OptimizedImageProps {
  readonly src: string;
  readonly alt: string;
  readonly srcSet?: string | undefined;
  readonly sizes?: string | undefined;
  readonly srcAvif?: string | undefined;
  readonly srcWebp?: string | undefined;
  readonly loading?: 'lazy' | 'eager';
  readonly decoding?: 'async' | 'sync' | 'auto';
  readonly onError?: (() => void) | undefined;
  readonly className?: string | undefined;
  readonly aspectRatio?: string | number;
  readonly width?: number | undefined;
  readonly height?: number | undefined;
}
```

### `src/shared/components/VirtualizedDataTable.tsx`

```ts
import type { DataTableColumn } from './DataTable';
export type { DataTableColumn };

export interface VirtualizedDataTableProps<T> {
  readonly columns: ReadonlyArray<DataTableColumn<T>>;
  readonly data: ReadonlyArray<T>;
  readonly sortKey?: string | undefined;
  readonly sortOrder?: 'asc' | 'desc';
  readonly onSort?: ((key: string, order: 'asc' | 'desc') => void) | undefined;
  readonly isLoading?: boolean;
  readonly emptyState?: ReactNode;
  readonly onRowClick?: ((item: T) => void) | undefined;
  readonly rowKey: (item: T) => string;
  readonly label: string;
  readonly estimatedRowHeight?: number;
  readonly overscan?: number;
}
```

### `src/shared/components/DataTable.tsx` — augmented

```ts
export interface DataTableProps<T> {
  // ... existing props ...
  readonly virtualized?: boolean | undefined;
}
```

### `src/shared/components/Avatar.tsx` — augmented

```ts
export interface AvatarProps {
  // ... existing props ...
  readonly srcSet?: string | undefined;
  readonly sizes?: string | undefined;
  readonly loading?: 'lazy' | 'eager';
}
```

### `src/shared/hooks/useRenderProfiler.ts`

```ts
export function useRenderProfiler(label: string, warnAfter?: number): void;
```

---

## 5. State Decision with Justification

| Concern | Decision | Justification |
|---------|----------|---------------|
| **Image pipeline** | No state | `OptimizedImage` uses local `useState` for load/error tracking. No Redux/Context needed. |
| **Virtualization scroll** | No state | `useVirtualizer` manages its own scroll state internally. No coordination across routes. |
| **Memoization** | No state | `useCallback`/`useMemo` are per-component. No global registry. |
| **Eager LandingPage** | No state | Pure import change. Auth state already in Redux. |
| **Lighthouse baseline** | No state | Captured as static markdown doc. |

---

## 6. Risks with Mitigations

| # | Risk | Severity | Mitigation |
|---|------|----------|------------|
| R1 | **Eager LandingPage increases initial bundle** | Low | LandingPage is ~3 kB gzip (no images, no heavy imports). Verify with `pnpm build:analyze`. If >5 kB increase, revert. |
| R2 | **Virtualization breaks keyboard nav** | High | Preserve `tabIndex`, `aria-rowindex`, keyboard handling from DataTable. Test with `userEvent.tab` + keyboard-only E2E. |
| R3 | **Virtualization + pagination interaction** | Medium | Reset scroll position on page change: `useEffect` with `scrollToIndex(0)` watching `data`. |
| R4 | **Memoization without measured benefit** | Medium | Enforce profiler recording before each optimization. Document before/after render count. |
| R5 | **Virtualized focused row removed from DOM** | Critical | Increase overscan to 10+ rows; if focused row index falls outside rendered range, scroll to bring it back via `scrollToIndex`. |
| R6 | **`React.memo` stales ARIA attributes** | High | No `React.memo` in this plan (only `useCallback`/`useMemo`). Profile first if adding later. |
| R7 | **Virtualization is net-negative at current scale** | Medium | Gate by `data.length > 50`. With `pageSize=3`, the gate never activates — zero cost today. |
| R8 | **Testability of virtualized scroll in JSDOM** | Medium | Mock `useVirtualizer` for unit tests. Rely on Playwright E2E for real scroll interaction. |

---

## 7. Verification Plan

### 7.1 Eager LandingPage

| Step | Command | Expected |
|------|---------|----------|
| Measure baseline | `pnpm build:analyze` | Record index chunk gzip |
| Apply change | Edit `src/routes/index.tsx` | Swap `lazy()` → import + element |
| Rebuild | `pnpm build:analyze` | LandingPage chunk gone; index chunk +1.5–3 kB |
| Typecheck | `pnpm typecheck` | Zero errors |
| Test | `pnpm test` | All pass |
| Lighthouse | `pnpm lhci` | LCP on `/` improves or stays neutral |
| **AC:** LCP improves or stays neutral. Index chunk ≤ +5 kB gzip. | | |

### 7.2 VirtualizedDataTable

| Step | Command | Expected |
|------|---------|----------|
| Install dep | `pnpm add @tanstack/react-virtual` | Strict mode compiles |
| Unit test | `pnpm test` | Renders visible rows, overscan, empty, loading, keyboard, a11y |
| Keyboard test | Playwright | Tab → arrow keys → Enter activates row |
| Gate test | Unit test | `data.length=3` → all rows rendered (no virtualization). `data.length=100` → virtualized |
| Bundle | `pnpm build:analyze` | Projects chunk + ≤6 kB (gated, so +0 at current scale) |
| Lighthouse | `pnpm lhci` | No TBT regression |
| **AC:** All tests pass. Virtualized table = identical behavior for ≤50 rows. DOM nodes = visible + 2×overscan for >50 rows. | | |

### 7.3 OptimizedImage

| Step | Command | Expected |
|------|---------|----------|
| Unit test | `pnpm test` | `<picture>` when srcAvif/srcWebp; `<img>` only otherwise; error state; aspectRatio |
| a11y | `pnpm axe` (via `.axe.test.tsx`) | Zero violations: alt required, no missing roles |
| Bundle | `pnpm build:analyze` | + ≤0.5 kB |
| **AC:** All tests pass. Avatar accepts srcSet/sizes without breaking existing behavior. | | |

### 7.4 Memoization

| Step | Command | Expected |
|------|---------|----------|
| DataTable handleSort | React DevTools | Sort handler stable across re-renders |
| ProjectList columns | React DevTools | Columns array reference stable (empty `[]` deps) |
| DashboardPage statItems | React DevTools | `buildStatItems` only called when `stats` changes |
| Regression | `pnpm typecheck && pnpm test` | Zero errors. Existing behavior tests pass. |
| **AC:** Every `useCallback`/`useMemo` has measured benefit or stabilizes child props. No preemptive memoization. | | |

### 7.5 Avatar augmentation

| Step | Command | Expected |
|------|---------|----------|
| Unit test | `pnpm test` | srcSet/sizes/loading passed to `<img>` |
| a11y | `pnpm axe` (via `.axe.test.tsx`) | Zero violations |
| Regression | `pnpm test` | All 15 existing Avatar tests pass |
| **AC:** No visual or behavioral regression. New props are optional and backward-compatible. | | |

### 7.6 Lighthouse baseline + config

| Step | Command | Expected |
|------|---------|----------|
| Capture pre | `pnpm lhci` | Record to `docs/perf/2026-07-07-phase8-baseline.md` |
| Apply all changes | — | — |
| Capture post | `pnpm lhci` | Compare. No regression on LCP, CLS, TBT, Perf, A11y |
| Update config | Edit `lighthouserc.cjs` | `unused-css-rules` → `warn`, add `total-byte-weight` |
| **AC:** All LHCI assertions pass with same or better scores. Baseline document committed. | | |

---

## 8. Implementation Order

| Order | Optimization | Rationale |
|-------|-------------|-----------|
| 1 | Avatar `loading="lazy"` + srcSet/sizes | Simplest change, zero risk, warms up pipeline |
| 2 | Memoization (DataTable, ProjectList, Dashboard) | Pure additive, easily testable |
| 3 | buildSrcSet + pickBestFormat + image.test.ts | Pure utility functions, independent |
| 4 | OptimizedImage + OptimizedImage.test.tsx + .axe.test.tsx | Structural addition, no real impact yet |
| 5 | Eager LandingPage in routes/index.tsx | Most impactful; measure before/after |
| 6 | VirtualizedDataTable + tests + a11y | Highest risk; do last, only if gated |
| 7 | DataTable virtualized prop + delegation | Integrates VirtualizedDataTable into existing API |
| 8 | ProjectList useMemo + DashboardPage useMemo | Wrap existing memoization into feature pages |
| 9 | Lighthouse config update + baseline capture | After all code changes are stable |
| 10 | Barrel exports + final gate | `pnpm lint && pnpm typecheck && pnpm test && pnpm build && pnpm axe` |

---

## 9. Test Surface Summary

| File | Type | Tests |
|------|------|-------|
| `VirtualizedDataTable.test.tsx` | NEW | 12 tests: visible rows, overscan, loading, empty, aria-rowindex, sort, click, keyboard, gate |
| `VirtualizedDataTable.axe.test.tsx` | NEW | 9 tests: role, aria, sort buttons, clickable rows, empty, loading, scrollable |
| `OptimizedImage.test.tsx` | NEW | 13 tests: `<picture>`, `<img>`, srcSet, error, aspectRatio, empty src |
| `OptimizedImage.axe.test.tsx` | NEW | 6 tests: alt required, decorative alt, error placeholder |
| `image.test.ts` | NEW | 10 tests: buildSrcSet, pickBestFormat, edge cases, throw |
| `useRenderProfiler.test.tsx` | NEW | 6 tests: console.warn, threshold, production no-op |
| `DataTable.test.tsx` | AUGMENT | +4 tests: virtualized=false, virtualized=true small, virtualized=true large, default |
| `Avatar.test.tsx` | AUGMENT | +6 tests: srcSet, sizes, loading lazy/eager, backward compat |
| `Avatar.axe.test.tsx` | AUGMENT | +1 test: srcSet/sizes/loading no violations |
| `e2e/projects.spec.ts` | AUGMENT | +3 tests: virtual scroll, scroll reveals rows, row click |
| `e2e/keyboard.spec.ts` | AUGMENT | +3 tests: Tab through virtual table, arrow keys, Enter activates |
| `e2e/axe.spec.ts` | AUGMENT | +2 tests: virtual table axe, dynamic content axe |

**Total new tests: ~75** across 12 test files.

---

## 10. Commit Structure

```
feat(perf): add loading="lazy" + srcSet/sizes to Avatar
feat(perf): memoize DataTable handleSort, ProjectList columns, DashboardPage statItems
feat(perf): add buildSrcSet and pickBestFormat utilities
feat(perf): add OptimizedImage component (AVIF/WebP picture)
feat(perf): make LandingPage eager (remove lazy import)
feat(perf): add VirtualizedDataTable with row count gate (>50)
feat(perf): integrate virtualized prop into DataTable
chore(lhci): re-enable unused-css-rules as warning, add total-byte-weight
docs: add phase-8 performance baseline measurement
```

Each commit independently revertible.

---

## 11. Budget & CWV Targets

| Metric | Current | Target |
|--------|---------|--------|
| JS gzip per route | 1.4–104 kB (≤200 warn / 350 error) | Maintain |
| CSS gzip per route | 0.3–4.6 kB (≤30 warn / 60 error) | Maintain |
| LCP | < 800 ms | Improve (eager LandingPage) or stay neutral |
| CLS | < 0.01 | Maintain |
| TBT | < 50 ms | Maintain |
| Performance score | ≥ 0.99 | ≥ 0.9 |
| Accessibility score | 1.0 | 1.0 |
| `unused-css-rules` | `off` | `warn` (≤30 kB) |
| `total-byte-weight` | not asserted | `warn` (≤500 kB) |

---

## 12. Rollback Plan

| Condition | Action |
|-----------|--------|
| LCP regresses > 10% on any route | Revert eager LandingPage commit |
| TBT > 200 ms on any route | Revert VirtualizedDataTable commit (or tighten gate) |
| Bundle exceeds 200 kB warn | Revert the optimization causing the increase |
| A11y score < 1.0 | Revert memoization or virtualization commit |
| Any CI gate fails | Revert the most recent commit, re-run CI |

```
git revert <offending-commit-hash>
pnpm build && pnpm check:budgets && pnpm lhci
```

---

## References

- `docs/perf/phase-8-measurement-and-verification.md` — Detailed measurement methodology + baseline template
- `AGENTS.md §6` — Review checklist applied to every change
- `roadmap.md` — Original phased delivery plan (Phase 8 = Performance Optimization)
