# Phase 8 Performance Baseline

**Date:** 2026-07-07
**Commit:** f977ccc
**Environment:** Desktop (Chromium, 1920×1080), localhost preview
**Tooling:** Lighthouse CI 0.15.x, Vite 5.x + rollup-plugin-visualizer

---

## Bundle Sizes (gzip) — Pre-Phase 8

| Chunk | Pre-Phase 8 (kB) |
|-------|------------------|
| vendor-react | 64.99 |
| vendor-state | 23.64 |
| vendor-forms | 22.27 |
| index (main entry) | 8.38 |
| projects | 7.42 |
| dashboard | 3.56 |
| settings | 2.73 |
| project-form | 2.08 |
| project-detail | 1.41 |
| LandingPage | 1.24 |
| ResetPasswordPage | 1.38 |
| SignupPage | 1.30 |
| ForgotPasswordPage | 1.23 |
| LoginPage | 1.27 |
| NotFoundPage | 0.44 |
| AuthLayout | 0.31 |
| PasswordStrengthIndicator | 0.72 |
| CSS (total) | ~8.18 |
| **Total JS (excl. vendor-react)** | **~58 kB** |

### Top CSS chunks (gzip)
- projects: 4.60 kB
- index: 2.20 kB
- dashboard: 1.74 kB
- settings: 1.04 kB
- LandingPage: 0.90 kB
- other: < 0.5 kB each

### Budget check
- All routes within 200 kB warn / 350 kB error (current max: vendor-react 64.99 kB).
- Largest route (projects): ~104 kB JS gzip total.

---

## Lighthouse CI Scores (median of 3, desktop)

To be captured during Phase 8 implementation. Current assertion targets:
- LCP < 2.5s (typically < 800ms locally)
- CLS < 0.1 (typically < 0.01)
- TBT < 200ms (typically < 50ms)
- Performance score ≥ 0.9 (typically 0.99+)
- Accessibility score = 1.0

---

## Optimization Status

| Optimization | Status | Delta kB | LCP Δ | TBT Δ |
|--------------|--------|----------|-------|-------|
| Eager LandingPage | ⬜ planned | TBD | TBD | TBD |
| VirtualizedDataTable | ⬜ planned | TBD (gated) | TBD | TBD |
| OptimizedImage | ⬜ planned | TBD | TBD | TBD |
| Memoization | ⬜ planned | TBD | TBD | TBD |
| Avatar srcSet/sizes/loading | ⬜ planned | TBD | TBD | TBD |

---

## Verification Runbook

1. `pnpm build && pnpm build:analyze` — record bundle sizes
2. `pnpm check:budgets` — verify budgets
3. `pnpm lhci` — record CWV
4. Manual: React DevTools Profiler on each route
5. Manual: axe DevTools or `pnpm axe` for a11y regression
6. Update all "TBD" cells above

---

## Notes

- This baseline was captured at commit f977ccc (post-Phase 7 / pre-Phase 8).
- LandingPage currently lives in its own chunk (1.24 kB gzip) — eager import will fold it into `index` chunk.
- No real images in the app yet; image pipeline is structural / future-proofing.
- Virtualization gated at `data.length > 50`; current `pageSize=3` means gate never activates → zero cost today.
