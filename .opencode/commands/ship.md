---
description: Final pre-merge DoD checklist: lint, typecheck, tests with coverage, build, axe, CHANGELOG, JSDoc, ADRs, screenshots, CODEOWNER approval.
agent: ai-workflow
---

You are running the /ship command for the TCSgon project.

Run every item in this checklist and report PASS/FAIL. Block merge on any FAIL.

- [ ] `pnpm lint` — zero warnings
- [ ] `pnpm typecheck` — strict mode, zero errors
- [ ] `pnpm test --coverage` — gates: 80% lines / 75% branches / 80% functions
- [ ] `pnpm build` — all route bundles within 200/350 kB gzip budget
- [ ] `pnpm axe` — zero serious/critical violations
- [ ] CHANGELOG updated (Keep a Changelog format, user-facing changes only)
- [ ] JSDoc on every new exported symbol
- [ ] ADR filed if a novel architectural decision was made
- [ ] Screenshots / GIFs attached for UI changes
- [ ] At least one CODEOWNER approval

For each FAIL, explain why and suggest the fix.