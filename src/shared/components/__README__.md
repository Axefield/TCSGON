# `src/shared/components/` convention

> **Status:** Defined in `roadmap.md §2`. First primitives land in Phase 2 (Design System).

Every shared component ships **five files** — no exceptions:

```
<ComponentName>/
├── <ComponentName>.tsx          # Implementation
├── <ComponentName>.test.tsx     # RTL tests (render, interact, edge cases)
├── <ComponentName>.stories.tsx  # Storybook story (all variants + states)
├── <ComponentName>.axe.test.ts  # axe-core audit (zero critical/serious)
└── index.ts                     # Barrel re-export
```

## Component API rules

- **Explicit `interface` for props** — no `React.FC`
- **One component per file**
- **Filename matches export** (`Button.tsx` → `export function Button`)
- **Forward refs** when wrapping a native element (`Input`, `Select`)
- **Semantic HTML first** — ARIA only when no native element exists
- **Keyboard reachable** — every interactive element is focusable with visible focus ring
- **No `useEffect` for derived state** — compute during render
- **`React.memo` only with profiling evidence** — never preemptive

## Accessibility contract (every component)

- Color contrast ≥ 4.5:1 (text) / 3:1 (UI)
- `prefers-reduced-motion` honored
- Error states announce via `aria-live`
- Modals trap focus + return focus to trigger