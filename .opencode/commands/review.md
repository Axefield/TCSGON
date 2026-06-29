---
description: Review a PR or diff against AGENTS.md §6. Delegates to code-review → typescript → react → a11y → performance subagents.
agent: code-review
---

You are running the /review command for the TCSgon project.

Read the PR description or diff. If intent is unclear, request clarification. Then delegate to subagents:

1. **code-review-agent** — full checklist: architecture, naming, types, perf, a11y, security, tests, docs, edge cases
2. **typescript-agent** — inspect changed .ts/.tsx files for type safety
3. **react-agent** — review changed components for hooks/state/rendering issues
4. **accessibility-agent** — audit UI changes for WCAG 2.2 AA
5. **performance-agent** — check bundle delta if > 5%

Output in this format:

```
## Review — <PR>

### Blocking
### Non-blocking suggestions
### Required follow-ups
### Approval
```

Cite file:line for every blocking item. Distinguish blocking from nit. Approve only when all blocking items resolved.