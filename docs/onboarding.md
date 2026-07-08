# Onboarding — TCSgon

> Get productive in 30 minutes. Clone → deps → agents → first PR.

---

## Prerequisites

| Tool | Version | Check |
|------|---------|-------|
| Node.js | >= 24 LTS | `node -v` |
| pnpm | >= 10 | `pnpm -v` |
| Git | latest | `git --version` |
| PostgreSQL | 17+ | `psql --version` (optional for local dev) |

---

## 1. Clone & Install (5 min)

```bash
git clone <repo-url>
cd tcsgon
pnpm install
```

This installs all workspace dependencies (client + server) from the frozen lockfile.

---

## 2. Database Setup (5 min)

```bash
# Create the database
createdb tcsgon

# Apply migrations + seed
pnpm --filter tcsgon-server exec prisma migrate dev
pnpm --filter tcsgon-server exec prisma db seed
```

---

## 3. Verify Everything Works (5 min)

```bash
# Run all tests
pnpm test:run                    # 800+ client tests
pnpm --filter tcsgon-server test  # 65+ server tests

# Typecheck
pnpm typecheck   # zero errors

# Lint
pnpm lint        # zero errors

# Build
pnpm build       # produces dist/
```

---

## 4. Start Developing (2 min)

```bash
pnpm dev
```

Opens:
- **Frontend:** http://localhost:5173
- **Backend:** http://localhost:3001
- **Health check:** http://localhost:3001/api/health

### Seeded accounts

| Email | Password | Role |
|-------|----------|------|
| `admin@tcsgon.dev` | `password123` | Admin |
| `testuser@example.com` | `Password123!` | User |

---

## 5. AI Agents (3 min)

This project uses AI coding agents. The agent config is in `.opencode/`.

### Available agents

| Agent | Command | Purpose |
|-------|---------|---------|
| Architecture | — | Design features before coding |
| React | — | Component design & review |
| TypeScript | — | Type contracts & validation |
| Testing | — | Test strategy & coverage |
| Performance | — | Bundle & runtime audit |
| Accessibility | — | WCAG 2.2 AA audit |
| Code Review | `/review` | Block unsafe changes |
| Documentation | — | JSDoc, ADRs, READMEs |
| AI Workflow | — | Orchestrate multi-agent work |

### Available skills

| Skill | Command | Purpose |
|-------|---------|---------|
| `plan-feature` | `/plan <feature>` | End-to-end feature planning |
| `review-pr` | `/review` | PR review against AGENTS.md |
| `ship` | `/ship` | Final pre-merge checks |
| `a11y-audit` | — | WCAG audit + fix |
| `perf-audit` | — | Bundle/render audit |
| `refactor` | — | Safe refactoring with tests |

### Configuration files

- **`AGENTS.md`** — Immutable engineering standards (non-negotiable)
- **`.opencode/agents/*.md`** — Agent canonical specs
- **`.opencode/skills/*/SKILL.md`** — Skill workflows
- **`.opencode/prompts/*.txt`** — Agent system prompts

---

## 6. Project Structure (5 min)

```
tcsgon/
├── src/                       # React frontend
│   ├── features/              # Feature modules
│   │   ├── auth/              # Authentication (login, signup, etc.)
│   │   ├── projects/          # Project CRUD
│   │   ├── dashboard/         # Dashboard stats
│   │   └── users/             # Settings, notifications
│   ├── shared/                # Cross-feature primitives
│   │   ├── components/        # Design system (17+ components)
│   │   ├── api/               # API client, errors, query client
│   │   ├── hooks/             # Shared hooks
│   │   ├── types/             # Zod schemas + TypeScript types
│   │   └── utils/             # Pure utilities
│   ├── store/                 # Redux (auth + ui slices)
│   ├── layouts/               # AppShell, AuthLayout, etc.
│   ├── routes/                # Route tree (lazy-loaded)
│   ├── styles/                # CSS tokens + reset
│   ├── test-utils/            # Test helpers
│   └── main.tsx               # App entry
├── server/                    # Express backend
│   ├── src/
│   │   ├── routes/            # API routes (auth, users, projects, dashboard)
│   │   ├── services/          # Business logic
│   │   ├── middleware/        # Auth, validation, error handling
│   │   ├── lib/               # Prisma client, crypto utilities
│   │   └── types/             # Shared server types
│   └── prisma/                # Schema, migrations, seed
├── e2e/                       # Playwright E2E tests
├── test/                      # MSW handlers + test utilities
├── docs/                      # Plans, ADRs, runbook, perf baselines
└── scripts/                   # Build tools (budget checker, edge case validator)
```

---

## 7. Making Your First PR (5 min)

### Branch naming

```
feat/<scope>-<ticket>     # New features
fix/<scope>-<ticket>       # Bug fixes
refactor/<scope>-<ticket>  # Refactoring
docs/<scope>-<ticket>      # Documentation
```

### Before committing

```bash
pnpm lint          # zero errors
pnpm typecheck     # zero errors
pnpm test:run      # all green
pnpm build         # within budget
```

### Commit style

```
feat(auth): add password strength indicator
fix(dashboard): correct stats endpoint path
docs: add runbook for deployment operations
```

### PR checklist

- [ ] Architecture fits existing patterns
- [ ] No `any`, no `@ts-ignore`
- [ ] Tests: unit + integration
- [ ] a11y: keyboard + axe-clean
- [ ] Bundle within budget
- [ ] CHANGELOG updated for user-facing changes
- [ ] Screenshot/GIF for UI changes

---

## 8. Key Policies

- **TypeScript strict mode** — `any` is forbidden. Use `unknown` + narrowing.
- **State decision order** — local `useState` → Context → React Query → Redux (justified)
- **Testing** — 80% lines / 75% branches / 80% functions minimum
- **Accessibility** — WCAG 2.2 AA minimum (axe-core in CI, zero critical/serious)
- **Security** — No secrets in source. CSP enforced. No `dangerouslySetInnerHTML` without justification.
- **No AI output without critique** — Every artifact reviewed against AGENTS.md §6.

---

## 9. Getting Help

- **Runbook:** `docs/runbook.md` — daily operations guide
- **Architecture docs:** `docs/plans/` — phase-by-phase plans
- **ADRs:** `docs/adr/` — key decisions explained
- **Edge cases:** `docs/edge-cases/` — registered edge case scenarios
- **AI agents:** Reference `.opencode/` for agent capabilities
