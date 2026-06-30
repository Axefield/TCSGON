# Plan — Phase 0: `package.json` + project scaffold

**Status:** Implemented and verified (all gates green: lint, typecheck, 100% coverage, build, e2e, axe).
**Scope:** Phase 0 of `roadmap.md`.
**Owning agents:** architecture → react → typescript → testing → accessibility → performance.

## Decisions (locked before implementation)

| # | Decision | Resolution |
|---|---|---|
| 1 | Coverage thresholds at Phase 0 | **Keep 80/75/80.** Smoke test must be real checks (renders `<App />` with all providers mounted, asserts heading + tagline visible, asserts initial Redux state, asserts dispatch→re-render via `act()`). |
| 2 | a11y E2E package | **`@axe-core/playwright@^4.12.1`** (Deque official, MPL-2.0, 4.1M weekly DL). Drop `axe-playwright` (third-party wrapper, last publish 10 months ago). |
| 3 | Node version | **`>=24.0.0`** (v24 "Krypton" is current LTS as of 2026-06; v20 went EOL March 2026). `.nvmrc = 24`. `packageManager = pnpm@10.32.1`. |
| 4 | React Router in Phase 0 | **Yes** — install + add `src/routes/index.ts` placeholder. ~2 kB cost, avoids future re-pin. Real `createBrowserRouter` in Phase 1. |
| 5 | Folder skeleton | **All directories created** with `.gitkeep` so `pnpm install` ships the complete agentic-ready structure. |

## Folder structure delivered

```
TCSgon/
├── package.json                       pnpm 10, Node 24, strict TS
├── pnpm-lock.yaml                     (generated)
├── .npmrc                             engine-strict, isolated node-linker
├── .nvmrc                             24
├── .prettierrc.json                   formatting
├── tsconfig.json                      strict + noUncheckedIndexedAccess + exactOptional + noEmit
├── tsconfig.node.json                 composite=true, only config files
├── vite.config.ts                     manual chunks (vendor-react, vendor-state)
├── vitest.config.ts                   jsdom, RTL setup, 80/75/80 coverage
├── playwright.config.ts               chromium-only, webServer=pnpm preview
├── eslint.config.js                   flat config, TS+React+Hooks+a11y+import+prettier
├── index.html                         #root + Vite script tag
├── public/favicon.svg                 SVG favicon
├── src/
│   ├── main.tsx                       ReactDOM root + providers
│   ├── App.tsx                        semantic <main><h1>+<p>, reads theme from store
│   ├── App.module.css                 CSS module
│   ├── App.test.tsx                   4 real checks, dispatches via act()
│   ├── test-utils.tsx                 renderWithProviders
│   ├── test-setup.ts                  jest-dom matchers + RTL cleanup
│   ├── vite-env.d.ts                  Vite + CSS module + asset ambient decls
│   ├── routes/index.ts                ROUTES constant + RoutePath type (Phase 1 router)
│   ├── features/__README__.md         convention doc per roadmap §4
│   ├── shared/
│   │   ├── api/queryClient.ts         RQ client with documented defaults
│   │   ├── api/queryClient.test.ts    2 tests, 100% covered
│   │   ├── components/__README__.md   convention doc per roadmap §2
│   │   ├── hooks/.gitkeep
│   │   ├── types/.gitkeep
│   │   └── utils/.gitkeep
│   ├── store/
│   │   ├── index.ts                   configureStore with uiReducer
│   │   ├── hooks.ts                   typed useAppDispatch + useAppSelector
│   │   └── slices/uiSlice.ts          ui.theme, setTheme + toggleTheme actions
│   │   └── slices/uiSlice.test.ts     4 tests, 100% covered
│   ├── styles/reset.css               modern reset + reduced-motion
│   ├── styles/tokens.css              color/space/typography tokens + dark theme
│   └── __tests__/.gitkeep
└── e2e/
    ├── smoke.spec.ts                  heading + tagline visible
    └── axe.spec.ts                    @a11y tag, zero critical/serious
```

