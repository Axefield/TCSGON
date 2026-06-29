---
name: review-pr
description: Review a PR or diff against AGENTS.md §6. Delegates to code-review → typescript → react → accessibility → performance agents.
---

# Review PR

## When to use
- Every PR opened against main
- Every change to AGENTS.md, security surface, or build config

## Workflow
1. Read PR description. If intent is unclear, request clarification.
2. **Delegate to code-review-agent** → full checklist (see `.opencode/prompts/agents/code-review.txt`)
3. **Delegate to typescript-agent** on changed `.ts/.tsx` files
4. **Delegate to react-agent** on changed components
5. **Delegate to accessibility-agent** if any UI change
6. **Delegate to performance-agent** if bundle delta > 5%
7. Check tests: behavior tests present, coverage maintained
8. Check docs: JSDoc, CHANGELOG, README if user-facing

## Output format
```
## Review — <PR>

### Blocking
### Non-blocking
### Required follow-ups
### Approval
```

## Rules
- Specific: file:line + suggestion
- Distinguish blocking from nit
- Approve only when all blocking items resolved
- Never approve your own PR