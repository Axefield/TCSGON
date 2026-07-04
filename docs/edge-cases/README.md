# Edge Case Registry

> Structured catalog of every known edge case across TCSgon features.
> Maintained as a Zod-validated JSON file at `docs/edge-cases/registry.json`.

## Purpose

- **Single source of truth** for edge case behavior across auth, dashboard, projects, and shared components.
- **CI gate** — `pnpm validate:edge-cases` runs in CI to ensure every entry follows the schema and referenced test files exist.
- **Test planning aid** — gaps in coverage are surfaced as warnings, guiding where new tests are needed.
- **Onboarding** — new team members can read the registry to understand the failure modes the application handles.

## Schema

| Field             | Type                                                                    | Required | Description                                |
|-------------------|-------------------------------------------------------------------------|----------|--------------------------------------------|
| `id`              | `string` (pattern `EC-\d{3,4}`)                                        | ✅       | Unique edge case identifier                |
| `feature`         | `string` (lowercase kebab/snake)                                       | ✅       | Feature name (e.g. `auth`, `project-list`) |
| `scenario`        | `string` (≤ 200 chars)                                                  | ✅       | Human-readable scenario                    |
| `category`        | `enum` (see below)                                                      | ✅       | Edge case category                         |
| `severity`        | `enum` (`critical` / `high` / `medium` / `low`)                        | ✅       | Business impact severity                   |
| `description`     | `string` (≤ 500 chars)                                                  | ✅       | Detailed description                       |
| `expectedBehavior`| `string` (≤ 500 chars)                                                  | ✅       | What should happen                         |
| `testCoverage`    | `enum` (`unit` / `integration` / `e2e` / `none`)                        | ✅       | Current test coverage level                |
| `testFile`        | `string`                                                                | ⚠️       | Required when `testCoverage ≠ "none"`      |
| `relatedBug`      | `string` (URL)                                                          | ❌       | GitHub issue if tracked                    |

### Categories

| Category             | Description                                       | A11y Concern                           |
|----------------------|---------------------------------------------------|----------------------------------------|
| `loading`            | Initial or paginated data loading                 | `aria-busy`, loading announcement      |
| `empty`              | No data or filtered to zero results               | Empty state role, description          |
| `empty_state`        | Feature in a default/empty state                  | Informative label for empty container  |
| `error`              | API or runtime failure                            | `role="alert"`, focus to error         |
| `offline`            | Network unavailable                               | Offline indicator, `aria-live`         |
| `invalid_input`      | Form validation failure                           | Validation error announcement          |
| `permission_denied`  | User lacks access to resource                     | `aria-live` status description         |
| `timeout`            | Request exceeds timeout limit                     | Fallback UI with retry                 |
| `concurrent_edit`    | Double-submit or concurrent mutation              | Debounce / idempotency indicator       |
| `overflow`           | Large data, long text, many items                 | Virtual scroll, pagination role        |

### Severity

| Severity   | Meaning                                                      |
|------------|--------------------------------------------------------------|
| `critical` | Data loss, security breach, or complete app crash            |
| `high`     | Feature unusable for a subset of users                       |
| `medium`   | Degraded UX, missing feedback, or non-blocking bug           |
| `low`      | Cosmetic issue, minor accessibility gap, or edge of edge     |

## Adding a New Entry

1. Assign the next available `EC-NNN` ID (check the last ID in the registry).
2. Fill in all fields following the schema above.
3. Ensure `testFile` points to an existing file when coverage is added.
4. Run `pnpm validate:edge-cases` to verify.
5. If `testCoverage` is `"none"`, add a `relatedBug` issue tracking the gap.

## Running Validation

```bash
# Validate the registry against the schema
pnpm validate:edge-cases

# Expected output for a valid registry:
# ✅ Edge case registry validation passed.
```

## Coverage Gaps

Entries with `testCoverage: "none"` are tracked gaps. Each must have a
corresponding `relatedBug` issue. Run validation to see the current gap list:

```bash
pnpm validate:edge-cases
# Look for "Warning: N edge case(s) have no test coverage"
```

## Current Stats

| Metric              | Count |
|---------------------|-------|
| Total entries       | 69    |
| Untested (`none`)   | 6     |
| Categories used     | 10    |
| Features covered    | 4     |

*Last updated: see `registry.json` → `lastUpdated`*
