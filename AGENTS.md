# AGENTS.md — TCSgon Project Rules

> Immutable engineering principles and behavior for every AI assistant
> working in this repository (opencode, Cursor, Claude Code, Codex, Gemini).

These rules supersede any individual tool default. When in conflict, the
more specific file wins; if equal specificity, this file wins.

---

## 1. Project Identity

- **Type:** React 18+ SPA, TypeScript (strict), Vite, Redux Toolkit, React Query.
- **Domain:** Enterprise frontend — maintainability, scalability, performance,
  security, and accessibility are non-negotiable.
- **License:** Internal — no third-party model may be given unauthenticated
  outbound network access without explicit human approval.

---

## 2. Non-Negotiable Engineering Standards

1. Correctness
2. Readability
3. Maintainability
4. Testability
5. Performance
6. Scalability
7. Security

Maintainability > cleverness. Always.

---

## 3. Code Rules

### TypeScript
- `strict: true`, `noUncheckedIndexedAccess: true`, `exactOptionalPropertyTypes: true`.
- `any` is forbidden. Use `unknown` + narrowing or a precise type.
- Prefer `interface` for object shapes; `type` only for unions, intersections, utility composition.
- Discriminated unions for all variant data.
- All public APIs typed end-to-end. No implicit `any` from missing return types.

### React
- Functional components + hooks only. No class components in new code.
- Composition over inheritance. No render props unless idiomatic (e.g. `<Form.Field>`).
- State decision order: **local → Context → React Query → Redux Toolkit**.
- Introduce Redux only with written justification (global state crossing 3+ trees).
- `React.memo` only when profiling shows benefit; never preemptively.
- Error Boundaries at route + feature boundaries, not per-leaf.
- Suspense + lazy for route-level code splitting.
- No prop drilling beyond two levels — lift state, use Context, or restructure.

### State & Data
- Server state via React Query; cache invalidation is explicit and keyed.
- Forms: controlled only for small UI; otherwise React Hook Form + Zod.
- Never duplicate server state into Redux. Never put derived data in both.

### API
- REST: typed client per resource; Zod (or generated) schema for runtime validation.
- GraphQL: code-generated types (GraphQL Code Generator); no hand-written interfaces.
- Always handle: loading, error, empty, retry, cancellation, optimistic updates.

### Performance
- Route-level code splitting mandatory.
- Bundle budget per route: warn at 200 kB gzip, error at 350 kB gzip.
- Images: AVIF/WebP, responsive `srcset`, lazy below the fold.
- Virtualize lists > 50 rows.
- Profile before optimizing; record in PR description.

### Accessibility (WCAG 2.2 AA minimum)
- Semantic HTML first; ARIA only when no native element exists.
- All interactive elements keyboard-reachable with visible focus.
- Color contrast ≥ 4.5:1 (text) / 3:1 (UI).
- `prefers-reduced-motion` honored.
- Forms: labels associated, errors announced, focus moved on submit.

### Security
- No secrets in source. No tokens in client bundle.
- CSP enforced; `dangerouslySetInnerHTML` requires a written justification in the PR.
- User-supplied URLs validated against an allowlist before navigation.
- Dependencies audited weekly; high/critical CVEs block release.

### Testing
- Unit: Vitest + React Testing Library. Behavior, not implementation.
- Integration: React Testing Library + MSW for network.
- E2E: Playwright. Smoke suite runs on every PR.
- Coverage gates: 80% lines / 75% branches on `src/**`; below this blocks CI.
- Every bug fix ships with a regression test that fails before the fix.

### Git & PRs
- Conventional commits (`feat:`, `fix:`, `refactor:`, `test:`, `docs:`, `chore:`).
- Branches: `feat/<scope>-<ticket>`, `fix/<scope>-<ticket>`.
- PRs include: intent, screenshot/GIF for UI, test plan, risk + rollback.
- No force-push to `main`. No squash-merge of multi-author PRs without consent.

---

## 4. AI Behavior

- You are an **engineering accelerator**, not an authority.
- Validate every generated function. Reject hallucinated APIs.
- Verify library versions and breaking changes before recommending.
- When unsure, **say so and propose a verification step** — never fabricate.
- Surface architectural risk **before** implementation, not after.
- Prefer the simplest implementation that satisfies the standards above.

---

## 5. Forbidden Patterns

- `any`, `// @ts-ignore`, `eslint-disable` without an inline justification comment.
- Class components, HOCs, render props (except library-required).
- `useEffect` for derived state — compute during render.
- `dangerouslySetInnerHTML` for non-trusted content.
- Direct `fetch` in components — go through the API layer.
- Hidden global state, module-level mutable singletons.
- Untyped event handlers (`(e: any) =>`).
- Secrets, API keys, or PII in source or commits.

---

## 6. Review Checklist (apply on every change)

- [ ] Architecture fits existing patterns; no new abstraction without justification.
- [ ] Naming: domain language, no abbreviations beyond team glossary.
- [ ] Type safety: no `any`, no unsafe casts, exhaustive unions.
- [ ] Performance: no avoidable re-renders, no unnecessary bundle weight.
- [ ] Accessibility: keyboard, focus, ARIA, contrast, motion.
- [ ] Security: no XSS sink, no unvalidated URL, no leaked secret.
- [ ] Tests: unit + integration where the surface changed.
- [ ] Docs: README/JSDoc updated; CHANGELOG entry for user-facing change.
- [ ] Edge cases: empty, loading, error, offline, large input.

---

## 7. Definition of Done

- Builds clean (lint + typecheck + tests all green).
- PR description complete with test plan + screenshots.
- At least one peer review approval from a CODEOWNER.
- CI green; coverage thresholds met.
- No new TODO without a linked ticket.