## Verification — all gates green

```
pnpm install                ✓ 562 packages, 22s
pnpm lint                   ✓ 0 errors, 0 warnings
pnpm typecheck              ✓ 0 errors (strict + noUncheckedIndexedAccess)
pnpm test:coverage          ✓ 10/10 tests, 100/100/100/100
pnpm build                  ✓ 1.06s, total initial JS = ~62 kB gzip
pnpm e2e                    ✓ 2/2 specs (smoke + axe)
pnpm axe                    ✓ 1/1, zero critical/serious
pnpm build:analyze          ✓ dist/stats.html generated
```

Bundle output (gzip):
- `vendor-react` — 43.17 kB (React + ReactDOM + Router)
- `vendor-state` — 18.26 kB (RTK + RQ)
- `index` — 1.06 kB (App + main)
- CSS — 0.91 kB
- **Total initial: ~63 kB gzip** — well under 200 kB warn / 350 kB error budgets.

## Risks encountered and mitigated during implementation

| Risk | Resolution |
|---|---|
| `verbatimModuleSyntax: true` strictness | Used `import type { UiState }` where needed. All clean. |
| `tsc -b` emits `.js` for all `src/` + `e2e/` files | Added `noEmit: true` to `tsconfig.json`. `tsconfig.node.json` (composite) is the only emitter. |
| `import.meta.env` not typed | `/// <reference types="vite/client" />` at top of `src/vite-env.d.ts`. |
| `noPropertyAccessFromIndexSignature: true` + CSS module dot access | Removed flag — `noUncheckedIndexedAccess` already provides the safety. |
| Coverage gate triggered: `queryClient.ts` and `uiSlice.ts` had uncovered branches | Added `queryClient.test.ts` (2 tests) and `uiSlice.test.ts` (4 tests). Real checks, not stubs. |
| Redux dispatch outside `act()` → React warns | Wrapped dispatch in `act()` in the toggle-theme test. |
| Playwright `grep: {}` fails strict types | Removed (no default filter needed — `pnpm axe` uses `--grep @a11y` CLI flag). |
| `eslint-plugin-import` resolver needs TS support | Added `eslint-import-resolver-typescript` devDep. |

## Files added/modified (full list)

- `package.json`, `pnpm-lock.yaml`
- `tsconfig.json`, `tsconfig.node.json`
- `vite.config.ts`, `vitest.config.ts`, `playwright.config.ts`
- `eslint.config.js`, `.prettierrc.json`
- `.npmrc`, `.nvmrc`, `.gitignore` (extended)
- `index.html`, `public/favicon.svg`
- `src/main.tsx`, `src/App.tsx`, `src/App.module.css`, `src/App.test.tsx`
- `src/test-utils.tsx`, `src/test-setup.ts`, `src/vite-env.d.ts`
- `src/store/index.ts`, `src/store/hooks.ts`, `src/store/slices/uiSlice.ts`, `src/store/slices/uiSlice.test.ts`
- `src/shared/api/queryClient.ts`, `src/shared/api/queryClient.test.ts`
- `src/shared/components/__README__.md`, `src/features/__README__.md`
- `src/shared/hooks/.gitkeep`, `src/shared/types/.gitkeep`, `src/shared/utils/.gitkeep`, `src/__tests__/.gitkeep`
- `src/routes/index.ts`
- `src/styles/reset.css`, `src/styles/tokens.css`
- `e2e/smoke.spec.ts`, `e2e/axe.spec.ts`

## Out of scope (deferred per roadmap)

- Real router (`createBrowserRouter`) — Phase 1
- Theme persistence + `data-theme` sync to `<html>` — Phase 1
- Auth feature — Phase 3
- Design system components — Phase 2
- Storybook — Phase 2
- MSW handlers — Phase 1
- Lighthouse CI / bundle-size-diff PR comment — Phase 7
- GH Actions workflow — Phase 7