# MediaShelf

Personal media library for movies and TV series — Google login, TMDB search, custom lists, watch progress, JSON backup, and installable PWA. Built as a production-style portfolio app; frontend and API on Vercel, database on Supabase.

## Deployment

| Service  | URL                                      |
| -------- | ---------------------------------------- |
| Frontend | https://mediashelf-frontend.vercel.app   |
| API      | https://mediashelf-api.vercel.app        |
| Health   | https://mediashelf-api.vercel.app/health |
| Swagger  | https://mediashelf-api.vercel.app/docs   |

Database: [Supabase](https://supabase.com/) managed PostgreSQL (Prisma uses a pooled `DATABASE_URL` at runtime and a direct `DIRECT_URL` for migrations).

## Features

- **Google OAuth** with JWT in an httpOnly cookie (private per-user libraries)
- **TMDB search**, title preview (cast, directors / creators), and one-click import of movies / series (posters, genres, metadata)
- **Manual entries** when a title is missing from TMDB
- **Library CRUD** with status (Watchlist / Watching / Watched / Upcoming) and downloaded flag
- **Filters & sort** by status, type, genre, downloaded, list; sort by title (default), date added, release date, or date watched; title search
- **Custom lists** with optional default status / downloaded (both are per list membership), bulk add from the library, and per-list edit
- **Series progress per list** (season / episode, status, and downloaded on membership, not only on the media item)
- **Panels / list view toggle** on library and list pages (persisted in `localStorage`)
- **Pagination** on library and lists (server-side; default 2 panel rows or 10 list rows; 25 / 50 / 100 / all)
- **JSON export / merge import** for library + lists (`/backup`)
- **Dark / light mode**
- **English / Spanish UI**
- **Responsive shell, mobile nav**
- **PWA** (manifest, icons, service worker) — installable on phone over HTTPS
- **Swagger / OpenAPI** at `/docs`
- **CI** on GitHub Actions (lint, typecheck, Prettier, unit tests, build)

## Stack

- **Frontend:** Next.js (App Router), TypeScript, Tailwind CSS
- **Backend:** NestJS, TypeScript, Prisma
- **Database:** PostgreSQL (Supabase in production; Docker Postgres locally)
- **Auth:** Google OAuth + JWT httpOnly cookie
- **Monorepo:** pnpm workspaces
- **Containers:** Docker + Docker Compose (local)
- **Production:** Vercel (frontend + API) + Supabase (Postgres)

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
4. Add authorized redirect URI: `http://localhost:3000/api/auth/google/callback`
5. Copy the client ID and secret into `.env`:

```bash
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_CALLBACK_URL=http://localhost:3000/api/auth/google/callback
JWT_SECRET=use-a-long-random-string
FRONTEND_URL=http://localhost:3000
CORS_ORIGIN=http://localhost:3000
NEXT_PUBLIC_API_URL=/api
API_URL=http://localhost:3001
TMDB_API_KEY=your_v3_api_key
```

## Auth flow

1. Frontend sends the browser to same-origin `GET /api/auth/google` (Next.js proxies to Nest).
2. NestJS completes the Google OAuth handshake at `/api/auth/google/callback` (also proxied).
3. The backend upserts the `User` row and sets an httpOnly JWT cookie (`mediashelf_token`) on the **frontend** origin.
4. Protected API routes use `JwtAuthGuard` (cookie-based); the browser calls `/api/...` so the cookie is first-party.
5. Protected UI routes (e.g. `/library`) call `GET /api/auth/me` with credentials and redirect to `/login` when unauthenticated.

This same-origin proxy is required in production: separate `*.vercel.app` frontend/API hosts are cross-site, and **Safari blocks third-party auth cookies** (desktop Chrome is more lenient). Cookies use `SameSite=Lax` (+ `Secure` on HTTPS).

### Production (Vercel + Supabase) checklist

1. **Frontend** project env: `NEXT_PUBLIC_API_URL=/api`, `API_URL=https://mediashelf-api.vercel.app` (redeploy so `NEXT_PUBLIC_*` is baked in).
2. **Backend** project env: `DATABASE_URL` (Supabase transaction pooler, port `6543`, `?pgbouncer=true`), `DIRECT_URL` (Supabase direct host `db.<project-ref>.supabase.co:5432`), plus `GOOGLE_*`, `JWT_SECRET`, `FRONTEND_URL`, `CORS_ORIGIN`.
3. Backend: `GOOGLE_CALLBACK_URL=https://mediashelf-frontend.vercel.app/api/auth/google/callback` (and matching `FRONTEND_URL` / `CORS_ORIGIN`).
4. Google Cloud Console → authorized JavaScript origin: `https://mediashelf-frontend.vercel.app`; redirect URI: `https://mediashelf-frontend.vercel.app/api/auth/google/callback`.
5. GitHub Actions secrets (same values as the backend Vercel env): `DATABASE_URL` (pooler) and `DIRECT_URL` (direct host, port `5432`). Pushes to `main` apply Prisma migrations after CI passes.

## Local development (apps outside Docker)

1. Start only Postgres:

   ```bash
   docker compose up postgres -d
   ```

2. Install dependencies and prepare the database:

   ```bash
   cp .env.example .env
   # Keep DATABASE_URL and DIRECT_URL pointed at local Postgres for this flow
   # (Docker Compose sets both itself; Vercel/Supabase uses pooler + direct).
   pnpm install
   pnpm --filter @mediashelf/shared-types build
   pnpm --filter @mediashelf/backend exec prisma migrate deploy
   ```

3. Run apps:

   ```bash
   pnpm dev
   ```

## Using the app

| Route                     | Purpose                                                                 |
| ------------------------- | ----------------------------------------------------------------------- |
| `/search`                 | TMDB search and import into the library                                 |
| `/search/movie/[tmdbId]`  | TMDB movie preview (cast, crew) before adding                           |
| `/search/series/[tmdbId]` | TMDB series preview (cast, creators) before adding                      |
| `/library`                | Full library with filters, sort, search, pagination, panels/list toggle |
| `/library/[id]`           | Title detail, status, lists, notes, TMDB credits                        |
| `/lists`                  | Custom lists CRUD                                                       |
| `/lists/[id]`             | List detail, pagination, bulk add, per-list series progress             |
| `/backup`                 | Export library JSON / merge-import a backup                             |

`GET /tmdb/search` finds titles. `GET /tmdb/:type/:tmdbId` returns details and credits for the preview page. `GET /media` accepts filter, sort, and pagination query params (`page`, `pageSize`, including `search`). `PATCH /media/:id` updates library status and downloaded. `PATCH /lists/:id/items/:mediaItemId` updates per-list status, downloaded, and series progress. `GET /backup` / `POST /backup/import` handle JSON backup.

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
4. **Migrate** (`main` only) — `prisma migrate deploy` against Supabase after CI succeeds

## Documentation

- [Project overview](docs/PROJECT_OVERVIEW.md) — goals, features, roadmap
- [Development guidelines](docs/DEVELOPMENT_GUIDELINES.md) — engineering standards
