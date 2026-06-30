# `src/features/<name>/` convention

> **Status:** Defined in `roadmap.md §4`. Implemented feature by feature starting Phase 3.

Each feature module is self-contained. Cross-feature imports go through `src/shared/`.

```
features/<name>/
├── api/                # React Query hooks + Zod schemas
│   ├── <name>Api.ts
│   └── <name>Api.test.ts
├── components/         # Feature-specific components
│   ├── <name>List.tsx
│   ├── <name>Detail.tsx
│   └── <name>Form.tsx
├── hooks/              # Feature-specific hooks
│   └── use<name>.ts
├── types/              # Feature-specific types
│   └── index.ts
├── pages/              # Route-level page components
│   ├── <name>ListPage.tsx
│   └── <name>DetailPage.tsx
├── __tests__/          # Integration tests
│   └── <name>.test.tsx
└── index.ts            # Public exports (barrel)
```

## Feature checklist (per AGENTS.md §3)

- [ ] Query/mutation hooks handle **loading, error, empty, success** states
- [ ] Optimistic updates where latency matters
- [ ] Error boundary at the feature root
- [ ] Lazy-loaded route
- [ ] MSW handlers for every API endpoint (in `src/test/msw/`)
- [ ] Keyboard-navigable list + detail views
- [ ] axe-clean at the page level
- [ ] Bundle contribution < 50 kB gzip per route
- [ ] Integration test: list → select → detail → edit → save → list updated
- [ ] E2E test: critical user journey