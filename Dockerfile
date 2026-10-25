# Dockerfile for the Precision Farming Ecosystem Dashboard (Next.js 16 standalone)
# Used by Render (Docker deployment path) or any container runtime.

# ─── Stage 1: deps ─────────────────────────────────────────────────
FROM node:20-alpine AS deps
WORKDIR /app

# Install dependencies separately for better layer caching
COPY package.json package-lock.json* bun.lock* ./
RUN npm install --legacy-peer-deps

# ─── Stage 2: builder ───────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

RUN npm run build

# ─── Stage 3: runner ────────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000

# Add non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy standalone output (configured in next.config.ts: output: "standalone")
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

USER nextjs

EXPOSE 3000

ENV HOSTNAME="0.0.0.0"
ENV PORT=3000

# server.js is the Next.js standalone entrypoint
CMD ["node", "server.js"]
