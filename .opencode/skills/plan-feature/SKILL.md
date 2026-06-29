---
name: plan-feature
description: Plan a new feature end-to-end before any code is written. Delegates to architecture → react → typescript → testing → a11y → performance subagents.
---

# Plan Feature

## When to use
- New ticket / user story
- Refactor crossing module boundaries
- Any change touching > 3 files

## Workflow
1. Restate the problem in one paragraph
2. Identify affected domain(s): routing, state, data, UI, infra
3. **Delegate to architecture-agent** → folder plan + module dependencies + state decision
4. **Delegate to react-agent** → component breakdown
5. **Delegate to typescript-agent** → interfaces and discriminated unions
6. **Delegate to testing-agent** → test surface + coverage targets
7. **Delegate to accessibility-agent** → a11y implications
8. **Delegate to performance-agent** → bundle / render impact
9. Compile into single `docs/plans/<ticket>.md`

## Output
- Architecture overview (ASCII)
- Folder structure (exact paths)
- Interfaces (TS shapes)
- State decision (with justification)
- Risks
- Verification plan

## DoD
- Plan reviewed by one human engineer
- Every new module has a clear owning agent
- Every risk has a mitigation
- Plan linked from the ticket