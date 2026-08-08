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

On startup the backend runs Prisma migrations. Log in with Google to create your account and start building your library.

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
   ```

3. Run apps:

   ```bash
   pnpm dev
   ```

## Workspace layout

```text
apps/frontend           Next.js
apps/backend            NestJS + Prisma
packages/shared-types   Shared enums and interfaces
packages/eslint-config  Shared ESLint flat configs
```

## Code quality

```bash
pnpm lint          # ESLint (frontend, backend, shared-types)
pnpm typecheck     # TypeScript --noEmit across packages
pnpm format        # Prettier write
pnpm format:check  # Prettier check (CI-friendly)
pnpm check         # Prepare deps, then lint + typecheck + format:check
```

GitHub Actions runs `pnpm check` and `pnpm build` on every pull request and every push to `main` (see `.github/workflows/ci.yml`).

## TMDB setup

1. Create an account at [TMDB](https://www.themoviedb.org/).
2. Request an API key under [Settings → API](https://www.themoviedb.org/settings/api).
3. Add it to `.env`:

```bash
TMDB_API_KEY=your_v3_api_key
```

Authenticated users can search at `/search` and import titles into `/library`.

On `/library` (and each title’s detail page), you can:

- Filter by status, type, genre, downloaded, and custom list
- Sort by title, date added, release date, or date watched
- Set status: Watchlist, Watching, Watched, or Future
- Toggle the downloaded flag
- Track series progress **per list** (season / episode on list membership)
- Remove a title from your library

Custom lists live at `/lists`. Create unlimited lists, add titles from a detail page, and set different series progress in each list (for example S1–2 in “watched” and S3 in “to watch”).

`GET /media` accepts filter and sort query params. `PATCH /media/:id` updates status and downloaded. `PATCH /lists/:id/items/:mediaItemId` updates per-list series progress.

## Documentation

- [Project overview](docs/PROJECT_OVERVIEW.md)
- [Development guidelines](docs/DEVELOPMENT_GUIDELINES.md)
