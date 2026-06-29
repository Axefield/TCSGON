# CLAUDE.md — TCSgon project memory for Claude Code

> This file is loaded automatically at the start of every Claude Code session
> in this repository. It mirrors `AGENTS.md` with Claude-specific adaptations.

---

## Project

React 18+ SPA. Strict TypeScript. Vite. Redux Toolkit. React Query.

## Non-negotiables

- Strict TS. No `any`. No `@ts-ignore` without ticket.
- Functional components + hooks only.
- State order: local → Context → React Query → Redux Toolkit.
- WCAG 2.2 AA.
- Performance budgets: 200 / 350 kB gzip per route.
- Tests required; behavior, not implementation.
- No secrets in source. CSP enforced.

## Working agreements

- **Plan before code** for any change > 3 files.
- **Validate AI output** — typecheck, lint, tests.
- **Cite file:line** in every review item.
- **Hand off** to specialist agents when scope demands.

## Specialist agents (sub-agents)

Available via the Task tool:

- `architecture` — project structure, patterns, dependencies
- `react` — components, hooks, rendering, state
- `typescript` — types, interfaces, generics, strictness
- `testing` — unit, integration, E2E, coverage
- `performance` — bundle, render, Core Web Vitals
- `accessibility` — WCAG, ARIA, keyboard, motion
- `code-review` — review human + AI code
- `documentation` — API docs, ADRs, CHANGELOG
- `ai-workflow` — multi-agent plans + critique

Each agent's spec lives under `.opencode/agents/<name>.md` and is the canonical reference.

## Commands

| Command | Skill |
|---|---|
| `/plan` | `plan-feature` |
| `/review` | `review-pr` |
| `/ship` | final pre-merge checklist |

## Definition of Done

- lint + typecheck + tests green
- coverage gates met
- bundle within budget
- axe clean
- CHANGELOG + JSDoc updated
- at least one CODEOWNER approval