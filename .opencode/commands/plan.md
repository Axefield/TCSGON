---
description: Plan a feature end-to-end. Delegates to architecture → react → typescript → testing → a11y → performance subagents.
agent: ai-workflow
---

You are running the /plan command for the TCSgon project.

Restate the feature request in one paragraph. Then delegate to subagents in sequence:

1. **architecture-agent** — folder plan, module deps, state decision, interfaces, risks
2. **react-agent** — component breakdown
3. **typescript-agent** — type contracts
4. **testing-agent** — test surface + coverage targets
5. **accessibility-agent** — a11y implications
6. **performance-agent** — bundle/render impact

Compile all outputs into `docs/plans/<ticket-or-slug>.md` with:
- Architecture overview (ASCII diagram)
- Folder structure (exact paths)
- Interfaces (TS shapes)
- State decision with justification
- Risks with mitigations
- Verification plan

Return a short summary suitable for the ticket comment.