# MediaShelf

Track movies and TV series with custom lists, watch progress, Google authentication, and TMDB integration.

## Stack

- **Frontend:** Next.js (App Router), TypeScript, Tailwind CSS
- **Backend:** NestJS, TypeScript, Prisma
- **Database:** PostgreSQL
- **Auth:** Google OAuth + JWT httpOnly cookie
- **Monorepo:** pnpm workspaces

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/) and Docker Compose
- [Node.js](https://nodejs.org/) 20+ (for local non-Docker development)
- [pnpm](https://pnpm.io/) 9+ (`corepack enable`)
- A Google Cloud OAuth 2.0 Client (for login)

## Quick start (Docker)

```bash
cp .env.example .env
# Fill in GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and JWT_SECRET
docker compose up --build
```

| Service  | URL                          |
| -------- | ---------------------------- |
| Frontend | http://localhost:3000        |
| Backend  | http://localhost:3001        |
| Health   | http://localhost:3001/health |
| Login    | http://localhost:3000/login  |
| Postgres | localhost:5432               |

On startup the backend runs Prisma migrations and seeds a demo user with two media items.

## Google OAuth setup

1. Open [Google Cloud Console → Credentials](https://console.cloud.google.com/apis/credentials).
2. Create an **OAuth 2.0 Client ID** (application type: Web application).
3. Add authorized JavaScript origin: `http://localhost:3000`
4. Add authorized redirect URI: `http://localhost:3001/auth/google/callback`
5. Copy the client ID and secret into `.env`:

```bash
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_CALLBACK_URL=http://localhost:3001/auth/google/callback
JWT_SECRET=use-a-long-random-string
FRONTEND_URL=http://localhost:3000
CORS_ORIGIN=http://localhost:3000
```

## Auth flow

1. Frontend sends the browser to `GET /auth/google`.
2. NestJS completes the Google OAuth handshake at `/auth/google/callback`.
3. The backend upserts the `User` row and sets an httpOnly JWT cookie (`mediashelf_token`).
4. Protected API routes use `JwtAuthGuard` (cookie-based).
5. Protected UI routes (e.g. `/library`) call `GET /auth/me` with credentials and redirect to `/login` when unauthenticated.

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
