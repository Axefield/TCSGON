# Phase 7 — Design System Completion + Feature Module Hardening

> **Status:** Planned  
> **Owner:** AI Workflow Agent  
> **Target branch:** `feat/phase-7-design-system-and-features`  
> **Dependencies:** Phase 6 complete (PR #9 merged to `main`)

---

## 1. Feature Request

Complete the design system by building the 12 missing shared components, add tests + a11y audits for all 21 components, implement soft-delete for projects on the server, refactor feature pages to adopt the design system, and harden integration tests — all with CI gates green.

### Scope

1. **Design System Components (12)** — build the 6 missing + add tests to the 6 partial
2. **a11y axe tests (17)** — cover all components missing axe audits
3. **Server soft-delete** — add `deletedAt` to Project model, update service + tests
4. **Feature page refactoring** — adopt design system components in projects/dashboard/auth pages
5. **Integration test hardening** — ensure full-stack flows pass with new components
6. **CI gates verification** — lint, typecheck, coverage (≥96% lines / ≥87% branches / ≥85% functions), bundle budgets, zero a11y violations

---

## 2. Architecture Overview (ASCII Diagram)

```
┌──────────────────────────────────────────────────────────────────────────────────────┐
│                           Phase 7 Architecture                                      │
├──────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  ┌─────────────────────────────────────────┐    ┌─────────────────────────────────┐  │
│  │       src/shared/components/            │    │     server/prisma/              │  │
│  │  ┌───────────────────────────────────┐  │    │  ┌───────────────────────────┐  │  │
│  │  │ Primitives (atomic)              │  │    │  │ schema.prisma             │  │  │
│  │  │  Button, Input, Select,          │  │    │  │  + deletedAt on Project   │  │  │
│  │  │  Checkbox, Badge, Avatar         │  │    │  └───────────────────────────┘  │  │
│  │  ├───────────────────────────────────┤  │    │  ┌───────────────────────────┐  │  │
│  │  │ Composites (partial, need tests) │  │    │  │ seed.ts                  │  │  │
│  │  │  Modal, Drawer, Tabs, Tooltip,   │  │    │  │  + project seed data     │  │  │
│  │  │  Radio.Group, ErrorBoundary       │  │    │  └───────────────────────────┘  │  │
│  │  ├───────────────────────────────────┤  │    └─────────────────────────────────┘  │
│  │  │ Existing (need a11y tests)       │  │                                           │
│  │  │  EmptyState, ErrorDisplay,        │  │    ┌─────────────────────────────────┐  │
│  │  │  DataTable, Pagination,           │  │    │     src/features/               │  │
│  │  │  ConfirmDialog                    │  │    │  projects/pages/               │  │
│  │  └───────────────────────────────────┘  │    │  ├── ProjectListPage.tsx        │  │
│  │                                         │    │  ├── ProjectForm.tsx            │  │
│  └─────────────────────────────────────────┘    │  ├── ProjectDetail.tsx          │  │
│                                                  │  └── ProjectEditPage.tsx        │  │
│  ┌─────────────────────────────────────────┐    │  dashboard/pages/               │  │
│  │       server/src/services/              │    │  └── DashboardPage.tsx          │  │
│  │  ┌───────────────────────────────────┐  │    │  auth/pages/                    │  │
│  │  │ project.ts                       │  │    │  ├── LoginPage.tsx              │  │
│  │  │  + soft-delete (deletedAt)       │  │    │  ├── SignupPage.tsx             │  │
│  │  │  + filter deleted from list      │  │    │  └── SettingsPage.tsx           │  │
│  │  └───────────────────────────────────┘  │    └─────────────────────────────────┘  │
│  └─────────────────────────────────────────┘                                           │
│                                                                                      │
└──────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Folder Structure (Exact Paths)

```
src/shared/components/
├── index.ts                              # Updated barrel exports
├── Button/                               # NEW — primitive
│   ├── Button.tsx
│   ├── Button.test.tsx
│   ├── Button.axe.test.tsx
│   ├── Button.module.css
│   └── index.ts
├── Input/                                # NEW — primitive
│   ├── Input.tsx
│   ├── Input.test.tsx
│   ├── Input.axe.test.tsx
│   ├── Input.module.css
│   └── index.ts
├── Select/                               # NEW — primitive
│   ├── Select.tsx
│   ├── Select.test.tsx
│   ├── Select.axe.test.tsx
│   ├── Select.module.css
│   └── index.ts
├── Checkbox/                             # NEW — primitive
│   ├── Checkbox.tsx
│   ├── Checkbox.test.tsx
│   ├── Checkbox.axe.test.tsx
│   ├── Checkbox.module.css
│   └── index.ts
├── Badge/                                # NEW — primitive
│   ├── Badge.tsx
│   ├── Badge.test.tsx
│   ├── Badge.axe.test.tsx
│   ├── Badge.module.css
│   └── index.ts
├── Avatar/                               # NEW — primitive
│   ├── Avatar.tsx
│   ├── Avatar.test.tsx
│   ├── Avatar.axe.test.tsx
│   ├── Avatar.module.css
│   └── index.ts
├── Modal/                                # EXISTS — add tests
│   ├── Modal.tsx
│   ├── Modal.test.tsx                    # ADD
│   ├── Modal.axe.test.tsx                # ADD
│   ├── Modal.module.css
│   └── index.ts
├── Drawer/                               # EXISTS — add tests
│   ├── Drawer.tsx
│   ├── Drawer.test.tsx                   # ADD
│   ├── Drawer.axe.test.tsx               # ADD
│   ├── Drawer.module.css
│   └── index.ts
├── Tabs/                                 # EXISTS — add tests
│   ├── Tabs.tsx
│   ├── Tabs.test.tsx                     # ADD
│   ├── Tabs.axe.test.tsx                 # ADD
│   ├── Tabs.module.css
│   └── index.ts
├── Tooltip/                              # EXISTS — add tests
│   ├── Tooltip.tsx
│   ├── Tooltip.test.tsx                  # ADD
│   ├── Tooltip.axe.test.tsx              # ADD
│   ├── Tooltip.module.css
│   └── index.ts
├── Radio/                                # EXISTS — add tests
│   ├── Radio.tsx
│   ├── Radio.test.tsx                    # ADD
│   ├── Radio.axe.test.tsx                # ADD
│   ├── Radio.module.css
│   └── index.ts
├── ErrorBoundary/                        # EXISTS — add tests
│   ├── ErrorBoundary.tsx
│   ├── ErrorBoundary.test.tsx            # ADD
│   ├── ErrorBoundary.axe.test.tsx        # ADD
│   ├── ErrorBoundary.module.css
│   └── index.ts
├── EmptyState/                           # EXISTS — add a11y test
│   ├── EmptyState.tsx
│   ├── EmptyState.test.tsx
│   ├── EmptyState.axe.test.tsx           # ADD
│   ├── EmptyState.module.css
│   └── index.ts
├── ErrorDisplay/                         # EXISTS — add a11y test
│   ├── ErrorDisplay.tsx
│   ├── ErrorDisplay.test.tsx
│   ├── ErrorDisplay.axe.test.tsx         # ADD
│   ├── ErrorDisplay.module.css
│   └── index.ts
├── DataTable/                            # EXISTS — add a11y test
│   ├── DataTable.tsx
│   ├── DataTable.test.tsx
│   ├── DataTable.axe.test.tsx            # ADD
│   ├── DataTable.module.css
│   └── index.ts
├── Pagination/                           # EXISTS — add a11y test
│   ├── Pagination.tsx
│   ├── Pagination.test.tsx
│   ├── Pagination.axe.test.tsx           # ADD
│   ├── Pagination.module.css
│   └── index.ts
├── ConfirmDialog/                        # EXISTS — add a11y test
│   ├── ConfirmDialog.tsx
│   ├── ConfirmDialog.test.tsx
│   ├── ConfirmDialog.axe.test.tsx        # ADD
│   ├── ConfirmDialog.module.css
│   └── index.ts
└── Spinner/                              # EXISTS — has a11y ✅
    └── ...
└── Skeleton/                             # EXISTS — has a11y ✅
    └── ...
└── Toast/                                # EXISTS — has a11y ✅
    └── ...
└── ToastRegion/                          # EXISTS — has a11y ✅
    └── ...

server/prisma/
└── schema.prisma                         # + deletedAt on Project

server/prisma/migrations/
└── <new-migration>                       # ADD — soft-delete field

server/src/services/
├── project.ts                            # UPDATE — soft-delete in deleteProject, filter in listProjects
└── __tests__/project.test.ts             # UPDATE — soft-delete tests

src/features/projects/
├── components/
│   ├── ProjectForm.tsx                   # REFACTOR — use Button, Input, Select
│   ├── ProjectList.tsx                   # REFACTOR — use Badge for status
│   └── ProjectDetail.tsx                 # REFACTOR — use Badge, Button
├── pages/
│   ├── ProjectListPage.tsx               # REFACTOR — use Input, Select, Button
│   ├── ProjectCreatePage.tsx             # REFACTOR — use Button (already fine)
│   ├── ProjectEditPage.tsx               # REFACTOR — use Button
│   └── ProjectDetailPage.tsx             # REFACTOR — use Button, ConfirmDialog
├── __tests__/                            # ADD — integration test
│   └── projectFeature.test.tsx

src/features/dashboard/
├── pages/
│   └── DashboardPage.tsx                 # REFACTOR — minor (mostly grid components)
└── components/
    └── StatCard.tsx                      # REFACTOR — use Badge where applicable

src/features/auth/
├── pages/
│   ├── LoginPage.tsx                     # REFACTOR — inline styles → Tabs/Button
│   └── SignupPage.tsx                    # REFACTOR — inline styles → design tokens
```

---

## 4. Module Dependencies (Direction Arrows)

```
Primitives (Button, Input, Select, Checkbox, Badge, Avatar)
  └── use shared hooks (no design system deps)
  └── CSS modules only

Composites (Modal, Drawer, Tabs, Tooltip, Radio.Group, ErrorBoundary)
  ├── use shared hooks (useFocusTrap, useLockedBody, useId, usePrefersReducedMotion)
  └── compose primitives internally where needed

Feature pages
  ├── consume primitives (Button, Input, Select, Badge)
  ├── consume composites (Modal, ConfirmDialog, Tabs)
  └── consume existing components (DataTable, Pagination, EmptyState, ErrorDisplay)

Feature components (ProjectForm, ProjectList, ProjectDetail)
  ├── consume primitives
  └── consume existing components

Server project service
  └── Prisma Project model (with deletedAt)

No cyclic dependencies. Components never import feature code.
```

---

## 5. State Decision with Justification

| Concern | Decision | Justification |
|---------|----------|---------------|
| Design system state | **Local `useState` / `useReducer`** | All 12 components are presentational — no server state, no Redux needed |
| Focus trap logic | **Shared `useFocusTrap` hook** | Already exists in `src/shared/hooks/useFocusTrap.ts` — Modal + Drawer reuse it |
| Body scroll lock | **Shared `useLockedBody` hook** | Already exists in `src/shared/hooks/useLockedBody.ts` — Modal + Drawer reuse it |
| Reduced motion | **Shared `usePrefersReducedMotion` hook** | Already exists — all components respect it |
| Server state (projects) | **React Query** | Already implemented in `projectsApi.ts` — no change |
| Soft-delete | **`deletedAt` field on Project model** | Non-destructive, auditable, reversible — standard pattern |
| Project form state | **React Hook Form + Zod** | Already implemented — no change |

**No new global state introduced.** All new components are stateless or use local state.

---

## 6. Component Inventory & Audit

### 6.1 Existing 9 Components — Test Status

| Component | .test.tsx | .axe.test.tsx | Priority |
|-----------|-----------|---------------|----------|
| Spinner | ✅ | ✅ | — |
| Skeleton | ✅ | ✅ | — |
| Toast | ✅ | ✅ | — |
| ToastRegion | ✅ | ✅ | — |
| EmptyState | ✅ | ❌ | High |
| ErrorDisplay | ✅ | ❌ | High |
| DataTable | ✅ | ❌ | Medium |
| Pagination | ✅ | ❌ | Medium |
| ConfirmDialog | ✅ | ❌ | High |

### 6.2 Partial 6 Components — Build Status

| Component | .tsx | .module.css | .test.tsx | .axe.test.tsx | Priority |
|-----------|------|-------------|-----------|---------------|----------|
| Modal | ✅ | ✅ | ❌ | ❌ | High |
| Drawer | ✅ | ✅ | ❌ | ❌ | Medium |
| Tabs | ✅ | ✅ | ❌ | ❌ | High |
| Tooltip | ✅ | ✅ | ❌ | ❌ | High |
| Radio.Group | ✅ | ✅ | ❌ | ❌ | Medium |
| ErrorBoundary | ✅ | ✅ | ❌ | ❌ | High |

### 6.3 Missing 6 Components — Build from Scratch

| Component | Type | Variants | Props | Priority |
|-----------|------|----------|-------|----------|
| **Button** | Primitive | primary/secondary/ghost/danger, sizes (sm/md/lg), icon slot, loading, disabled, full-width, `href` for link mode | `variant`, `size`, `icon`, `loading`, `disabled`, `fullWidth`, `href`, `type` | **Critical** |
| **Input** | Primitive | text/email/password/url, label, error, helper, prefix/suffix icon, password visibility | `label`, `error`, `helperText`, `prefixIcon`, `suffixIcon`, `type`, `showPasswordToggle` | **Critical** |
| **Select** | Primitive | Native `<select>` styled, label, error, placeholder | `label`, `error`, `options`, `placeholder` | **Critical** |
| **Checkbox** | Primitive | Checked/unchecked/indeterminate, label, error, disabled | `label`, `checked`, `indeterminate`, `error`, `disabled` | High |
| **Badge** | Primitive | Variants (default/primary/success/warning/danger), sizes, dot mode, count | `variant`, `size`, `dot`, `count`, `max` | High |
| **Avatar** | Primitive | Image + initials fallback, sizes, aria-label | `src`, `alt`, `name` (for initials), `size` | Medium |

---

## 7. TypeScript Contracts (Interfaces)

```typescript
// ── Button ────────────────────────────────────────────────────────
export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonBaseProps {
  readonly variant?: ButtonVariant;
  readonly size?: ButtonSize;
  readonly icon?: ReactNode;
  readonly loading?: boolean;
  readonly fullWidth?: boolean;
  readonly children: ReactNode;
}

// Discriminated union: button vs link
export interface ButtonAsButton extends ButtonBaseProps {
  readonly href?: never;
  readonly type?: 'button' | 'submit' | 'reset';
  readonly disabled?: boolean;
}

export interface ButtonAsLink extends ButtonBaseProps {
  readonly href: string;
  readonly type?: never;
  readonly disabled?: never;
}

export type ButtonProps = ButtonAsButton | ButtonAsLink;

// ── Input ─────────────────────────────────────────────────────────
export interface InputProps {
  readonly label: string;
  readonly error?: string;
  readonly helperText?: string;
  readonly prefixIcon?: ReactNode;
  readonly suffixIcon?: ReactNode;
  readonly showPasswordToggle?: boolean;
  readonly type?: 'text' | 'email' | 'password' | 'url';
  // + all native input props via React.ComponentPropsWithoutRef<'input'>
}

// ── Select ────────────────────────────────────────────────────────
export interface SelectOption {
  readonly value: string;
  readonly label: string;
  readonly disabled?: boolean;
}

export interface SelectProps {
  readonly label: string;
  readonly options: ReadonlyArray<SelectOption>;
  readonly error?: string;
  readonly placeholder?: string;
  // + native select props
}

// ── Checkbox ──────────────────────────────────────────────────────
export interface CheckboxProps {
  readonly label: string;
  readonly checked?: boolean;
  readonly indeterminate?: boolean;
  readonly error?: string;
  readonly disabled?: boolean;
  // + native input props
}

// ── Badge ─────────────────────────────────────────────────────────
export type BadgeVariant = 'default' | 'primary' | 'success' | 'warning' | 'danger';
export type BadgeSize = 'sm' | 'md' | 'lg';

export interface BadgeProps {
  readonly variant?: BadgeVariant;
  readonly size?: BadgeSize;
  readonly dot?: boolean;
  readonly count?: number;
  readonly max?: number;
  readonly children: ReactNode;
}

// ── Avatar ────────────────────────────────────────────────────────
export type AvatarSize = 'sm' | 'md' | 'lg' | 'xl';

export interface AvatarProps {
  readonly src?: string;
  readonly alt?: string;
  readonly name: string;
  readonly size?: AvatarSize;
}

// ── Branded ID (server) ───────────────────────────────────────────
declare const ProjectIdBrand: unique symbol;
export type ProjectId = string & { readonly [ProjectIdBrand]: never };
```

---

## 8. Soft-Delete Design (Server)

### 8.1 Prisma Schema Change

```prisma
model Project {
  id          String   @id @default(uuid()) @db.Uuid
  name        String   @db.VarChar(200)
  description String   @default("") @db.VarChar(2000)
  status      String   @default("active") @db.VarChar(20)
  leadName    String   @map("lead_name") @db.VarChar(120)
  memberCount Int      @default(0) @map("member_count")
  deletedAt   DateTime? @map("deleted_at")              // ← ADD
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  activityLogs ActivityLog[]

  @@map("projects")
  @@index([status])
  @@index([status, createdAt])
  @@index([deletedAt])                                    // ← ADD index
}
```

### 8.2 Service Changes

- `deleteProject()`: set `deletedAt` instead of `prisma.project.delete()`
- `listProjects()`: add `where: { deletedAt: null }` to filter out soft-deleted
- `getProjectById()`: ensure `deletedAt` is null (or return 404 for deleted)
- `updateProject()`: check `deletedAt` is null before allowing update
- ActivityLog: keep cascade but update to use `deletedAt` timestamp

### 8.3 Seed Data Update

Add `deletedAt: null` to existing 4 projects (Prisma default).

---

## 9. Feature Page Refactoring Plan

| Page | Raw HTML Used | Replace With | Effort |
|------|--------------|--------------|--------|
| `ProjectListPage.tsx` | `<button>`, `<input>`, `<select>`, `<label>` | `<Button>`, `<Input>`, `<Select>` | Medium |
| `ProjectForm.tsx` | `<input>`, `<select>`, `<textarea>`, `<button>` | `<Input>`, `<Select>`, `<Button>` | Small |
| `ProjectDetail.tsx` | `<button>`, `<Link>` CSS modules | `<Button>`, `<Badge>`, `<Button variant="danger">` | Small |
| `LoginPage.tsx` | Inline `<Link>` styles | Load design tokens from CSS modules | Small |
| `SignupPage.tsx` | Inline `<Link>` styles | Load design tokens from CSS modules | Small |
| `SettingsPage.tsx` | Raw `<input>`, `<button>` | `<Input>`, `<Button>` | Medium |
| `DashboardPage.tsx` | Raw `<h1>` | Already feature-specific — minimal changes | Tiny |

**Principle:** Replace raw HTML with design system components, but do NOT change layout or behavior. Each refactor is a mechanical substitution verified by existing tests.

---

## 10. Risks with Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Button component design causes cascading refactors across all pages | Medium | High | Build Button first with full test coverage; refactor pages one at a time with incremental test verification |
| Soft-delete migration breaks existing test data | Low | High | Run existing project service + route tests after migration to verify behavior unchanged |
| Bundle budget exceeded by 12 new components | Low | Medium | Check budgets after each component; 6 primitives are <1 kB gzip each, composites reuse existing code |
| Existing page tests break after design system adoption | Medium | Medium | Freeze test snapshots before refactor; update selectors if needed (role-based queries should pass) |
| aria-describedby mismatches after Input component adoption | Low | Medium | Verify all `*.axe.test.tsx` pass after refactor |
| Client coverage drops below thresholds | Low | High | Write component tests BEFORE page refactors; run coverage after each step |
| Prisma migration fails on CI due to existing data | Low | Medium | Write migration as `ALTER TABLE ... ADD COLUMN ... DEFAULT NULL` — no breaking change |

---

## 11. Implementation Order

### Work Order (Sequential — each step gates the next)

| Step | Task | Subagent | Est. Effort | Verification |
|------|------|----------|-------------|-------------|
| **1** | Prisma: add `deletedAt` to Project model, create migration, update seed | TypeScript | Small | `pnpm db:migrate`, server tests pass |
| **2** | Server: update `project.ts` service for soft-delete (list, get, update, delete) | TypeScript | Small | `cd server && pnpm test` — project tests pass |
| **3** | **Button** — build primitive with all variants, sizes, states, icon slot, href discriminant | React | Medium | `Button.test.tsx` + `Button.axe.test.tsx` pass |
| **4** | **Input** — build with label, error, helper, prefix/suffix, password toggle | React | Medium | `Input.test.tsx` + `Input.axe.test.tsx` pass |
| **5** | **Select** — build native `<select>` styled with label, error, options | React | Small | `Select.test.tsx` + `Select.axe.test.tsx` pass |
| **6** | **Checkbox** — build with label, indeterminate, error states | React | Small | `Checkbox.test.tsx` + `Checkbox.axe.test.tsx` pass |
| **7** | **Badge** — build with variants, sizes, dot mode, count | React | Small | `Badge.test.tsx` + `Badge.axe.test.tsx` pass |
| **8** | **Avatar** — build with image + initials fallback, sizes | React | Small | `Avatar.test.tsx` + `Avatar.axe.test.tsx` pass |
| **9** | Add tests for **Modal** (focus trap, Esc, backdrop, return focus) | Testing | Medium | `Modal.test.tsx` + `Modal.axe.test.tsx` pass |
| **10** | Add tests for **Drawer** (slide-in, focus trap, side variants) | Testing | Medium | `Drawer.test.tsx` + `Drawer.axe.test.tsx` pass |
| **11** | Add tests for **Tabs** (selection, arrow keys, disabled tab, controlled mode) | Testing | Medium | `Tabs.test.tsx` + `Tabs.axe.test.tsx` pass |
| **12** | Add tests for **Tooltip** (show/hide delays, hover, keyboard focus, position) | Testing | Medium | `Tooltip.test.tsx` + `Tooltip.axe.test.tsx` pass |
| **13** | Add tests for **Radio.Group** (selection, arrow keys, disabled) | Testing | Small | `Radio.test.tsx` + `Radio.axe.test.tsx` pass |
| **14** | Add tests for **ErrorBoundary** (catches error, fallback render, reset) | Testing | Medium | `ErrorBoundary.test.tsx` + `ErrorBoundary.axe.test.tsx` pass |
| **15** | Add a11y tests for 5 existing components: **EmptyState, ErrorDisplay, DataTable, Pagination, ConfirmDialog** | A11y | Small | All 5 `*.axe.test.tsx` pass |
| **16** | Update `src/shared/components/index.ts` with new exports | Infrastructure | Tiny | typecheck + lint pass |
| **17** | Refactor **ProjectForm** → use Button, Input, Select | React | Small | ProjectCreatePage + ProjectEditPage tests pass |
| **18** | Refactor **ProjectList** → use Badge for status column | React | Small | ProjectListPage tests pass |
| **19** | Refactor **ProjectListPage** toolbar → use Input, Select, Button | React | Small | ProjectListPage tests + axe tests pass |
| **20** | Refactor **ProjectDetail** → use Badge, Button (danger for delete) | React | Small | ProjectDetailPage tests pass |
| **21** | Refactor **SettingsPage** → use Input, Button | React | Medium | SettingsPage tests + axe tests pass |
| **22** | Refactor **LoginPage / SignupPage** inline styles → CSS module tokens | React | Small | LoginPage + SignupPage tests pass |
| **23** | Add integration test: full project CRUD flow via design system components | Testing | Medium | Test passes |
| **24** | Update barrel exports + verify build | Infrastructure | Small | `pnpm build` passes |
| **25** | Run full CI: lint, typecheck, coverage, bundle, a11y | Infrastructure | Medium | All gates green |
| **26** | Update CHANGELOG.md, record ADR if novel decisions made | Documentation | Small | CHANGELOG entry added |

### Parallelization

Steps 1–2 (server) are independent of steps 3–15 (design system). They can run in parallel.
Steps 3–8 (primitives) are independent of each other — can run in parallel.
Steps 9–14 (composite tests) are independent of each other — can run in parallel.
Steps 17–22 (page refactors) depend on steps 3–8 (primitives built) — must be sequential after those.

---

## 12. Component Design Specifications

### 12.1 Button

```
Props:
  variant: 'primary' | 'secondary' | 'ghost' | 'danger'  (default: 'primary')
  size: 'sm' | 'md' | 'lg'                                (default: 'md')
  icon: ReactNode                                          (optional)
  loading: boolean                                         (default: false)
  fullWidth: boolean                                       (default: false)
  href: string                                             (if present, renders <a>)
  type: 'button' | 'submit' | 'reset'                      (default: 'button', only when href absent)
  disabled: boolean                                        (default: false, only when href absent)
  children: ReactNode

Behavior:
  - aria-busy="true" when loading
  - Button text replaced by <Spinner> when loading (keeps width via min-width)
  - disabled + loading disables interaction (aria-disabled keeps focusable)
  - When href is provided, renders <a> with role="button" if needed
  - Focus-visible ring always visible

Accessibility:
  - Keyboard: Enter/Space activate
  - aria-disabled when loading (focusable)
  - aria-busy="true" when loading
```

### 12.2 Input

```
Props:
  label: string (required — visually rendered as <label>)
  error?: string (renders aria-invalid + aria-describedby)
  helperText?: string (renders below input with description id)
  prefixIcon?: ReactNode
  suffixIcon?: ReactNode
  showPasswordToggle?: boolean
  type: 'text' | 'email' | 'password' | 'url' (default: 'text')
  + all React.InputHTMLAttributes

Behavior:
  - Forwards ref via forwardRef
  - Password type shows toggle button (eye icon) when showPasswordToggle is true
  - aria-invalid="true" when error is present
  - aria-describedby links to error or helper text
  - Character count shown for maxLength inputs

Accessibility:
  - <label htmlFor={id}> always rendered
  - aria-invalid, aria-describedby wired automatically
  - Error message has role="alert"
  - Focus moved to first error on submit
```

### 12.3 Select

```
Props:
  label: string (required)
  options: ReadonlyArray<{ value: string, label: string, disabled?: boolean }>
  error?: string
  placeholder?: string
  + native <select> props via forwardRef

Behavior:
  - Renders native <select> with custom CSS styling
  - Placeholder option has disabled selected attribute
  - Same a11y contract as Input (aria-invalid, aria-describedby)

Accessibility:
  - <label htmlFor={id}> always rendered
  - aria-invalid when error present
  - Error message has role="alert"
```

### 12.4 Checkbox

```
Props:
  label: string (required)
  checked?: boolean
  indeterminate?: boolean
  error?: string
  disabled?: boolean
  + native <input type="checkbox"> props

Behavior:
  - Uses visually-hidden native checkbox + custom styled ::before
  - indeterminate state rendered via ref.indeterminate = true
  - Error state shows colored border + error text

Accessibility:
  - <label> wraps or references the input
  - aria-checked for indeterminate state
  - aria-invalid when error present
```

### 12.5 Badge

```
Props:
  variant: 'default' | 'primary' | 'success' | 'warning' | 'danger' (default: 'default')
  size: 'sm' | 'md' | 'lg'                                          (default: 'md')
  dot?: boolean          (renders small dot without text)
  count?: number         (renders as numeric badge)
  max?: number           (cap for count, e.g. max=99 shows "99+")
  children: ReactNode    (text content when not dot/count mode)

Behavior:
  - If dot is true, renders small colored circle (aria-label for context)
  - If count is provided, renders number with max overflow
  - Otherwise renders children text

Accessibility:
  - aria-label when dot mode (no visible text)
  - role="status" for count badges that change
```

### 12.6 Avatar

```
Props:
  src?: string           (image URL)
  alt?: string           (image alt text)
  name: string           (used for initials fallback)
  size?: 'sm' | 'md' | 'lg' | 'xl' (default: 'md')

Behavior:
  - Renders <img> when src provided and loads successfully
  - Falls back to initials (first letter of name) on image error or no src
  - Initials computed as name.charAt(0).toUpperCase()
  - Background color derived from name hash for visual distinction

Accessibility:
  - aria-label set to name
  - img alt text passed through
  - role="img" on container
```

---

## 13. Test Plan

### 13.1 Per-Component Test Matrix

| Component | Render | Interaction | Edge Cases | A11y |
|-----------|--------|-------------|------------|------|
| Button | Renders as button/a, all variants, sizes, icon, loading, disabled, fullWidth | Click calls onClick, Enter/Space on link mode | Loading state disables click, disabled prevents click, href renders `<a>` | axe: zero violations, aria-busy, aria-disabled |
| Input | Renders with label, error, helper, prefix/suffix icon, password toggle | Type updates value, password toggle shows/hides text | Error state shows message + aria-invalid, empty label throws, maxLength character count | axe: zero violations, label association |
| Select | Renders with label, options, placeholder, error | Select option updates value, keyboard navigation works | Error state, empty options, placeholder selected by default | axe: zero violations, label association |
| Checkbox | Renders labeled checkbox, checked/unchecked/indeterminate | Click toggles check, keyboard Space toggles | Indeterminate via ref, disabled prevents toggle, error state | axe: zero violations |
| Badge | Renders with variant colors, sizes, dot mode, count with max | No interaction (presentational) | Count overflow shows "max+", zero count hidden, dot mode aria-label | axe: zero violations |
| Avatar | Renders image or initials fallback, all sizes | No interaction | Image load error → initials, missing src → initials, long name → single initial | axe: zero violations, aria-label |
| Modal | Renders via portal, sizes (sm/md/lg), title, close button | Open/close, Esc key, backdrop click, focus trap, return focus | Open with no focusable elements (focus dialog), close restores focus, body scroll locked | axe: zero violations, aria-modal, aria-labelledby |
| Drawer | Renders via portal, left/right sides, title, close button | Open/close, Esc key, backdrop click, focus trap, return focus | Same edge cases as Modal, side variants animate differently | axe: zero violations, aria-modal, aria-labelledby |
| Tabs | Renders tablist + tabs + panel, controlled/uncontrolled | Click tab selects, ArrowLeft/Right/Home/End navigate, disabled tab skipped | Controlled mode external change, empty children, single tab, all tabs disabled | axe: zero violations, tab roles, aria-selected |
| Tooltip | Renders trigger + tooltip bubble, 4 positions | Hover shows after delay, keyboard focus shows, blur/mouseleave hides | Rapid show/hide clears timers, showDelay=0, hideDelay=0, position clips at edge | axe: zero violations, role="tooltip", aria-describedby |
| Radio.Group | Renders radiogroup with options, controlled value | Click selects, Arrow keys navigate, disabled skipped | onChange fires correctly, empty group, all disabled, controlled mode | axe: zero violations, radiogroup role |
| ErrorBoundary | Renders children normally, fallback on error | Reset restores children, onError callback called | Nested error boundaries, async error (not caught), no fallback → default fallback | axe: zero violations (default fallback role="alert") |
| EmptyState | No new tests needed — just .axe.test.tsx | — | — | axe: zero violations |
| ErrorDisplay | No new tests needed — just .axe.test.tsx | — | — | axe: zero violations |
| DataTable | No new tests needed — just .axe.test.tsx | — | — | axe: zero violations |
| Pagination | No new tests needed — just .axe.test.tsx | — | — | axe: zero violations |
| ConfirmDialog | No new tests needed — just .axe.test.tsx | — | — | axe: zero violations |

### 13.2 Server Test Updates (Soft-Delete)

| Test | Existing | Update |
|------|----------|--------|
| `projectService.deleteProject` | Expects `findUnique → null` | Expect `deletedAt` to be non-null |
| `projectService.deleteProject` (404) | Unchanged | Verify still throws 404 |
| `projectService.listProjects` | Lists all | Verify deleted projects excluded |
| `projectService.getProjectById` (deleted) | — | New test: returns 404 for soft-deleted |
| `projectService.updateProject` (deleted) | — | New test: returns 404 for soft-deleted |
| `DELETE /api/projects/:id` route | Expects 204 + `findUnique → null` | Expect 204 + `deletedAt` is set |

### 13.3 Integration Test: Full Project CRUD

```typescript
// src/features/projects/__tests__/projectFeature.test.tsx
describe('Project feature integration', () => {
  it('renders list → creates project → detail shows → edit → list updated', async () => { /* ... */ });
  it('renders empty state when no projects match filter', async () => { /* ... */ });
  it('shows error state on API failure with retry', async () => { /* ... */ });
  it('deletes project from detail page and redirects to list', async () => { /* ... */ });
});
```

---

## 14. Accessibility Requirements

### 14.1 Per-Component ARIA Requirements

| Component | Role | Keyboard | Focus | Live Region |
|-----------|------|----------|-------|-------------|
| Button | `button` or link | Enter/Space | Focus-visible ring | `aria-busy` when loading |
| Input | — | Tab | Focus-visible ring | `aria-describedby` for errors |
| Select | — | Tab + Arrow keys | Focus-visible ring | `aria-describedby` for errors |
| Checkbox | `checkbox` | Space to toggle | Focus-visible ring | — |
| Badge | `status` (count) or none | No focus | N/A | `aria-label` for dot mode |
| Avatar | `img` | No focus | N/A | `aria-label` with name |
| Modal | `dialog` + `aria-modal` | Tab/Shift+Tab cycle | Focus trap, return focus | — |
| Drawer | `dialog` + `aria-modal` | Tab/Shift+Tab cycle | Focus trap, return focus | — |
| Tabs | `tablist`/`tab`/`tabpanel` | ArrowLeft/Right/Home/End | Roving tabindex | `aria-selected`, `aria-controls` |
| Tooltip | `tooltip` | No new key (trigger focus) | Via trigger | `aria-describedby` on trigger |
| Radio.Group | `radiogroup` | ArrowUp/Down/Left/Right | Roving tabindex | — |
| ErrorBoundary | `alert` (default) | Focus to heading on error | Programmatic focus | — |

### 14.2 Color Contrast

All components must meet WCAG 2.2 AA:
- Text: ≥ 4.5:1 against background
- Non-text (border, focus ring, badge dot, checkbox): ≥ 3:1

### 14.3 Reduced Motion

All animated components (Modal, Drawer, Tooltip, Tabs) must respect `prefers-reduced-motion: reduce`:
- Modal/Drawer: skip fade/slide animations
- Tooltip: skip fade-in animation
- Tabs: no transition on tab color change

---

## 15. Performance Impact

| Component | Estimated gzip | Note |
|-----------|---------------|------|
| Button | ~0.8 kB | Simple button/link with variants |
| Input | ~1.2 kB | Label, error, helper, icon slots |
| Select | ~0.6 kB | Native select wrapper |
| Checkbox | ~0.5 kB | Simple input + label |
| Badge | ~0.3 kB | Pure CSS, no JS logic |
| Avatar | ~0.4 kB | Image + fallback |
| Modal test | ~0 kB (dev) | Jest test file |
| Drawer test | ~0 kB (dev) | Jest test file |
| Tabs test | ~0 kB (dev) | Jest test file |
| Server soft-delete | ~0 kB | Server-side only |

**Total production impact:** ~3.8 kB gzip — well within current budgets (max 63.47 kB gzip per route).

**Bundle budget check after each component build:**
```bash
npx tsx scripts/check-budgets.ts
```

---

## 16. Verification Plan

### 16.1 Unit/Integration Tests

```yaml
scope: all *.test.tsx files in src/shared/components/ + src/features/projects/
command: npx vitest run
target:
  lines: 96
  branches: 87
  functions: 85
threshold: "blocking (CI)"
```

### 16.2 A11y Tests

```yaml
scope: all *.axe.test.tsx files
command: npx vitest run --reporter=verbose --include='**/*.axe.test.tsx'
tool: jest-axe + axe-core
threshold: "0 violations (critical/serious)"
# After Phase 7: 17 axe test files (4 existing + 6 new components + 5 existing a11y gap + 2 feature pages)
```

### 16.3 Server Tests

```yaml
scope: server/src/**/*.test.ts
command: cd server && pnpm test
threshold: "all passing (≥ 15 existing + new soft-delete tests)"
```

### 16.4 TypeScript

```yaml
command: pnpm typecheck
threshold: "zero errors (strict mode)"
```

### 16.5 Build

```yaml
command: pnpm build
budgets:
  js: 200 kB warn / 350 kB error (gzip)
  css: 30 kB warn / 60 kB error (gzip)
threshold: "within budget"
```

### 16.6 Integration Test

```yaml
file: src/features/projects/__tests__/projectFeature.test.tsx
scenarios:
  - list → create → detail → edit → list updated
  - empty state on no results
  - error state on API failure with retry
  - delete from detail page → redirect to list
threshold: "all scenarios pass"
```

---

## 17. Implementation Details Per Component

### 17.1 Button

```tsx
// Uses href presence as discriminant (no `as` prop)
// TypeScript agent recommended over optional discriminated union

export function Button({
  variant = 'primary',
  size = 'md',
  icon,
  loading = false,
  fullWidth = false,
  children,
  ...rest
}: ButtonProps): ReactElement {
  const className = clsx(
    styles.button,
    styles[variant],
    styles[size],
    fullWidth && styles.fullWidth,
    loading && styles.loading,
  );

  if ('href' in rest && rest.href) {
    const { href, ...anchorRest } = rest;
    return (
      <a href={href} className={className} {...anchorRest}>
        {icon && <span className={styles.icon}>{icon}</span>}
        {children}
      </a>
    );
  }

  const { disabled, type = 'button', ...buttonRest } = rest as ButtonAsButton;
  return (
    <button
      type={type}
      className={className}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      aria-disabled={loading || undefined}
      {...buttonRest}
    >
      {loading ? <Spinner size="sm" /> : icon ? <span className={styles.icon}>{icon}</span> : null}
      <span className={loading ? styles.loadingText : undefined}>{children}</span>
    </button>
  );
}
```

### 17.2 Input

```tsx
// forwardRef for react-hook-form integration
// Password visibility toggle built in

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, helperText, prefixIcon, suffixIcon, showPasswordToggle, type = 'text', id, ...props },
  ref,
) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const errorId = `${inputId}-error`;
  const helperId = `${inputId}-helper`;
  const [showPassword, setShowPassword] = useState(false);
  const actualType = showPasswordToggle && showPassword ? 'text' : type;

  return (
    <div className={styles.wrapper}>
      <label htmlFor={inputId} className={styles.label}>{label}</label>
      <div className={styles.inputWrapper}>
        {prefixIcon && <span className={styles.prefix}>{prefixIcon}</span>}
        <input
          ref={ref}
          id={inputId}
          type={actualType}
          className={clsx(styles.input, error && styles.inputError)}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={error ? errorId : helperText ? helperId : undefined}
          {...props}
        />
        {showPasswordToggle && type === 'password' && (
          <button type="button" onClick={() => setShowPassword((v) => !v)} aria-label={showPassword ? 'Hide password' : 'Show password'}>
            {showPassword ? <EyeOffIcon /> : <EyeIcon />}
          </button>
        )}
        {suffixIcon && <span className={styles.suffix}>{suffixIcon}</span>}
      </div>
      {error && <p id={errorId} role="alert" className={styles.error}>{error}</p>}
      {helperText && !error && <p id={helperId} className={styles.helper}>{helperText}</p>}
    </div>
  );
});
```

### 17.3 Modal (existing — test only)

No changes to the component itself. Tests must cover:
- Renders via portal on the `document.body`
- Focus trap (Tab cycles through focusable elements only)
- Esc key closes (unless `closeOnEsc={false}`)
- Backdrop click closes (unless `closeOnBackdrop={false}`)
- Focus returns to trigger element on close
- Body scroll locked while open
- All sizes render correctly

### 17.4 Drawer (existing — test only)

Same test contract as Modal, plus:
- Slides in from correct side (left/right)
- Animation respects `prefers-reduced-motion`

### 17.5 Tabs (existing — test only)

Tests must cover:
- Controlled mode (index + onChange)
- Uncontrolled mode (defaultIndex)
- Tab click selects correct panel
- ArrowLeft/ArrowRight keyboard navigation
- Home/End keys
- Disabled tab skipped
- aria-selected, aria-controls, aria-labelledby correct
- Only renders active panel

### 17.6 Tooltip (existing — test only)

Tests must cover:
- Shows on hover (mouseEnter) after showDelay
- Shows on keyboard focus (onFocus) after showDelay
- Hides on mouseLeave after hideDelay
- Hides on blur after hideDelay
- Rapid show/hide clears timers correctly
- All 4 positions render with correct CSS class
- aria-describedby links trigger to tooltip
- role="tooltip" present

### 17.7 Radio.Group (existing — test only)

Tests must cover:
- Renders radiogroup role with aria-label
- Click selects correct radio
- onChange fires with correct value
- Arrow keys navigate between radios
- Disabled radio skipped during arrow navigation
- checked prop matches value

### 17.8 ErrorBoundary (existing — test only)

Tests must cover:
- Renders children normally when no error
- Catches render error → shows fallback
- Fallback render function receives error + reset
- Reset restores children
- onError callback called
- Default fallback has role="alert"

---

## 18. Barrel Export Updates

After all components are built/tested, update `src/shared/components/index.ts`:

```typescript
// Existing exports (keep)
export { Spinner } from './Spinner';
export { Skeleton } from './Skeleton';
export { Toast } from './Toast';
export { ToastRegion } from './ToastRegion';
export { EmptyState } from './EmptyState';
export { ErrorDisplay } from './ErrorDisplay';
export { DataTable } from './DataTable';
export { Pagination } from './Pagination';
export { ConfirmDialog } from './ConfirmDialog';

