---
name: ship
description: Final pre-merge checks. Runs the full Definition of Done checklist.
---

# Ship

## When to use
- Before merging any PR

## Checklist
- [ ] `pnpm lint`
- [ ] `pnpm typecheck`
- [ ] `pnpm test --coverage` (gates: 80/75/80)
- [ ] `pnpm build` (route bundles within budget)
- [ ] `pnpm axe` (zero serious/critical)
- [ ] CHANGELOG updated
- [ ] JSDoc on new exports
- [ ] ADR filed if novel decision was made
- [ ] Screenshots / GIFs for UI changes
- [ ] At least one CODEOWNER approval

Report each item as PASS/FAIL. Block merge on any FAIL.