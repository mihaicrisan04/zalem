# syntax=docker/dockerfile:1.7

# build context must be the repo root, not apps/web
# in dokploy: set "Docker Context Path" = "." and "Dockerfile Path" = "apps/web/Dockerfile"

FROM oven/bun:1.3.10 AS deps
WORKDIR /repo

COPY package.json bun.lock turbo.json ./
COPY apps/web/package.json apps/web/package.json
COPY packages/ui/package.json packages/ui/package.json
COPY packages/env/package.json packages/env/package.json
COPY packages/backend/package.json packages/backend/package.json
COPY packages/config/package.json packages/config/package.json

# --linker=hoisted forces a flat node_modules without bun's .bun symlink layout,
# which sidesteps the React Compiler / Turbopack module resolution bug
# (https://github.com/oven-sh/bun/issues/24419)
RUN bun install --frozen-lockfile --linker=hoisted


# builder runs on node, not bun — bun chokes on next.config.ts loading
# (TypeError: Expected CommonJS module to have a function wrapper)
FROM node:22-slim AS builder
WORKDIR /repo

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=deps /repo/node_modules ./node_modules
COPY . .

# NEXT_PUBLIC_* values are baked into the client bundle at build time,
# so they must be available as ARGs (passed via dokploy "Build Args")
ARG NEXT_PUBLIC_CONVEX_URL
ARG NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
ENV NEXT_PUBLIC_CONVEX_URL=$NEXT_PUBLIC_CONVEX_URL
ENV NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=$NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY

RUN ./node_modules/.bin/turbo run build --filter=web


FROM node:22-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN groupadd --system --gid 1001 nodejs \
  && useradd --system --uid 1001 --gid nodejs nextjs

COPY --from=builder --chown=nextjs:nodejs /repo/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /repo/apps/web/.next/static ./apps/web/.next/static

USER nextjs
EXPOSE 3000

CMD ["node", "apps/web/server.js"]
