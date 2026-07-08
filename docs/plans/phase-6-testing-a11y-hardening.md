# Phase 6 — Testing & A11y Hardening

> **Status:** Planned  
> **Owner:** AI Workflow Agent  
> **Target branch:** `feat/phase-6-testing-a11y`  
> **Dependencies:** Phase 5 complete (settings remediation merged)

---

## 1. Feature Request

Achieve hard coverage gates, conduct a full accessibility audit, and document every per-feature edge case so the codebase meets AGENTS.md standards before production launch.

### Scope

1. **Coverage push (components, hooks, pages)** — reach 80% lines / 75% branches / 80% functions globally, 100% branches on critical paths
2. **Accessibility audit** — automated axe-core CI gate + manual NVDA/VoiceOver + keyboard-only walkthrough
3. **Edge case registry** — structured JSON schema documented per-feature in `docs/edge-cases/`

---

## 2. Architecture Overview (ASCII Diagram)

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                            Phase 6 Architecture                                 │
├──────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  ┌─────────────────────────────────┐    ┌──────────────────────────────┐        │
│  │       src/test-utils/           │    │     docs/edge-cases/         │        │
│  │  ┌───────────────────────────┐  │    │  ┌────────────────────────┐  │        │
│  │  │ render.tsx               │  │    │  │ registry.json          │  │        │
│  │  │  - customRender()        │  │    │  │  - Zod validated       │  │        │
│  │  │  - providers wrapper     │  │    │  │  - per-feature entries │  │        │
│  │  │  - RenderOptions type    │  │    │  └────────────────────────┘  │        │
│  │  └───────────────────────────┘  │    └──────────────────────────────┘        │
│  │  ┌───────────────────────────┐  │                                           │
│  │  │ a11y.tsx                 │  │    ┌──────────────────────────────┐        │
│  │  │  - testA11y() helper     │  │    │     playwright.config.ts     │        │
│  │  │  - announce() utility    │  │    │  + a11y test projects        │        │
│  │  └───────────────────────────┘  │    │  - axe-chromium             │        │
│  │  ┌───────────────────────────┐  │    │  - axe-firefox              │        │
│  │  │ msw.tsx                  │  │    │  - keyboard-chromium         │        │
│  │  │  - mswServer singleton   │  │    │  - mobile-chromium           │        │
│  │  │  - handler generators    │  │    └──────────────────────────────┘        │
│  │  └───────────────────────────┘  │                                           │
│  │  ┌───────────────────────────┐  │    ┌──────────────────────────────┐        │
│  │  │ types.ts                 │  │    │   vitest.config.ts           │        │
│  │  │  - shared test types     │  │    │  + coverage thresholds       │        │
│  │  └───────────────────────────┘  │    │  - 80% lines / 75% branches │        │
│  └─────────────────────────────────┘    └──────────────────────────────┘        │
│                                                                                  │
└──────────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Folder Structure (Exact Paths)

```
src/
  test-utils/
    __tests__/
      render.test.ts
      a11y.test.ts
      msw.test.ts
      types.test.ts
    render.tsx              # customRender with providers
    a11y.tsx                # testA11y helper, announce()
    msw.tsx                 # mswServer, response generators
    types.ts                # shared test type definitions
    index.ts                # barrel export

  shared/components/
    Toast/
      Toast.tsx
      ToastRegion.tsx
      Toast.test.tsx
      Toast.axe.test.tsx    # NEW — a11y-specific tests
      ToastRegion.test.tsx
      ToastRegion.axe.test.tsx  # NEW
    Spinner/
      Spinner.tsx
      Spinner.test.tsx
      Spinner.axe.test.tsx  # NEW
    Skeleton/
      Skeleton.tsx
      Skeleton.test.tsx
      Skeleton.axe.test.tsx # NEW
    SkipLink/
      SkipLink.tsx
      SkipLink.test.tsx
      SkipLink.axe.test.tsx # NEW

  features/
    auth/
      components/
        LoginForm.axe.test.tsx   # NEW
        RegisterForm.axe.test.tsx # NEW
    settings/
      Settings.axe.test.tsx      # NEW
    dashboard/
      Dashboard.axe.test.tsx     # NEW
    reports/
      Reports.axe.test.tsx       # NEW

docs/
  edge-cases/
    registry.json           # structured edge case catalog
    README.md               # how to document edge cases
  plans/
    phase-6-testing-a11y-hardening.md  # THIS FILE
```

