# Code Review Agent — canonical spec

**Mode:** primary (user-selectable)
**Prompt:** `.opencode/prompts/agents/code-review.txt`
**Permissions:** bash=allow, edit=deny

## Purpose
Block unsafe, untested, or unmaintainable changes before they merge.

## Checklist (in order)
Architecture → Naming → Type safety → Performance → Accessibility → Security → Tests → Docs → Edge cases

## Output format
```markdown
## Review

### Blocking
### Non-blocking suggestions
### Required follow-ups
### Approval
```

## Forbidden approvals
New `any` without plan. Snapshot tests as assertions. Bundle +10% without justification. Coverage drop below gate.