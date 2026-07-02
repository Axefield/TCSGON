export const config = {
  port: parseInt(process.env.PORT ?? '3001', 10),
  databaseUrl: process.env.DATABASE_URL ?? 'postgresql://postgres:Axefield5242@localhost:5242/tcsgon',
  corsOrigin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
  sessionExpiryHours: parseInt(process.env.SESSION_EXPIRY_HOURS ?? '72', 10),
  bcryptCost: parseInt(process.env.BCRYPT_COST ?? '12', 10),
  isProduction: process.env.NODE_ENV === 'production',
} as const;