---

## 4. Module Dependencies (Direction Arrows)

```
src/test-utils/ (no deps on app code)
  ├── render.tsx ──> @testing-library/react, @testing-library/user-event
  ├── a11y.tsx   ──> jest-axe, axe-core
  ├── msw.tsx    ──> msw
  └── types.ts   ──> (standalone, no external deps)

*.test.tsx ────> src/test-utils/* (consumes test utilities)
*.test.tsx ────> *component under test* (direct import)
*.axe.test.tsx ──> src/test-utils/render, src/test-utils/a11y
```

**No cyclic dependencies.** Test utilities never import application code. Application code never imports test utilities.

---

## 5. State Decision with Justification

| Concern | Decision | Justification |
|---------|----------|---------------|
| Test workflow state | **No global state** | All test utilities are stateless wrapper functions. `mswServer` is a singleton, no Redux/context needed. |
| Edge case registry | **Static JSON file** | Read at design time; no runtime querying needed. |
| A11y audit results | **CI artifacts** | Not application state — ephemeral build output. |
| Coverage data | **Vitest coverage output** | Generated + reported in CI; not stored in app. |

**No new global state introduced.** All testing infrastructure is dev-only and stateless.

---

## 6. Coverage Requirements (Per Roadmap §6.1)

### 6.1 Every Shared Component (`src/shared/components/*`)

| Requirement | Test type | Example assertion |
|-------------|-----------|-------------------|
| **Render test** | `*.test.tsx` | Mounts without error, renders expected ARIA role |
| **Interaction test** | `*.test.tsx` | Click fires callback, focus moves correctly, keyboard activates |
| **Edge case test** | `*.test.tsx` | Empty state, loading state, error state, disabled state |
| **A11y test** | `*.axe.test.tsx` | Zero critical/serious violations via `jest-axe` |

**Affected components:** Spinner, Skeleton, Toast, ToastRegion, SkipLink, Sidebar, TopBar, AppShell, AuthLayout

### 6.2 Every API Hook (`src/features/*/api/*`)

| Requirement | Test type | Example assertion |
|-------------|-----------|-------------------|
| **Success case** | `*.test.ts` | Data returned, loading transitions `true → false`, mutation invalidates cache |
| **Error case** | `*.test.ts` | Network error → onError called, toast shown, Redux dispatch |
| **Loading state** | `*.test.ts` | `isPending === true` during mutation, `isLoading === true` during query |

**Notes:** Use MSW to simulate responses. Test 401, 409, 500 error codes separately. Test optimistic updates roll back on error.

### 6.3 Every Page (`src/features/*/pages/*`)

| Requirement | Test type | Example assertion |
|-------------|-----------|-------------------|
| **Integration test** | `*.test.tsx` | Critical path: render → interact → data appears → navigate |
| **Error boundary test** | `*.test.tsx` | Simulate render crash → fallback UI appears, retry restores |

**Notes:** Integration tests should cover the full data flow via MSW. Error boundary tests can use `throw new Error()` in a mock child.

---

## 7. Type Contracts (TypeScript Interfaces)

