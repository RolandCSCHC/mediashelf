# MediaShelf

Personal media library for movies and TV series — Google login, TMDB search, custom lists, watch progress, JSON backup, and installable PWA. Built as a production-style portfolio app and deployed on Render.

## Deployment

Deployed on Render (Docker web services + managed PostgreSQL).

| Service  | URL                                             |
| -------- | ----------------------------------------------- |
| Frontend | https://mediashelf-m5rq.onrender.com            |
| API      | https://mediashelf-api-cetd.onrender.com        |
| Health   | https://mediashelf-api-cetd.onrender.com/health |
| Swagger  | https://mediashelf-api-cetd.onrender.com/docs   |

Free-tier services may sleep when idle; the first request after a pause can take ~30–60s.

## Features

- **Google OAuth** with JWT in an httpOnly cookie (private per-user libraries)
- **TMDB search** and one-click import of movies / series (posters, genres, metadata)
- **Manual entries** when a title is missing from TMDB
- **Library CRUD** with status (Watchlist / Watching / Watched / Future) and downloaded flag
- **Filters & sort** by status, type, genre, downloaded, list; sort by title, date added, release date, or date watched; title search
- **Custom lists** with bulk add from the library
- **Series progress per list** (season / episode on membership, not on the media item)
- **Panels / list view toggle** on library and list pages (persisted in `localStorage`)
- **JSON export / merge import** for library + lists (`/backup`)
- **Dark / light mode**, responsive shell, mobile nav
- **PWA** (manifest, icons, service worker) — installable on phone over HTTPS
- **Swagger / OpenAPI** at `/docs`
- **CI** on GitHub Actions (lint, typecheck, Prettier, unit tests, build)

## Stack

- **Frontend:** Next.js (App Router), TypeScript, Tailwind CSS
- **Backend:** NestJS, TypeScript, Prisma
- **Database:** PostgreSQL
- **Auth:** Google OAuth + JWT httpOnly cookie
- **Monorepo:** pnpm workspaces
- **Containers:** Docker + Docker Compose (local)
- **Production:** Render (frontend + backend web services, managed Postgres)

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/) and Docker Compose
- [Node.js](https://nodejs.org/) 20+ (for local non-Docker development)
- [pnpm](https://pnpm.io/) 9+ (`corepack enable`)
- A Google Cloud OAuth 2.0 Client (for login)
- A [TMDB](https://www.themoviedb.org/settings/api) API key (for search / import)

## Quick start (Docker)

```bash
cp .env.example .env
# Fill in GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, JWT_SECRET, and TMDB_API_KEY
docker compose up --build
```

| Service  | URL                          |
| -------- | ---------------------------- |
| Frontend | http://localhost:3000        |
| Backend  | http://localhost:3001        |
| Health   | http://localhost:3001/health |
| Swagger  | http://localhost:3001/docs   |
| Login    | http://localhost:3000/login  |
| Postgres | localhost:5432               |

On startup the backend runs Prisma migrations. Log in with Google to create your account and start building your library.

## Google OAuth setup (local)

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
TMDB_API_KEY=your_v3_api_key
```

## Auth flow

1. Frontend sends the browser to `GET /auth/google`.
2. NestJS completes the Google OAuth handshake at `/auth/google/callback`.
3. The backend upserts the `User` row and sets an httpOnly JWT cookie (`mediashelf_token`).
4. Protected API routes use `JwtAuthGuard` (cookie-based).
5. Protected UI routes (e.g. `/library`) call `GET /auth/me` with credentials and redirect to `/login` when unauthenticated.

Cross-origin production (separate frontend/API hosts) uses `Secure` + `SameSite=None` cookies when `FRONTEND_URL` is `https://…`. Local HTTP keeps `SameSite=Lax`.

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

## Using the app

| Route           | Purpose                                                     |
| --------------- | ----------------------------------------------------------- |
| `/search`       | TMDB search and import into the library                     |
| `/library`      | Full library with filters, sort, search, panels/list toggle |
| `/library/[id]` | Title detail, status, lists, notes                          |
| `/lists`        | Custom lists CRUD                                           |
| `/lists/[id]`   | List detail, bulk add, per-list series progress             |
| `/backup`       | Export library JSON / merge-import a backup                 |

`GET /media` accepts filter and sort query params (including `search`). `PATCH /media/:id` updates status and downloaded. `PATCH /lists/:id/items/:mediaItemId` updates per-list series progress. `GET /backup` / `POST /backup/import` handle JSON backup.

## Workspace layout

```text
apps/frontend           Next.js (PWA, UI)
apps/backend            NestJS + Prisma + Swagger
packages/shared-types   Shared enums and interfaces
packages/eslint-config  Shared ESLint flat configs
```

## Code quality

```bash
pnpm lint          # ESLint (frontend, backend, shared-types)
pnpm typecheck     # TypeScript --noEmit across packages
pnpm test          # Backend Jest unit tests
pnpm format        # Prettier write
pnpm format:check  # Prettier check (CI-friendly)
pnpm check         # Prepare deps, then lint + typecheck + test + format
pnpm build         # Build shared-types, backend, frontend
```

GitHub Actions (`.github/workflows/ci.yml`) runs on every pull request and every push to `main`:

1. **Lint and typecheck** — ESLint, `tsc`, Prettier
2. **Unit tests** — Jest (mappers, cookies, etc.)
3. **Build** — full monorepo build (Prisma client generated in CI)

## Documentation

- [Project overview](docs/PROJECT_OVERVIEW.md) — goals, features, roadmap
- [Development guidelines](docs/DEVELOPMENT_GUIDELINES.md) — engineering standards
