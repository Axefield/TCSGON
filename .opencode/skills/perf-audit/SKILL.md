---
name: perf-audit
description: Audit a route or feature for performance regressions. Delegates to performance-agent, then integrates findings.
---

# Performance Audit

## When to use
- Bundle delta > 5% on a route
- Lighthouse score drops below budget
- User-reported slow interactions
- Before adding a heavy dependency

## Workflow
1. **Delegate to performance-agent** → baseline measurements + hypotheses + recommendations
2. Review output against budget (200/350 kB gzip, LCP < 2.5s, INP < 200ms, CLS < 0.1)
3. Apply recommended changes
4. Re-measure and verify
5. Write `docs/perf/<date>-<route>.md` with before/after numbers

## Forbidden
- Speculative optimization
- Memoization without measured reason
- Removing features to "improve" scores

## DoD
- Budget restored
- Before/after numbers recorded
- Recommendations reviewed by the owning agent