```typescript
// ===== src/test-utils/types.ts =====

// --- Render helpers ---
export interface RenderWithProvidersOptions {
  /** Initial route for MemoryRouter */
  initialEntries?: string[]
  /** Redux preloaded state */
  preloadedState?: Record<string, unknown>
  /** React Query options */
  queryClientOptions?: {
    defaultOptions?: {
      queries?: { retry?: boolean }
    }
  }
  /** Custom wrappers to compose */
  wrapper?: React.ComponentType<{ children: React.ReactNode }>
}

// --- A11y helpers ---
export interface A11yHelpers {
  /** Run axe on rendered container */
  testA11y: (container: HTMLElement) => Promise<A11yAssertion>
  /** Live region announcer */
  announce: (message: string, politeness?: 'polite' | 'assertive') => void
  /** Focus trap tester */
  testFocusTrap: (trapElement: HTMLElement) => Promise<FocusTrapResult>
}

export interface A11yAssertion {
  violations: A11yViolation[]
  passes: number
  incomplete: number
}

export interface A11yViolation {
  id: string
  impact: 'critical' | 'serious' | 'moderate' | 'minor'
  description: string
  nodes: number
  help: string
  helpUrl: string
}

export interface FocusTrapResult {
  trapped: boolean
  firstElement: Element | null
  lastElement: Element | null
  escapeHatch: Element | null
}

// --- MSW helpers ---
export interface MSWHelpers {
  server: ReturnType<typeof setupServer>
  reset: () => void
  /** Override handlers for specific test */
  use: (...handlers: HttpHandler[]) => void
}

// --- Edge case registry ---
export type EdgeCaseSeverity = 'critical' | 'high' | 'medium' | 'low'
export type EdgeCaseCategory = 'loading' | 'empty' | 'error' | 'offline' | 'empty_state' | 'invalid_input' | 'permission_denied' | 'timeout' | 'concurrent_edit' | 'overflow'

export interface EdgeCaseEntry {
  id: string                     // Branded: EdgeCaseId
  feature: string                // Feature name (e.g., "settings")
  scenario: string               // Human-readable scenario
  category: EdgeCaseCategory
  severity: EdgeCaseSeverity
  description: string
  expectedBehavior: string
  testCoverage: 'unit' | 'integration' | 'e2e' | 'none'
  testFile?: string              // Relative path to test
  relatedBug?: string            // GitHub issue URL
}

export interface EdgeCaseRegistry {
  schemaVersion: '1.0'
  lastUpdated: string            // ISO 8601
  entries: EdgeCaseEntry[]
}

// --- A11y audit ---
export type A11yStatus = 'pass' | 'fail' | 'manual-review' | 'not-tested'

export interface A11yAuditResult {
  route: string
  status: A11yStatus
  auditDate: string
  violations: A11yViolation[]
  tool: 'axe-core' | 'manual-nvda' | 'manual-voiceover' | 'keyboard-only' | 'color-contrast'
  notes?: string
}

// --- Branded IDs ---
declare const TestIdBrand: unique symbol
export type TestId = string & { [TestIdBrand]: never }

declare const ScenarioIdBrand: unique symbol
export type ScenarioId = string & { [ScenarioIdBrand]: never }

declare const EdgeCaseIdBrand: unique symbol
export type EdgeCaseId = string & { [EdgeCaseIdBrand]: never }

declare const A11yRuleIdBrand: unique symbol
export type A11yRuleId = string & { [A11yRuleIdBrand]: never }
```

---

## 7. Risks with Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Test utilities leak to production | Low | High | CI gate verifies zero test deps in `dist/` |
| axe-core E2E flakiness | Medium | Low | Retry 2x, quarantine flaky tests |
| Coverage threshold blocks valid PR | Low | Medium | Start at 80/75/80 — achievable based on Phase 5 data |
| CI time exceeds 5 min | Low | Medium | Shard across 4 (unit) + 12 (E2E) runners, cache aggressively |
| Lighthouse false negatives | Low | Medium | Median of 3 runs, desktop preset |
| New a11y tests fail in CI but pass locally | Medium | Medium | Pin Playwright browser versions and use the same browser channel locally/CI |
| A11y manual audit deferred indefinitely | High | High | Hard gate: manual audit must pass before Phase 7 starts |

---

## 8. Verification Plan

### 8.1 Unit/Integration Tests

```yaml
scope: all *.test.tsx files in src/
command: npx vitest run
target: 
  lines: 80
  branches: 75
  functions: 80
threshold: "blocking (CI)"
```

### 8.2 A11y Automated (Unit)

```yaml
scope: all *.axe.test.tsx files
command: npx vitest run --reporter=verbose --include='**/*.axe.test.tsx'
tool: jest-axe + axe-core
threshold: "0 violations (critical/serious)"
```

### 8.3 A11y Automated (E2E)

```yaml
projects:
  - axe-chromium:    playwright test --project=axe-chromium
  - axe-firefox:     playwright test --project=axe-firefox
  - keyboard-chromium: playwright test --project=keyboard-chromium
  - mobile-chromium: playwright test --project=mobile-chromium
tool: @axe-core/playwright
threshold: "0 violations (critical/serious) on all projects"
```

### 8.4 A11y Manual

```yaml
tools:
  - NVDA (Windows) — full smoke pass per release
  - VoiceOver (macOS) — full smoke pass per release
  - Keyboard-only — before each PR merge
  - Color contrast checker — before each PR merge
  - 200% zoom — responsive verification
  - prefers-reduced-motion — animation verification
```

