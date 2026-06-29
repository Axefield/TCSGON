---
name: a11y-audit
description: Audit a route or feature for WCAG 2.2 AA compliance. Delegates to accessibility-agent, then applies fixes.
---

# Accessibility Audit

## When to use
- Every UI change before merge
- Quarterly full-app audit
- After any redesign

## Workflow
1. **Delegate to accessibility-agent** → automated findings + keyboard walkthrough + remediation
2. Apply fixes (edit permission)
3. Re-run axe-core (zero serious/critical)
4. Manual keyboard walkthrough
5. Screen reader smoke pass (NVDA + Firefox or VoiceOver + Safari)
6. Write `docs/a11y/<date>-<route>.md`

## DoD
- Zero serious/critical axe findings
- Keyboard walkthrough clean
- Screen reader smoke pass clean
- Remediation PR merged and re-audited