# ADR 0003 — TypeScript Strict Mode

**Status:** Accepted  
**Date:** 2026-07-07  
**Decision makers:** Architecture Agent, Tech Lead  
**Tags:** typescript, type-safety, strict-mode

---

## Context

TypeScript offers multiple strictness levels. We needed to choose a compiler posture that balances safety with productivity for an enterprise frontend.

The default `tsconfig.json` has `strict: false`, which allows:
- Implicit `any` from missing parameter types
- `null` / `undefined` access without checks
- Unsafe member access on objects

---

## Decision

Enable every strict flag:

```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "noImplicitOverride": true,
    "useUnknownInCatchVariables": true
  }
}
```

Additionally:
- `any` is **forbidden** by project convention (enforced in code review)
- Use `unknown` + narrowing or a precise type instead
- `Interface` for object shapes; `type` only for unions/intersections/utility composition
- Discriminated unions for all variant data
- Branded types for non-interchangeable IDs

---

## Rationale

1. **`noUncheckedIndexedAccess`** prevents the single largest source of runtime errors in TypeScript apps — accessing array elements or dictionary entries that may be undefined.

2. **`exactOptionalPropertyTypes`** catches a subtle bug class where `undefined` is assigned to an optional property that should only be `missing` or a value.

3. **`noImplicitOverride`** prevents accidental loss of parent class methods when the parent renames a method.

4. **`useUnknownInCatchVariables`** forces proper error type narrowing (`catch` blocks default to `unknown`, not `any`).

5. **Banning `any`** removes the escape hatch. Engineers must either type precisely or use `unknown` with proper narrowing — leading to safer code that documents its own contracts.

---

## Consequences

### Positive

- Zero unchecked index access at runtime
- Catch blocks properly narrow error types
- No implicit `any` leaks through function boundaries
- Discriminated unions make illegal states unrepresentable
- Code review focuses on logic, not type holes

### Negative

- `noUncheckedIndexedAccess` requires explicit checks on every array/object access
- Increased verbosity in generic utility code
- Learning curve for engineers used to loose TypeScript

### Mitigations

- Prefer `Array.prototype` methods (`map`, `filter`, `find`) which return typed results
- Use `as const` assertions and `satisfies` for literal types
- Document the reasoning in onboarding docs

---

## Code examples

### Before (loose)

```ts
function getFirst(items: string[]) {
  return items[0]; // type: string, runtime: undefined
}
```

### After (strict)

```ts
function getFirst(items: string[]): string | undefined {
  return items[0]; // type: string | undefined — caller must check
}
```

### Catch blocks

```ts
try {
  // ...
} catch (err) {
  // err is unknown, not any
  if (err instanceof ApiError) {
    // handle ApiError
  }
}
```

---

## Related

- AGENTS.md §3 — TypeScript rules
- AGENTS.md §5 — Forbidden patterns (`any`, `@ts-ignore`)
