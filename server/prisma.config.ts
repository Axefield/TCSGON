import { defineConfig } from 'prisma/config'

// Prisma does not auto-load .env when a config file is present.
// Load env vars manually so DATABASE_URL is available during migrations.
process.loadEnvFile('.env')

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    seed: 'tsx prisma/seed.ts',
  },
})
