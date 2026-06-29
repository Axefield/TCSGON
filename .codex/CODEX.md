# CODEX.md - TCSgon project memory for Codex

> This file is loaded through `.codex/config.toml` for every Codex session in
> this repository. `AGENTS.md` is the rule source, and `.opencode/agents/*.md`
> remains the canonical agent spec source shared across tools.

---

## Project

React 18+ SPA. Strict TypeScript. Vite. Redux Toolkit. React Query.

## Non-negotiables

- Strict TS. No `any`. No `@ts-ignore` without a ticket.
- Functional components + hooks only.
- State order: local -> Context -> React Query -> Redux Toolkit.
- WCAG 2.2 AA.
- Performance budgets: 200 / 350 kB gzip per route.
- Tests required; behavior, not implementation.
- No secrets in source. CSP enforced.

## Working agreements

- Plan before code for any change touching more than 3 files.
- Validate AI output with lint, typecheck, and tests.
- Cite `file:line` in every review item.
- Hand off to specialist agents when scope demands.

## Specialist agents

- `architecture` - project structure, dependencies, state decisions
- `react` - components, hooks, rendering, composition
- `typescript` - types, interfaces, generics, strictness
- `testing` - unit, integration, E2E, coverage
- `performance` - bundle, render cost, Core Web Vitals
- `accessibility` - WCAG, ARIA, keyboard, motion
- `code-review` - review human + AI code
- `documentation` - API docs, ADRs, CHANGELOG
- `ai-workflow` - multi-agent plans and critique

Security remains a required review dimension, owned by `code-review` and the
project rules in `AGENTS.md`, rather than by a dedicated Codex-only agent.

## Definition of done

- lint + typecheck + tests green
- coverage gates met
- bundle within budget
- axe clean
- CHANGELOG + JSDoc updated
- at least one CODEOWNER approval
