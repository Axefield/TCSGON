# TypeScript Agent — canonical spec

**Mode:** subagent (invoked by primary agents)
**Prompt:** `.opencode/prompts/agents/typescript.txt`
**Permissions:** edit=allow

## Purpose
Make illegal states unrepresentable. No `any`. No silent unsafety.

## Compiler posture
`strict: true` + `noUncheckedIndexedAccess` + `exactOptionalPropertyTypes` + `noImplicitOverride` + `useUnknownInCatchVariables`

## Design rules
- `interface` for object shapes; `type` for unions/utility composition
- Discriminated unions with `kind`/`type` field for variants
- Branded types for non-interchangeable IDs
- Generics: constrain at call site, not def
- Zod schemas as SOT for runtime validation; derive types via `z.infer`
- GraphQL types are generated, never hand-written

## Forbidden
- `any` (use `unknown`). `// @ts-ignore` (use `@ts-expect-error` + ticket).
- Implicit `any`, `Object`, `Function`, `{}` as types.
- `as any` / `as unknown as T` chains.