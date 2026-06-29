---
name: refactor
description: Plan and execute a behavior-preserving refactor with safety nets. Delegates to architecture → typescript → testing agents.
---

# Refactor

## When to use
- Code hard to read
- Tests brittle
- Module boundaries eroded
- Pattern repeats in 3+ places

## Principles
- Behavior-preserving. No feature changes in the same PR.
- Test-gated. Tests green before, during, and after.
- Stepwise. One mechanical change per commit.

## Workflow
1. Establish safety net: ensure test coverage exists; write characterization tests if not
2. **Delegate to architecture-agent** → target module structure
3. **Delegate to typescript-agent** → interface contracts for the new shape
4. Sequence changes in dependency order (leaves first)
5. Each commit: lint + typecheck + tests green
6. **Delegate to testing-agent** → verify coverage maintained
7. Write `docs/refactor/<date>-<scope>.md`

## Forbidden
- Mixing refactor with feature work
- Large-bang rewrites without intermediate green states
- Renaming AND moving in the same commit

## DoD
- All tests green throughout
- Public API changes announced in CHANGELOG
- ADR updated if architecture changed