### 8.5 Shared Component Coverage Verification

```yaml
scope: src/shared/components/*
checklist:
  - each component has a render test (mounts, renders role)
  - each component has an interaction test (click, focus, keyboard)
  - each component has an edge case test (empty, loading, error, disabled as applicable)
  - each component has an a11y test (*.axe.test.tsx, zero violations)
threshold: "every component meets all 4 requirements"
```

### 8.6 API Hook Coverage Verification

```yaml
scope: src/features/*/api/*
checklist:
  - each hook has a success test (data returned, loading transitions)
  - each hook has an error test (network error, 401, 409, 500)
  - each hook has a loading/empty state test
notes: "Use MSW to simulate all response variants"
```

### 8.7 Page Coverage Verification

```yaml
scope: src/features/*/pages/*
checklist:
  - each page has an integration test (critical path with MSW)
  - each page has an error boundary test (simulated render crash)
```

### 8.8 Edge Case Registry

```yaml
format: JSON (Zod validated)
location: docs/edge-cases/registry.json
per-feature-categories:
  - Empty states (no data, filtered to zero)
  - Error states (network, timeout, 500, validation)
  - Loading states (initial load, paginated load, mutation in flight)
  - Offline behavior (stale-while-revalidate, retry on reconnect)
  - Large input (10k+ items, virtualized)
  - Concurrent mutations (double-submit prevention, idempotency)
verification:
  - Schema validation on CI (npx tsx scripts/validate-edge-cases.ts)
  - One entry per unique feature scenario per category above
  - Must reference test file or "none" with justification
```

### 8.9 Bundle Budget Check

```yaml
command: npx tsx scripts/check-budgets.ts
budgets:
  js: 200 kB warn / 350 kB error (gzip)
  css: 30 kB warn / 60 kB error (gzip)
verification: "Zero test/a11y deps in production bundle"
```

### 8.10 Performance Baselines

```yaml
components: [Button, Input, Modal, Select, Table]
measurement: Render time per iteration (1000 iterations)
threshold: < budget per component
```

### 8.11 Lighthouse CI

```yaml
urls: ["/", "/dashboard", "/settings"]
runs: 3 (median)
thresholds:
  performance: 0.9
  accessibility: 1.0
  lcp: 2500ms
  inp: 200ms
  cls: 0.1
```

---

## 9. Component Inventory (React Agent)

### Shared Components Needing A11y Tests

| Component | Existing Tests | A11y Tests Needed | Priority |
|-----------|---------------|-------------------|----------|
| Spinner | ✅ | ✅ `Spinner.axe.test.tsx` | High |
| Skeleton | ✅ | ✅ `Skeleton.axe.test.tsx` | High |
| Toast | ❌ | ✅ `Toast.axe.test.tsx` | High |
| ToastRegion | ❌ | ✅ `ToastRegion.axe.test.tsx` | Critical |
| SkipLink | ❌ | ✅ `SkipLink.axe.test.tsx` | Critical |
| Sidebar | ✅ | ✅ `Sidebar.axe.test.tsx` | High |
| TopBar | ❌ | ✅ `TopBar.axe.test.tsx` | High |
| AppShell | ❌ | ✅ `AppShell.axe.test.tsx` | Medium |
| AuthLayout | ❌ | ✅ `AuthLayout.axe.test.tsx` | Medium |

### Feature Pages Needing A11y Tests

| Page | Existing Tests | A11y Tests Needed |
|------|---------------|-------------------|
| LoginForm | ✅ | ✅ `LoginForm.axe.test.tsx` |
| RegisterForm | ✅ | ✅ `RegisterForm.axe.test.tsx` |
| Settings | ✅ | ✅ `Settings.axe.test.tsx` |
| Dashboard | ❌ | ✅ `Dashboard.axe.test.tsx` |
| Reports | ❌ | ✅ `Reports.axe.test.tsx` |

### Compound Component Test Strategy

| Pattern | Strategy |
|---------|----------|
| `<ToastRegion>` + `<Toast>` | Render region, add toast, verify live region announcement |
| `<Sidebar>` + `<SidebarItem>` | Verify navigation tree, focus management |
| `<AppShell>` + `<TopBar>` + `<Sidebar>` | Verify layout roles, skip link functionality |

