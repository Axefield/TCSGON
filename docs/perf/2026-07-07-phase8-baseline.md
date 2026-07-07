# Phase 8 Performance Baseline

**Date:** 2026-07-07
**Commit (pre):** f977ccc  
**Commit (post):** 1cfd5fd
**Environment:** Desktop (Chromium, 1920×1080), localhost preview
**Tooling:** Lighthouse CI 0.15.x / Lighthouse 12.6.1 (Node API), Vite 5.x

---

## Bundle Sizes (gzip) — Pre vs Post

| Chunk | Pre-Phase 8 (kB) | Post-Phase 8 (kB) | Δ |
|-------|------------------|-------------------|---|
| vendor-react | 64.99 | 64.99 | — |
| vendor-state | 23.64 | 23.64 | — |
| vendor-forms | 22.27 | 22.27 | — |
| index (main entry) | 8.38 | 10.23 | **+1.85** (eager LandingPage) |
| projects | 7.42 | 7.52 | +0.10 |
| dashboard | 3.56 | 3.55 | -0.01 |
| settings | 2.73 | 2.75 | +0.02 |
| project-form | 2.08 | 2.07 | -0.01 |
| project-detail | 1.41 | 1.63 | +0.22 |
| LandingPage | 1.24 | *(folded into index)* | **-1.24** |
| ResetPasswordPage | 1.38 | 1.39 | +0.01 |
| SignupPage | 1.30 | 1.31 | +0.01 |
| ForgotPasswordPage | 1.23 | 1.24 | +0.01 |
| LoginPage | 1.27 | 1.29 | +0.02 |
| NotFoundPage | 0.44 | 0.44 | — |
| AuthLayout | 0.31 | 0.31 | — |
| PasswordStrengthIndicator | 0.72 | 0.72 | — |
| **Total JS (excl. vendor-react)** | **~58 kB** | **~59 kB** | **+1 kB** |

### Top CSS chunks (gzip) — Post
- projects: 4.63 kB (was 4.60)
- index: 3.02 kB (was 2.20 — eager LandingPage styles)
- dashboard: 1.75 kB (was 1.74)
- settings: 1.04 kB (was 1.04)
- other: < 0.5 kB each

### Budget check
- All routes within 200 kB warn / 350 kB error ✓
- Largest route (projects): ~105 kB JS gzip total ✓

---

## Lighthouse Scores (desktop, single run)

| Route | Perf | A11y | BP | SEO | LCP | TBT | CLS |
|-------|------|------|----|-----|-----|-----|-----|
| `/` (Landing) | 0.97 | 1.0 | 0.96 | 1.0 | 2.1 s | 7 ms | 0 |
| `/dashboard` | 0.96 | 1.0 | 0.96 | 1.0 | 2.3 s | 0 ms | 0 |

All targets met:
- ✅ LCP < 2.5 s (max 2.3 s)
- ✅ CLS < 0.1 (0.0 both routes)
- ✅ TBT < 200 ms (max 7 ms)
- ✅ Performance ≥ 0.9 (min 0.96)
- ✅ Accessibility = 1.0

---

## Optimization Status

| Optimization | Status | Delta kB | LCP Δ | TBT Δ |
|--------------|--------|----------|-------|-------|
| Eager LandingPage | ✅ done | +1.85 (index) / -1.24 (chunk) | — | — |
| VirtualizedDataTable | ✅ done | +0 (gated, never activates at current scale) | — | — |
| OptimizedImage | ✅ done | +0.3 kB (shared) | — | — |
| Memoization | ✅ done | ~0 | — | — |
| Avatar srcSet/sizes/loading | ✅ done | ~0 | — | — |
| Theme toggle + CSS var audit | ✅ done | ~0 | — | — |
| Body background fix | ✅ done | ~0 | — | — |

---

## Verification Runbook

1. `pnpm build && pnpm build:analyze` — ✅ done
2. `pnpm typecheck` — ✅ 0 errors
3. `pnpm lint` — ✅ 0 errors (1 pre-existing warning)
4. `pnpm test:run` — ✅ 800 passed, 110 files
5. Lighthouse — ✅ all assertions pass (see above)
6. Manual: axe DevTools — ✅ WCAG 2.2 AA, zero violations

---

## Notes

- **Pre-baseline:** commit f977ccc (post-Phase 7)
- **Post-baseline:** commit 1cfd5fd (Phase 8 complete)
- LandingPage eagerly loaded (+1.85 kB on index chunk, −1.24 kB separate chunk = net +0.61 kB).
- Virtualization gated at `data.length > 50`; current `pageSize=3` means gate never activates → zero cost today.
- Theme toggle, CSS variable audit, and body background fix were discovered during Phase 8 review and fixed.
- Lighthouse CI cannot run on Windows locally (EPERM in chrome-launcher temp cleanup); runs correctly on GitHub Actions Linux.
