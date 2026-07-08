# Runbook — TCSgon

> Daily operations guide for development, testing, building, and deployment.

---

## Quick Reference

```bash
pnpm dev              # Vite HMR (:5173) + Express (:3001) concurrently
pnpm lint             # ESLint flat config
pnpm lint:fix         # auto-fix safe issues
pnpm typecheck        # tsc --noEmit (strict)
pnpm test             # Vitest (watch mode)
pnpm test:run         # Vitest (single run)
pnpm test --coverage  # coverage gates: 80 / 75 / 80
pnpm build            # production build (tsc -b + vite build)
pnpm build:analyze    # same + bundle visualizer → dist/stats.html
pnpm preview          # preview production build on :4173
pnpm e2e              # Playwright (chromium)
pnpm axe              # a11y audit via @axe-core/playwright
pnpm check:budgets    # verify JS/CSS bundle size budgets
pnpm clean            # remove dist/, coverage/, playwright-report/
```

---

## Development

### First time setup

```bash
git clone <repo-url>
cd tcsgon
pnpm install           # install all workspace dependencies
pnpm --filter tcsgon-server exec prisma generate  # generate Prisma client
pnpm --filter tcsgon-server exec prisma migrate dev  # apply migrations
pnpm --filter tcsgon-server exec prisma db seed      # seed dev data
pnpm dev               # start Vite + Express
```

### Daily workflow

```bash
git checkout -b feat/<scope>-<ticket>
# ... make changes ...
pnpm lint              # fix any lint errors
pnpm typecheck         # fix any type errors
pnpm test:run          # ensure all tests pass
pnpm build             # ensure build succeeds
git add -A
git commit -m "feat: description"
git push -u origin HEAD
# Open PR → CI runs → merge after review
```

### Running the full stack

```bash
pnpm dev
# Frontend: http://localhost:5173
# Backend:  http://localhost:3001
# Health:   http://localhost:3001/api/health
```

### Running only one part

```bash
pnpm --filter tcsgon-server dev   # Express only
pnpm --filter tcsgon dev          # Vite only (uses proxy → :3001)
```

---

## Testing

### Client tests

```bash
pnpm test               # watch mode
pnpm test:run           # single run
pnpm test --coverage    # with coverage report
pnpm test:run -- --reporter verbose  # full test names
pnpm test:run -- src/features/auth   # filter by path
```

### Server tests

```bash
pnpm --filter tcsgon-server test            # all server tests
pnpm --filter tcsgon-server test -- --reporter verbose
```

Server tests require a PostgreSQL test database. The setup:
- Connects to `tcsgon_test` database
- Runs migrations before each test run
- Truncates tables between tests (FK-safe order)
- Runs on port 5242 by default

### E2E tests

```bash
pnpm build              # required before E2E
pnpm e2e                # headless
pnpm e2e -- --headed    # visible browser
pnpm e2e -- --ui        # Playwright UI mode
pnpm e2e -- --debug     # step-through debug
```

### Accessibility audit

```bash
pnpm build              # required before axe
pnpm axe                # full audit
```

---

## Building

```bash
pnpm build              # standard production build
pnpm build:analyze      # with bundle visualizer
```

Output:
- Client: `dist/` (Vite — static assets)
- Server: `server/dist/` (TypeScript compilation)

### Bundle budgets (enforced at build)

| Asset | Warn | Error |
|-------|------|-------|
| JS per route | 200 kB gzip | 350 kB gzip |
| CSS per route | 30 kB gzip | 60 kB gzip |

---

## Deployment

### Using Docker Compose (full stack)

```bash
# Build and start all services
docker compose up --build -d

# View logs
docker compose logs -f

# Stop
docker compose down

# Reset database
docker compose down -v
```

### Manual deployment (server)

```bash
cd server
pnpm build                    # compile TypeScript
DATABASE_URL=<url> npx prisma migrate deploy  # apply migrations
DATABASE_URL=<url> node dist/index.js          # start server
```

### Environment variables

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_URL` | — | PostgreSQL connection string |
| `PORT` | `3001` | Server listen port |
| `CORS_ORIGIN` | `http://localhost:5173` | Allowed CORS origin |
| `SESSION_EXPIRY_HOURS` | `72` | Session TTL in hours |
| `BCRYPT_COST` | `12` | bcrypt rounds |
| `NODE_ENV` | `development` | `production` or `development` |

---

## Database

### Migrations

```bash
pnpm --filter tcsgon-server prisma:migrate   # create + apply migration
pnpm --filter tcsgon-server exec prisma migrate dev  # dev mode
pnpm --filter tcsgon-server exec prisma migrate deploy  # production
```

### Seed

```bash
pnpm --filter tcsgon-server prisma:seed
```

Seeded accounts:
| Email | Password |
|-------|----------|
| `admin@tcsgon.dev` | `password123` |
| `testuser@example.com` | `Password123!` |

### Studio

```bash
pnpm --filter tcsgon-server prisma:studio  # Prisma Studio on :5555
```

---

## CI/CD Pipeline

The project uses GitHub Actions for CI:

| Workflow | Trigger | Jobs |
|----------|---------|------|
| `ci.yml` | PR to `main`, push to `main` | Client (lint + typecheck + test + build), Server (test + Postgres), E2E (Playwright), A11Y (axe-core) |

All status checks must pass before merge. Coverage gates:
- Lines: **80%**
- Branches: **75%**
- Functions: **80%**

---

## Troubleshooting

### `prisma generate` fails
Ensure `DATABASE_URL` is set in `server/.env` or environment.

### Port already in use
- `:5173` — Vite dev server. Kill with `npx kill-port 5173`
- `:3001` — Express. Kill with `npx kill-port 3001`
- `:5242` — PostgreSQL

### Tests fail with DB connection error
Ensure PostgreSQL is running on `localhost:5242`. Start with Docker:
```bash
docker run -d --name tcsgon-postgres -e POSTGRES_PASSWORD=Axefield5242 -p 5242:5432 postgres:17-alpine
```

### Windows-specific
- Use `pnpm test:run` instead of `pnpm test` (watch mode has issues on some Windows terminals)
- Line endings: repo uses LF; Git autocrlf is set to `true` on Windows