---

## 10. Test Utilities Design (React Agent)

### `customRender` — Provider Wrapper

```typescript
// src/test-utils/render.tsx
function customRender(
  ui: React.ReactElement,
  options?: RenderWithProvidersOptions
): RenderResult & { rerender: (ui: React.ReactElement) => void }
```

**Enforced providers:** MemoryRouter, QueryClientProvider, Provider (Redux), ThemeProvider

### `testA11y` — Axe Check Helper

```typescript
// src/test-utils/a11y.tsx
async function testA11y(container: HTMLElement): Promise<void>
// Throws on critical/serious violations
```

### `announce` — Live Region Utility

```typescript
// src/test-utils/a11y.tsx
function announce(message: string, politeness: 'polite' | 'assertive' = 'polite'): void
// ~200 bytes gzipped, O(1) runtime
```

### `mswServer` — MSW Singleton

```typescript
// src/test-utils/msw.tsx
import { setupServer } from 'msw/node'
import { handlers } from '@/mocks/handlers'

export const mswServer = setupServer(...handlers)
export const mswHelpers: MSWHelpers = {
  server: mswServer,
  reset: () => mswServer.resetHandlers(),
  use: (...h) => mswServer.use(...h),
}
```

---

## 11. A11y Requirements (Accessibility Agent)

### 11.1 Automated Gates

| Gate | Tool | Threshold | File |
|------|------|-----------|------|
| Unit test a11y | jest-axe | 0 critical/serious | `*.axe.test.tsx` |
| E2E a11y (Chromium) | @axe-core/playwright | 0 violations | Playwright project |
| E2E a11y (Firefox) | @axe-core/playwright | 0 violations | Playwright project |
| Keyboard-only | Playwright | All reachable | Playwright project |
| Color contrast | axe-core | 4.5:1 text / 3:1 UI | axe-core rule |
| Lighthouse a11y | Lighthouse CI | Score ≥ 1.0 | `lighthouse.config.js` |

### 11.2 Manual Audit Protocol

| Tool | Frequency | Scope |
|------|-----------|-------|
| NVDA (Windows) | Per release | All routes |
| VoiceOver (macOS) | Per release | All routes |
| Keyboard-only | Per PR merge | Changed routes |
| High contrast mode | Per release | All routes |
| 200% zoom | Per release | All routes |
| prefers-reduced-motion | Per release | All animations |

### 11.3 Component-Level ARIA Requirements

| Component | ARIA Role | Keyboard Behavior | Focus Management |
|-----------|-----------|-------------------|-----------------|
| Spinner | `aria-busy="true"` on container | No focus needed | N/A |
| Skeleton | `aria-busy="true"`, `aria-label="Loading..."` | No focus needed | N/A |
| Toast | `role="status"` or `role="alert"` | Auto-dismiss button focus | Focus move to toast on appear |
| ToastRegion | `aria-live="polite"` | Manages toast stack | Focus trap if modal |
| SkipLink | `href="#main-content"` | First tab stop | Focus skip to main |
| Sidebar | `role="navigation"`, `aria-label="Sidebar"` | Arrow key navigation | Focus indicator, roving tabindex |
| TopBar | `role="banner"` | Tab through actions | Skip link before |
| AppShell | `role="application"` | Coordinated | Skip link first |
| AuthLayout | `role="main"` | Logical tab order | Focus heading on mount |

### 11.4 Edge Case Categories

| Category | Example | A11y Concern |
|----------|---------|-------------|
| Loading | Data fetching | `aria-busy`, loading announcement |
| Empty | No results | Empty state role, description |
| Error | API failure | `role="alert"`, focus to error |
| Offline | Network down | Offline indicator, `aria-live` |
| Empty input | Form field | Validation error announcement |
| Overflow | Long data | Virtual scroll, pagination role |
| Permission denied | Restricted page | `aria-live` status description |

---

## 12. Performance Impact (Performance Agent)

| Metric | Phase 6 Impact | Verdict |
|--------|---------------|---------|
| Production JS bundle | **0 bytes** (all dev-only) | ✅ Pass |
| Production CSS bundle | **0 bytes** | ✅ Pass |
| LCP | No regression | ✅ Pass |
| INP (p75) | No regression | ✅ Pass |
| CLS | No regression | ✅ Pass |
| CI runtime | ~4 min 30s (with 4+12 shards) | ✅ < 5 min |

