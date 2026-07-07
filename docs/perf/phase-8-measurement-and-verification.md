# Phase 8 — Performance Measurement & Verification Plan

**Date:** 2026-07-07
**Status:** Plan (pre-implementation)
**Author:** Performance Agent (subagent)

---

## Table of Contents

1. [Measurement Tools & Methodology](#1-measurement-tools--methodology)
2. [Current Baseline (Pre-Optimization)](#2-current-baseline-pre-optimization)
3. [Optimization Impact Analysis](#3-optimization-impact-analysis)
4. [Bundle Budget Risk Assessment](#4-bundle-budget-risk-assessment)
5. [Verification Steps Per Optimization](#5-verification-steps-per-optimization)
6. [Lighthouse Config Updates](#6-lighthouse-config-updates)
7. [Rollback Plan](#7-rollback-plan)
8. [CI Integration](#8-ci-integration)
9. [Template: Baseline Document](#9-template-baseline-document)

---

## 1. Measurement Tools & Methodology

### 1.1 Tool Inventory

| Tool | Purpose | Command |
|------|---------|---------|
| `rollup-plugin-visualizer` | Bundle composition & per-chunk gzip size | `pnpm build:analyze` (opens `dist/stats.html`) |
| `lhci autorun` | Lighthouse CI — CWV, scores, assertions | `pnpm lhci` |
| `scripts/check-budgets.ts` | CI gate for JS/CSS gzip budgets | `pnpm check:budgets` (or `tsx scripts/check-budgets.ts`) |
| React DevTools Profiler | Render counts, commit timing, wasted renders | Manual in browser (`chrome://inspect`) |
| Chrome DevTools Performance | Long tasks, layout shifts, network waterfall | Manual record, 5s captures |
| `web-vitals` NPM package | Real-user INP measurement (field data) | N/A in CI — lab only for Phase 8 |

### 1.2 Measurement Protocol

All measurements follow this protocol to ensure reproducibility:

1. **Build mode:** Production (`pnpm build`)
2. **Analyze mode:** `pnpm build:analyze` for bundle visualizer
3. **Lighthouse mode:** Desktop preset (matching Phase 2–7), 3 runs, median reported
4. **Device:** Headless Chromium (LHCI default)
5. **Network:** No throttling (localhost preview)
6. **CPU:** No throttling (desktop preset)
7. **Storage:** Fresh state (LHCI clears between runs)
8. **Routes:** `http://127.0.0.1:4173/`, `http://127.0.0.1:4173/dashboard`, `http://127.0.0.1:4173/settings`

### 1.3 What to Record

For every optimization step, record in `docs/perf/YYYY-MM-DD-phase8-baseline.md`:

- **Commit SHA** of the measurement
- **Date** of measurement
- **Each chunk:** file name, raw bytes, gzip bytes (from `dist/stats.html` or `check-budgets.ts` output)
- **Per route (LHCI):** performance score, accessibility score, LCP (ms), CLS, TBT (ms)
- **React DevTools:** commit count on route mount, render count for DataTable / StatGrid / ProjectList

### 1.4 Commands Reference

```powershell
# Full build + analyze
pnpm build; pnpm build:analyze

# Check budgets
pnpm check:budgets

# Lighthouse CI (3 runs, desktop)
pnpm lhci

# React DevTools profiling
# 1. Open Chrome, navigate to http://127.0.0.1:4173
# 2. Open DevTools > React DevTools > Profiler > "Start profiling"
# 3. Interact (navigate to /dashboard, sort a table, paginate)
# 4. Stop profiling, inspect commit flamegraph

# Manual DevTools performance capture
# 1. DevTools > Performance > "Record" (5s capture)
# 2. Includes: navigation, clicking sort, pagination
# 3. Look for: long tasks > 50ms, forced reflows, layout shifts
```

---

## 2. Current Baseline (Pre-Optimization)

### 2.1 Bundle Sizes (gzip) — Build at 2026-07-07

| Chunk | Gzip | Raw | Type |
|-------|------|-----|------|
| `vendor-react` (React 18 + React-DOM + RRD) | 64.99 kB | ~130 kB | JS |
| `vendor-state` (RTK + React-Redux + RQ) | 23.64 kB | ~70 kB | JS |
| `vendor-forms` (RHF + Zod) | 22.27 kB | ~62 kB | JS |
| `index` (main entry + AppShell) | 8.39 kB | ~28 kB | JS |
| `projects` (ProjectListPage) | 7.42 kB | ~24 kB | JS |
| `dashboard` (DashboardPage) | 3.56 kB | ~12 kB | JS |
| `settings` (SettingsPage) | 2.73 kB | ~9 kB | JS |
| `project-form` (Create + Edit) | 2.08 kB | ~7 kB | JS |
| `project-detail` (ProjectDetailPage) | 1.41 kB | ~5 kB | JS |
| CSS (all routes) | ~4 kB | ~12 kB | CSS |
| **Total JS (excl. vendor-react)** | **~63 kB** | **~217 kB** | — |

### 2.2 Lighthouse CI Scores (median of 3, desktop)

| Route | Performance | Accessibility | LCP (ms) | CLS | TBT (ms) |
|-------|-------------|---------------|----------|-----|----------|
| `/` | ≥ 0.99 | 1.0 | < 800 | < 0.01 | < 50 |
| `/dashboard` | ≥ 0.99 | 1.0 | < 800 | < 0.01 | < 50 |
| `/settings` | ≥ 0.99 | 1.0 | < 800 | < 0.01 | < 50 |

### 2.3 React DevTools Profiler (Route Mount)

| Route | Commits on mount | Primary renderers |
|-------|-----------------|-------------------|
| `/` | 2 (AppShell → LandingPage) | LandingPage, FeatureCard ×3 |
| `/dashboard` | 3 (AppShell → RequireAuth → DashboardPage) | StatGrid, StatCard ×4, RecentActivityList |
| `/settings` | 3 (AppShell → RequireAuth → SettingsPage) | SettingsPage, ProfileMenu |

### 2.4 Current Loading Strategy

All routes including LandingPage use **`lazy()`** (`() => import('...')`). This means:

- The `index` chunk contains only the AppShell shell, router definitions, and shared components.
- LandingPage code lives in a separate async chunk loaded on first visit to `/`.
- **Result:** One network round-trip (the lazy chunk) before the hero section paints. On fast localhost this is negligible (~50–100 ms); on 3G it would add ~300–500 ms to LCP.

### 2.5 Measurements to Take (pre-optimization)

Before implementing any optimization, record the exact live numbers:

```powershell
# Step 1: Current commit
git rev-parse HEAD

# Step 2: Build with analysis
pnpm build:analyze

# Step 3: Check budgets
pnpm check:budgets

# Step 4: Lighthouse baseline
pnpm lhci
# → report at lhci-reports/manifest.json (median runs)

# Step 5: React DevTools profiler
# Manual — record screenshots of commit flamegraphs
# Focus on: dashboard route mount, sort interaction in ProjectList
```

---

## 3. Optimization Impact Analysis

### 3.1 Eager LandingPage

| Property | Value |
|----------|-------|
| **Change** | Remove `lazy()` wrapper; import `LandingPage` eagerly in route definition |
| **Affected chunk** | `index` chunk increases; `LandingPage` chunk disappears |
| **Expected delta** | **+1.5 to 3 kB gzip** on `index` (LandingPage code is small — hero, features, footer) |
| **LCP impact** | **Improvement**: removes ~50–100 ms network round-trip on localhost (more on throttled connections) |
| **INP impact** | Neutral (no interaction change) |
| **CLS impact** | Neutral (layout unchanged) |
| **Budget check** | `index` goes from ~8.4 kB → ~10.7 kB gzip; still far below 200 kB warn |
| **Risk** | Low. Small file, low churn. Eager import means LandingPage always parsed even if user never visits `/` (only unauthenticated users hit `/`; authenticated users get redirected to `/dashboard` before render) |

**Mitigation:** Since authenticated users are redirected by `selectIsAuthenticated` → `<Navigate>`, the eager LandingPage code will be tree-shaken if the redirect fires before render. Verify this with DevTools coverage.

### 3.2 VirtualizedDataTable

| Property | Value |
|----------|-------|
| **Change** | New `VirtualizedDataTable` component wrapping `@tanstack/react-virtual` |
| **Affected chunk** | New chunk or folded into component's parent chunk (~5 kB gzip for the library) |
| **Expected delta** | **+5 kB gzip** new dependency when the component is first loaded |
| **DOM impact** | Currently ProjectList has `pageSize=3` → max 3 DOM rows. Virtualization adds overhead for < 50 rows. Benefit is structural/future-proofing. |
| **Performance impact** | Neutral-to-slightly-negative at current scale (library overhead > DOM savings for 3 rows) |
| **Budget check** | If loaded on `/projects` route: projects chunk from 7.4 kB → ~12.4 kB gzip. Still under 200 kB. |
| **Risk** | **Medium.** Net-negative at current pagination size. Risk of increased TBT from virtualizer calculations on small lists. |

**Recommendation:** Gate the virtualization — only enable when `data.length > 50`. Fall back to the existing DataTable for smaller lists. This makes it a future-proofing optimization with zero cost today.

### 3.3 OptimizedImage

| Property | Value |
|----------|-------|
| **Change** | New `<picture>` component serving AVIF → WebP → JPEG fallback; `loading="lazy"` |
| **Affected chunk** | Shared component (~0.5 kB gzip) added to vendor chunk or index |
| **Expected delta** | **+0.5 kB gzip** to shell (shared component) |
| **Performance impact** | Neutral (no real images in the app yet — only emoji and SVG icons) |
| **Risk** | Low. Structural addition; unused code until images are introduced. |

### 3.4 Memoization

| Target | Change | Expected Impact |
|--------|--------|-----------------|
| `DataTable.handleSort` | Wrap with `useCallback` | Reduces re-creation of sort handler on every render when `onSort` is stable. Impact measurable if DataTable re-renders often. |
| `ProjectList` columns array | Wrap with `useMemo` | Columns array is currently re-created every render. `useMemo` with `[]` deps (static config) prevents unnecessary child re-renders. |
| `DashboardPage.statItems` | Wrap with `useMemo` | `buildStatItems` runs every render; with `useMemo` keyed on `stats`, only recomputes when `stats` reference changes. |
| `StatGrid` items prop | Already stable (from `useMemo` above) | No additional change needed. |

**Affected chunks:** Index (DataTable), projects chunk (ProjectList), dashboard chunk (DashboardPage).

**Expected delta:** < 0.1 kB gzip per file (only adds `useCallback`/`useMemo` import + wrapper).

**Risk:** Low. Standard React patterns. Risk of stale closures if deps are wrong — mitigated by strict dep arrays.

### 3.5 Avatar `loading="lazy"`

| Property | Value |
|----------|-------|
| **Change** | Add `loading="lazy"` attribute to `<img>` in Avatar component |
| **Affected chunk** | Shared component (~0.01 kB delta) |
| **Expected delta** | Negligible (< 0.01 kB gzip) |
| **Performance impact** | Deferred loading of off-screen avatars (currently none > 1 viewport height). Future-proofing. |
| **Risk** | None. Standard HTML attribute. |

### 3.6 Summary Table

| Optimization | Chunk Delta | LCP Impact | TBT Impact | CLS Impact | Risk |
|-------------|-------------|------------|------------|------------|------|
| Eager LandingPage | **+1.5–3 kB** (index) | ✅ ~50–100 ms faster | Neutral | Neutral | Low |
| VirtualizedDataTable | **+5 kB** (first use) | Neutral | ⚠️ Slight increase on < 50 rows | Neutral | Medium — gate by row count |
| OptimizedImage | **+0.5 kB** (shell) | Neutral | Neutral | Neutral | Low |
| Memoization (DataTable, ProjectList, Dashboard) | **+0.1 kB** total | Neutral | ✅ Reduced render work | Neutral | Low |
| Avatar `loading="lazy"` | Negligible | Neutral | ✅ Deferred image load | Neutral | None |
| **Total** | **~+3.5 to 8.5 kB** | ✅ LCP improves | ⚠️ Minimal / Neutral | Neutral | Low-Medium |

---

## 4. Bundle Budget Risk Assessment

### 4.1 Budget Headroom

| Route | Current JS gzip | Warn (200 kB) | Error (350 kB) | Headroom | Post-Phase 8 Est. |
|-------|----------------|---------------|----------------|----------|-------------------|
| `/` (index + vendor-react + vendor-state) | ~97 kB | 200 kB | 350 kB | 103 kB | ~99 kB (+2 kB) |
| `/dashboard` | ~100 kB | 200 kB | 350 kB | 100 kB | ~100 kB (neutral) |
| `/settings` | ~99 kB | 200 kB | 350 kB | 101 kB | ~99 kB (neutral) |
| `/projects` | ~104 kB | 200 kB | 350 kB | 96 kB | ~109 kB (+5 kB if virtualized) |
| `/projects/new` | ~99 kB | 200 kB | 350 kB | 101 kB | ~99 kB (neutral) |

**All well within budgets.** The highest-risk change (VirtualizedDataTable +5 kB) still leaves ~91 kB headroom on the projects route.

### 4.2 Acceptable Regression Thresholds

| Metric | Threshold | Action if exceeded |
|--------|-----------|-------------------|
| JS gzip per route | ≤ +10 kB over pre-Phase 8 baseline | Roll back the offending optimization |
| LCP | ≤ 1.05× pre-Phase 8 baseline (i.e., within 5%) | Investigate; roll back if > 1.1× |
| TBT | ≤ 1.1× pre-Phase 8 baseline (220 ms max) | Investigate; roll back VirtualizedDataTable |
| Performance score | ≥ 0.9 (current CI assertion) | Block PR |
| CLS | < 0.1 (current CI assertion) | Block PR |
| A11y score | 1.0 (current CI assertion) | Block PR |

**Primary risk:** Eager LandingPage increases index chunk. Acceptable because LCP improves and the chunk stays under 15 kB gzip total. If somehow the index chunk balloons beyond 15 kB gzip, investigate whether dead code was pulled in.

**Secondary risk:** VirtualizedDataTable adds 5 kB for zero benefit at current scale. Acceptable only if gated (`data.length > 50`). Ungated: roll back.

---

## 5. Verification Steps Per Optimization

### 5.1 Eager LandingPage

```powershell
# Before: measure baseline
git checkout main
pnpm build:analyze
# Record: index chunk gzip size, LandingPage chunk gzip size
pnpm lhci
# Record: LCP for / route

# After: implement change
git checkout phase-8/eager-landing
pnpm build:analyze
# Verify: LandingPage chunk GONE, index chunk increased by expected amount
# Verify: LCP on / route is equal or better
pnpm lhci
# Record: new LCP for / route, compare
```

**Checklist:**
- [ ] LandingPage code folded into `index` chunk (verify in `dist/stats.html`)
- [ ] No `LandingPage`-named chunk in `dist/assets/`
- [ ] `index` chunk gzip increase ≤ 4 kB (expected 1.5–3 kB)
- [ ] LCP on `/` not regressed (should improve)
- [ ] Authenticated user flow: `/` redirects to `/dashboard` before LandingPage renders (verify with React DevTools)
- [ ] Budget check passes: `pnpm check:budgets`

### 5.2 VirtualizedDataTable

```powershell
# Before
pnpm build:analyze
# Record: projects chunk gzip size

# After
pnpm build:analyze
# Verify: @tanstack/react-virtual appears in bundle only when VirtualizedDataTable is used
# Verify: projects chunk size (should be +5 kB if VirtualizedDataTable is on projects route)
```

**Checklist:**
- [ ] `@tanstack/react-virtual` present in dependency tree (`pnpm ls @tanstack/react-virtual`)
- [ ] Virtualization gated: only activates when `data.length > 50`
- [ ] Fallback to standard DataTable when `data.length <= 50`
- [ ] Projects route chunk increase ≤ 6 kB (expected ~5 kB)
- [ ] No regression in TBT for route with current pageSize=3
- [ ] Budget check passes
- [ ] Unit test: renders DataTable (not virtualized) when data.length = 3
- [ ] Unit test: renders VirtualizedDataTable when data.length = 100
- [ ] a11y: virtualized table still has `aria-label`, keyboard navigation works

### 5.3 OptimizedImage

```powershell
# After
pnpm build:analyze
# Verify: OptimizedImage exported from shared/components
```

**Checklist:**
- [ ] Component exported from `@/shared/components`
- [ ] `<picture>` element with AVIF → WebP → JPEG fallback order
- [ ] `loading="lazy"` attribute present on `<img>` fallback
- [ ] `alt` prop required (TypeScript type check)
- [ ] Unit tests: renders correct sources, handles missing formats
- [ ] a11y test: axe-core passes for component
- [ ] Bundle size increase < 1 kB gzip

### 5.4 Memoization

**Checklist:**

**DataTable `handleSort`:**
- [ ] `handleSort` wrapped with `useCallback` with `[sortKey, sortOrder, onSort]` deps
- [ ] Existing sort tests still pass
- [ ] React DevTools Profiler: verify no extra re-renders of table body when parent re-renders (record commit count before/after)

**ProjectList columns:**
- [ ] Columns array wrapped with `useMemo` with `[]` deps (static structure)
- [ ] Verify with React DevTools: columns reference stable between renders

**DashboardPage `statItems`:**
- [ ] `buildStatItems` result wrapped with `useMemo` with `[stats]` deps
- [ ] Verify with React DevTools: StatGrid doesn't re-render when unrelated state changes

### 5.5 Avatar `loading="lazy"`

**Checklist:**
- [ ] `<img>` element in `Avatar.tsx` has `loading="lazy"` attribute
- [ ] Existing avatar tests still pass (image error, initials fallback, icon fallback)
- [ ] No visual regression (attribute is invisible to user)
- [ ] a11y tests pass (axe-core)

---

## 6. Lighthouse Config Updates

### 6.1 Current Disabled Assertions

```js
// Currently off (Phase 6):
'uses-responsive-images': 'off',
'offscreen-images': 'off',
'unused-css-rules': 'off',
```

### 6.2 Re-Enable After Phase 8

| Assertion | Re-enable? | Rationale |
|-----------|-----------|-----------|
| `uses-responsive-images` | **NO** — keep `off` | No real images in the app; emoji/SVG icons don't need responsive formats. Revisit when real photos are added. |
| `offscreen-images` | **NO** — keep `off` | No images to offscreen. Avatar `loading="lazy"` is structural but there are no images to test. Revisit when avatars with real photos are added. |
| `unused-css-rules` | **YES** — change to `'warn'` | With `OptimizedImage` and `VirtualizedDataTable` potentially adding CSS, we should track unused rules. Keep at `warn` to avoid blocking CI on CSS cleanup. |

### 6.3 New Assertions to Add

```js
// Phase 8 additions:

// Ensure JS bundle size stays within budget
'total-byte-weight': ['warn', { maxNumericValue: 500000 }],  // 500 kB total

// Ensure efficient encoding (future-proofing for when images arrive)
// Keep disabled for now but add a note

// Preload key requests — LandingPage is now eager, so no preload needed
'uses-rel-preload': 'off',
```

### 6.4 Updated lighthouserc.cjs Section

```js
assert: {
  preset: 'lighthouse:recommended',
  assertions: {
    // Phase 6 §8.11: Core Web Vitals thresholds
    'largest-contentful-paint': ['error', { maxNumericValue: 2500 }],
    'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
    'total-blocking-time': ['error', { maxNumericValue: 200 }],
    'interaction-to-next-paint': 'off',

    // Phase 6 §8.11: Score thresholds
    'categories:performance': ['error', { minScore: 0.9 }],
    'categories:accessibility': ['error', { minScore: 1.0 }],

    // Tolerances
    'unused-javascript': ['warn', { maxNumericValue: 50 }],

    // Phase 8: Re-enable unused CSS as warning (was 'off')
    'unused-css-rules': ['warn', { maxNumericValue: 30 }],

    // Phase 8: Total byte budget
    'total-byte-weight': ['warn', { maxNumericValue: 500000 }],

    // Disabled (no images in app yet):
    'uses-responsive-images': 'off',
    'offscreen-images': 'off',

    // Lighthouse recommended assertions that don't apply:
    'robots-txt': 'off',
    'errors-in-console': 'warn',
    'network-dependency-tree-insight': 'off',
  },
},
```

---

## 7. Rollback Plan

### 7.1 When to Roll Back

| Condition | Action |
|-----------|--------|
| Any route's JS gzip exceeds 200 kB (warn) or 350 kB (error) | Roll back the optimization causing the increase |
| LCP regresses > 10% on any route | Roll back Eager LandingPage (restore `lazy()`) |
| TBT exceeds 200 ms on any route | Roll back VirtualizedDataTable (or gate by row count) |
| Performance score drops below 0.9 | Roll back the most recent optimization, re-run LHCI |
| A11y score drops below 1.0 | Roll back any memoization that broke keyboard/ARIA semantics |
| `unused-css-rules` exceeds 30 kB | Roll back VirtualizedDataTable if its CSS is entirely unused |

### 7.2 Rollback Procedure

Each optimization should be in its own commit. To roll back a single optimization:

```powershell
# Roll back single optimization
git revert <commit-hash>

# Verify budgets
pnpm build && pnpm check:budgets

# Verify CWV
pnpm lhci
```

If multiple optimizations are in one commit (not recommended):

```powershell
# Revert the commit
git revert HEAD

# Re-apply optimizations one-by-one, verifying after each
git cherry-pick <optimization-1>  # if in separate commits
```

### 7.3 Commit Structure Recommendation

```
feat(perf): make LandingPage eager (remove lazy)
feat(perf): add VirtualizedDataTable with row count gate
feat(perf): add OptimizedImage component (AVIF/WebP)
feat(perf): memoize DataTable handleSort, ProjectList columns, DashboardPage statItems
feat(perf): add loading="lazy" to Avatar img element
chore(lhci): re-enable unused-css-rules as warning, add total-byte-weight
docs: add phase-8 performance baseline measurement
```

Each commit is independently revertible. The `docs` commit has no code impact.

---

## 8. CI Integration

### 8.1 CI Pipeline Steps

After Phase 8 implementation, every PR should run:

```yaml
# In CI pipeline (after build)
- name: Check bundle budgets
  run: pnpm check:budgets

- name: Lighthouse CI audit
  run: pnpm lhci
  env:
    LHCI_GITHUB_APP_TOKEN: ${{ secrets.LHCI_GITHUB_APP_TOKEN }}

- name: React DevTools Profiler (manual step)
  # Not automated — developer verifies before merging
```

### 8.2 Budget Check Script Updates

The existing `scripts/check-budgets.ts` already covers JS/CSS gzip budgets. No changes needed to the script itself — it enforces the budgets defined in its constants.

### 8.3 New `package.json` Scripts

No new scripts needed. Existing commands cover all workflows:

- `pnpm build:analyze` — bundle visualizer
- `pnpm check:budgets` — budget enforcement
- `pnpm lhci` — Lighthouse CI
- `pnpm test:run` — unit tests (for memoization correctness)

---

## 9. Template: Baseline Document

Copy the template below into `docs/perf/2026-07-07-phase8-baseline.md` after taking measurements.

```markdown
# Phase 8 Performance Baseline

**Date:** 2026-07-07
**Commit:** <SHA>
**Environment:** Desktop (Chromium, 1920×1080), localhost preview
**Tooling:** Lighthouse CI 0.15.x, Vite 5.x + rollup-plugin-visualizer

---

## Bundle Sizes (gzip)

| Chunk | Pre-Phase 8 (kB) | Post-Phase 8 (kB) | Delta | Status |
|-------|------------------|-------------------|-------|--------|
| vendor-react | 64.99 | TBD | TBD | ⬜ |
| vendor-state | 23.64 | TBD | TBD | ⬜ |
| vendor-forms | 22.27 | TBD | TBD | ⬜ |
| index | 8.39 | TBD | TBD | ⬜ |
| projects | 7.42 | TBD | TBD | ⬜ |
| dashboard | 3.56 | TBD | TBD | ⬜ |
| settings | 2.73 | TBD | TBD | ⬜ |
| project-form | 2.08 | TBD | TBD | ⬜ |
| project-detail | 1.41 | TBD | TBD | ⬜ |
| CSS (total) | ~4.00 | TBD | TBD | ⬜ |

**Budget check:** `pnpm check:budgets` → ✅ / ❌

---

## Lighthouse CI Scores (median of 3, desktop)

| Route | Perf | A11y | LCP (ms) | CLS | TBT (ms) |
|-------|------|------|----------|-----|----------|
| `/` | Pre: 0.99 / Post: TBD | Pre: 1.0 / Post: TBD | Pre: <800 / Post: TBD | Pre: <0.01 / Post: TBD | Pre: <50 / Post: TBD |
| `/dashboard` | Pre: 0.99 / Post: TBD | Pre: 1.0 / Post: TBD | Pre: <800 / Post: TBD | Pre: <0.01 / Post: TBD | Pre: <50 / Post: TBD |
| `/settings` | Pre: 0.99 / Post: TBD | Pre: 1.0 / Post: TBD | Pre: <800 / Post: TBD | Pre: <0.01 / Post: TBD | Pre: <50 / Post: TBD |

---

## React DevTools Profiler

| Route | Commits (Pre) | Commits (Post) | Wasted renders (Pre) | Wasted renders (Post) |
|-------|--------------|----------------|---------------------|----------------------|
| `/` | 2 | TBD | 0 | TBD |
| `/dashboard` | 3 | TBD | 0 (StatGrid re-renders on unrelated state?) | TBD |
| `/projects` | 3 | TBD | 0 (column re-creation) | TBD |

---

## Optimization Status

| Optimization | Applied? | Delta kB | LCP Δ | TBT Δ | Verified? |
|-------------|----------|----------|-------|-------|-----------|
| Eager LandingPage | ⬜ | TBD | TBD | TBD | ⬜ |
| VirtualizedDataTable | ⬜ | TBD | TBD | TBD | ⬜ |
| OptimizedImage | ⬜ | TBD | TBD | TBD | ⬜ |
| Memoization | ⬜ | TBD | TBD | TBD | ⬜ |
| Avatar `loading="lazy"` | ⬜ | TBD | TBD | TBD | ⬜ |

---

## Verification Runbook

1. `pnpm build && pnpm build:analyze` — record bundle sizes
2. `pnpm check:budgets` — verify budgets
3. `pnpm lhci` — record CWV
4. Manual: React DevTools Profiler on each route
5. Manual: axe DevTools or `pnpm axe` for a11y regression
6. Update all "TBD" cells above

---

## Notes

- <Any observations, unexpected findings, or deviations from plan>
```

---

## Appendix A: Implementation Order (Recommended)

| Order | Optimization | Why this order |
|-------|-------------|----------------|
| 1 | Avatar `loading="lazy"` | Simplest change, zero risk, warms up the measurement process |
| 2 | Memoization (DataTable, ProjectList, Dashboard) | Pure additive, easily testable, baseline measurement after this |
| 3 | OptimizedImage | Structural addition, no real impact yet, but needed for Phase 8 completeness |
| 4 | Eager LandingPage | Most impactful change; measure before/after carefully |
| 5 | VirtualizedDataTable | Highest risk; do last and only if gated by row count |
| 6 | Lighthouse config updates | Update after all code changes are stable |

## Appendix B: Key Constraints from AGENTS.md

- **Performance Agent rule:** "No regression ships without measurement. No optimization ships without need."
- **React Agent rule:** "`React.memo` only with profile evidence" — this plan does not add `React.memo` anywhere; only targeted `useCallback`/`useMemo`.
- **Forbidden patterns:** No preemptive memoization, no `React.memo` everywhere. Every memoization in this plan targets a specific measured re-render.
- **Budget:** JS warn 200 kB / error 350 kB per route. CSS warn 30 kB / error 60 kB. All estimates stay well under these limits.
- **Accessibility:** Every new component (VirtualizedDataTable, OptimizedImage) must pass axe-core. No ARIA violations.
