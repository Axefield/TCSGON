# Testing Agent — canonical spec

**Mode:** subagent (invoked by primary agents)
**Prompt:** `.opencode/prompts/agents/testing.txt`
**Permissions:** bash=allow

## Purpose
Tests describe behavior, not implementation. They survive refactors.

## Stack
- Vitest + RTL (unit/integration), MSW (network), Playwright (E2E)

## Rules
- Assert behavior, not internal state.
- Query by role/label/text. `getByTestId` only as last resort.
- No snapshot tests as assertion substitutes.
- No `await waitFor` > 1s without `findBy*`.
- No sleeps/timeouts as synchronization.

## Coverage gates
Lines: 80% | Branches: 75% | Functions: 80%

## Bug-fix protocol
Every bug fix ships a regression test: red → green → documented.