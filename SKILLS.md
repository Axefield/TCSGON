# SKILLS.md — TCSgon Project Skills Index

> Procedural capabilities available to every AI tool in this repository.
> Each entry links to the canonical workflow under `.opencode/skills/<name>/SKILL.md`.

| Skill | Trigger | Output |
|---|---|---|
| `plan-feature` | "plan <feature>" or new ticket | Architecture overview, file plan, interfaces, risks |
| `review-pr` | PR URL or diff | Review report against `AGENTS.md` §6 |
| `perf-audit` | "perf audit" or route change | Profile plan + measurements + recommendations |
| `a11y-audit` | "a11y audit" or UI change | WCAG 2.2 AA findings + remediation |
| `refactor` | "refactor <module>" | Stepwise refactor plan with safety nets |

Cross-tool commands mirror these in `.cursor/commands/`, `.gemini/commands/`,
`.codex/agents/`, and `.claude/agents/`.

---

## Routing

| Task shape | Agent |
|---|---|
| New feature / module / route | `architecture` → `react` → `typescript` → `testing` |
| Performance regression | `performance` |
| Accessibility bug | `accessibility` |
| PR or human/AI code review | `code-review` |
| API surface or external doc | `documentation` |
| Multi-agent task plan | `ai-workflow` |