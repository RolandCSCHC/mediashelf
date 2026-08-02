# MediaShelf

Track movies and TV series with custom lists, watch progress, Google authentication, and TMDB integration.

## Stack

- **Frontend:** Next.js (App Router), TypeScript, Tailwind CSS
- **Backend:** NestJS, TypeScript, Prisma
- **Database:** PostgreSQL
- **Monorepo:** pnpm workspaces

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/) and Docker Compose
- [Node.js](https://nodejs.org/) 20+ (for local non-Docker development)
- [pnpm](https://pnpm.io/) 9+ (`corepack enable`)

## Quick start (Docker)

```bash
cp .env.example .env
docker compose up --build
```

| Service  | URL                         |
| -------- | --------------------------- |
| Frontend | http://localhost:3000       |
| Backend  | http://localhost:3001       |
| Health   | http://localhost:3001/health |
| Postgres | localhost:5432              |

On startup the backend runs Prisma migrations and seeds a demo user with two media items.

## Local development (apps outside Docker)

1. Start only Postgres:

   ```bash
   docker compose up postgres -d
   ```

2. Install dependencies and prepare the database:

   ```bash
   cp .env.example .env
   pnpm install
   pnpm --filter @mediashelf/shared-types build
   pnpm --filter @mediashelf/backend exec prisma migrate deploy
   pnpm --filter @mediashelf/backend exec prisma db seed
   ```

3. Run apps:

   ```bash
   pnpm dev
   ```

## Workspace layout

```text
apps/frontend     Next.js
apps/backend      NestJS + Prisma
packages/shared-types   Shared enums and interfaces
```

## Documentation

- [Project overview](docs/PROJECT_OVERVIEW.md)
- [Development guidelines](docs/DEVELOPMENT_GUIDELINES.md)
