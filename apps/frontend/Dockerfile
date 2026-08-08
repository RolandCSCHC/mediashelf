# Frontend Dockerfile — multi-stage build with Next.js standalone output
FROM node:22-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
WORKDIR /app

FROM base AS build
COPY package.json pnpm-workspace.yaml .npmrc ./
COPY packages/shared-types/package.json ./packages/shared-types/
COPY packages/eslint-config/package.json ./packages/eslint-config/
COPY apps/frontend/package.json ./apps/frontend/
RUN pnpm install --filter @mediashelf/frontend...

COPY packages/shared-types ./packages/shared-types
COPY packages/eslint-config ./packages/eslint-config
COPY apps/frontend ./apps/frontend

RUN pnpm --filter @mediashelf/shared-types build

ENV NEXT_TELEMETRY_DISABLED=1
ARG NEXT_PUBLIC_API_URL=http://localhost:3001
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
RUN pnpm --filter @mediashelf/frontend build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

COPY --from=build /app/apps/frontend/public ./apps/frontend/public
COPY --from=build --chown=nextjs:nodejs /app/apps/frontend/.next/standalone ./
COPY --from=build --chown=nextjs:nodejs /app/apps/frontend/.next/static ./apps/frontend/.next/static

USER nextjs
EXPOSE 3000
CMD ["node", "apps/frontend/server.js"]
