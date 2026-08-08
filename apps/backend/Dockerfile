# Backend Dockerfile — multi-stage build for NestJS + Prisma
FROM node:22-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
WORKDIR /app

FROM base AS build
COPY package.json pnpm-workspace.yaml .npmrc ./
COPY packages/shared-types/package.json ./packages/shared-types/
COPY packages/eslint-config/package.json ./packages/eslint-config/
COPY apps/backend/package.json ./apps/backend/
RUN pnpm install --filter @mediashelf/backend...

COPY packages/shared-types ./packages/shared-types
COPY packages/eslint-config ./packages/eslint-config
COPY apps/backend ./apps/backend

RUN pnpm --filter @mediashelf/shared-types build
RUN pnpm --filter @mediashelf/backend exec prisma generate
RUN pnpm --filter @mediashelf/backend build

FROM node:22-alpine AS runner
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
WORKDIR /app
ENV NODE_ENV=production

COPY --from=build /app/package.json /app/pnpm-workspace.yaml /app/.npmrc ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/packages/shared-types ./packages/shared-types
COPY --from=build /app/packages/eslint-config ./packages/eslint-config
COPY --from=build /app/apps/backend ./apps/backend
COPY apps/backend/docker-entrypoint.sh ./apps/backend/docker-entrypoint.sh

RUN chmod +x ./apps/backend/docker-entrypoint.sh

WORKDIR /app/apps/backend
EXPOSE 3001
ENTRYPOINT ["./docker-entrypoint.sh"]