// New — primitives
export { Button } from './Button';
export type { ButtonProps, ButtonVariant, ButtonSize } from './Button';
export { Input } from './Input';
export type { InputProps } from './Input';
export { Select } from './Select';
export type { SelectProps, SelectOption } from './Select';
export { Checkbox } from './Checkbox';
export type { CheckboxProps } from './Checkbox';
export { Badge } from './Badge';
export type { BadgeProps, BadgeVariant, BadgeSize } from './Badge';
export { Avatar } from './Avatar';
export type { AvatarProps, AvatarSize } from './Avatar';

// Existing partials (unchanged — tests added but exports same)
export { Modal } from './Modal';
export type { ModalProps } from './Modal';
export { Drawer } from './Drawer';
export type { DrawerProps } from './Drawer';
export { Tabs } from './Tabs';
export type { TabsProps } from './Tabs';
export { Tooltip } from './Tooltip';
export type { TooltipProps } from './Tooltip';
export { ErrorBoundary } from './ErrorBoundary';
export type { ErrorBoundaryProps, FallbackRender } from './ErrorBoundary';
export { Radio } from './Radio';
export type { RadioProps, RadioGroupProps } from './Radio';
```

---

## 19. Sign-Off Checklist

- [ ] Architecture fits existing patterns; no new abstractions without justification
- [ ] No cyclic dependencies between modules
- [ ] No new global state introduced
- [ ] All type contracts use `interface` or `type` appropriately, no `any`
- [ ] 6 new components built: Button, Input, Select, Checkbox, Badge, Avatar
- [ ] 6 partial components tested: Modal, Drawer, Tabs, Tooltip, Radio.Group, ErrorBoundary
- [ ] 5 existing components a11y-tested: EmptyState, ErrorDisplay, DataTable, Pagination, ConfirmDialog
- [ ] Server soft-delete implemented: `deletedAt` on Project model
- [ ] Feature pages refactored to use design system: ProjectForm, ProjectList, ProjectListPage, ProjectDetail, SettingsPage
- [ ] Integration test for full project CRUD flow
- [ ] `pnpm lint` — zero errors
- [ ] `pnpm typecheck` — zero errors
- [ ] `pnpm test --coverage` — gates met (≥96% lines / ≥87% branches / ≥85% functions)
- [ ] `pnpm build` — bundle within budget
- [ ] `cd server && pnpm test` — all passing
- [ ] `pnpm axe` — zero critical/serious
- [ ] CHANGELOG entry for user-facing change
- [ ] No `TODO` without a linked ticket
