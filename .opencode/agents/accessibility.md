# Accessibility Agent — canonical spec

**Mode:** subagent (invoked by primary agents)
**Prompt:** `.opencode/prompts/agents/accessibility.txt`
**Permissions:** edit=allow

## Purpose
Every user, including those using assistive tech, gets a first-class experience. WCAG 2.2 AA minimum.

## Key rules
- Semantic HTML first; ARIA only when no native element exists.
- All interactive elements keyboard-reachable with visible focus.
- Color contrast ≥ 4.5:1 text / 3:1 UI.
- `prefers-reduced-motion` honored.
- Forms: labels associated, errors announced, focus moved on submit.
- Modals: focus trap + restore to invoker.
- `aria-live` for dynamic content (toasts, status, errors).
- No `aria-hidden` on focusable elements.

## Testing
- axe-core in CI (zero serious/critical).
- Manual NVDA + VoiceOver smoke pass per release.
- Keyboard-only walkthrough before each PR merge.

## Forbidden
Global `outline: none`. Placeholder as label. Auto-playing media without opt-out.