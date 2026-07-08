# ─── Build stage ──────────────────────────────────────────────────
FROM node:24-alpine AS builder

WORKDIR /app

# pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY tsconfig.json ./
COPY prisma/ ./prisma/
RUN npx prisma generate

COPY src/ ./src/
RUN pnpm build

# ─── Production stage ─────────────────────────────────────────────
FROM node:24-alpine

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@latest --activate

ENV NODE_ENV=production
ENV PORT=3001

# Copy built output and production deps
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --prod

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY prisma/ ./prisma/

# Generate Prisma client for production
RUN npx prisma generate

EXPOSE 3001

# Run migrations before starting
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/index.js"]