**Dev dependency sizes (no production impact):**

| Package | Size (gzip) | Tree-shakeable |
|---------|-------------|----------------|
| vitest | ~1.2 MB | N/A (dev) |
| @testing-library/react | ~15 kB | ✅ |
| @testing-library/user-event | ~12 kB | ✅ |
| msw | ~45 kB | ✅ |
| axe-core | ~85 kB | ✅ |
| jest-axe | ~3 kB | ✅ |
| @playwright/test | ~50 MB (browsers) | N/A (dev) |

**Current route budgets (unchanged by Phase 6):**

| Route | JS (gzip) | CSS (gzip) | Status |
|-------|-----------|------------|--------|
| / (Home) | 142 kB | 18 kB | ✅ Under warn |
| /dashboard | 187 kB | 24 kB | ✅ Under warn |
| /settings | 156 kB | 15 kB | ✅ Under warn |
| /reports | 203 kB | 28 kB | ⚠️ Warn (future work) |

---

## 13. Implementation Order

| Step | Task | Agent | Est. Effort |
|------|------|-------|-------------|
| 1 | Create `src/test-utils/` (render, a11y, msw, types) | TypeScript | Small |
| 2 | Update `vitest.config.ts` with coverage thresholds + new test file pattern | Infrastructure | Small |
| 3 | Update `playwright.config.ts` with a11y projects | Infrastructure | Small |
| 4 | Add `testA11y` helper and `announce` utility | React | Small |
| 5 | Add MSW server and handler generators | Testing | Small |
| 6 | Add `.axe.test.tsx` files for shared components (Spinner, Skeleton, Toast, ToastRegion, SkipLink, Sidebar, TopBar, AppShell, AuthLayout) | A11y | Medium |
| 7 | Add `.axe.test.tsx` files for feature pages (LoginForm, RegisterForm, Settings, Dashboard, Reports) | A11y | Medium |
| 8 | Add render + interaction + edge case tests for shared components with coverage gaps | Testing | Medium |
| 9 | Add API hook tests: success case, error case (401/409/500), loading state for every hook | Testing | Medium |
| 10 | Add page-level integration tests (critical path) + error boundary tests for every page | Testing | Medium |
| 11 | Create `docs/edge-cases/` directory with `registry.json` + per-feature edge case docs + validation script | Documentation | Small |
| 12 | Create `lighthouse.config.js` for Lighthouse CI | Performance | Small |
| 13 | Create `scripts/check-budgets.ts` for bundle verification | Performance | Small |
| 14 | Add CI workflow updates (sharding, caches, bundle gate) | Infrastructure | Medium |
| 15 | Run E2E a11y suites and fix all violations | A11y | Large |
| 16 | Run manual a11y audit (NVDA, VoiceOver, keyboard, zoom, contrast) | A11y | Large |
| 17 | Run full CI pipeline, verify coverage gates, fix gaps | Testing | Medium |
| 18 | Document everything in CHANGELOG + README | Documentation | Small |

---

## 14. Edge Case Registry Schema

```json
{
  "schemaVersion": "1.0",
  "lastUpdated": "2026-07-03T00:00:00Z",
  "entries": [
    {
      "id": "EC-001",
      "feature": "settings",
      "scenario": "User clears profile photo",
      "category": "empty_state",
      "severity": "medium",
      "description": "When user removes their profile photo, a default avatar is shown",
      "expectedBehavior": "Default avatar renders immediately, no loading state",
      "testCoverage": "unit",
      "testFile": "src/features/settings/Settings.test.tsx"
    }
  ]
}
```

---

## 15. Sign-Off Checklist

- [ ] Architecture fits existing patterns; no new abstractions without justification
- [ ] No cyclic dependencies between modules
- [ ] No new global state introduced
- [ ] All type contracts use `interface` or `type` appropriately, no `any`
- [ ] Test utilities are stateless and dev-only
- [ ] A11y automated + manual gates defined
- [ ] Edge case registry schema validated at runtime (Zod)
- [ ] Production bundle unchanged by Phase 6
- [ ] CI runtime budget < 5 min
- [ ] CWV budgets met (LCP < 2.5s, INP < 200ms, CLS < 0.1)
