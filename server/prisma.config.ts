import { defineConfig } from 'prisma/config'

// Prisma does not auto-load .env when a config file is present.
// Load env vars manually so DATABASE_URL is available during migrations.
// Gracefully skip if .env doesn't exist (e.g. CI where DATABASE_URL is set via env).
try {
  process.loadEnvFile('.env');
} catch {
  // .env is optional — rely on existing process.env
}

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    seed: 'tsx prisma/seed.ts',
  },
})
