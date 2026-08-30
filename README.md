# MediaShelf

A production-style personal media library for movies and TV series. Sign in with Google or Microsoft, search TMDB, keep custom lists with per-list watch progress, and export JSON backups. Frontend and API run on Vercel; the database is Neon PostgreSQL.

This is a portfolio project: a real app I use, built to show modern full-stack engineering rather than a thin CRUD demo.

|             |                                                                              |
| ----------- | ---------------------------------------------------------------------------- |
| **App**     | [mediashelf-frontend.vercel.app](https://mediashelf-frontend.vercel.app)     |
| **API**     | [mediashelf-api.vercel.app](https://mediashelf-api.vercel.app)               |
| **Health**  | [mediashelf-api.vercel.app/health](https://mediashelf-api.vercel.app/health) |
| **Swagger** | [mediashelf-api.vercel.app/docs](https://mediashelf-api.vercel.app/docs)     |

Local setup, OAuth, Vercel/Neon, and backups: **[docs/SETUP.md](docs/SETUP.md)**.

---

## Features

- **Google and Microsoft OAuth** — JWT in an httpOnly cookie; same email is the same private library
- **TMDB search and import** — posters, genres, metadata; preview cast / directors / creators before adding
- **Manual entries** when a title is missing from TMDB
- **Library CRUD** with status (Watchlist / Watching / Watched / Upcoming) and a separate downloaded flag
- **Filters and sort** — status, type, genre, downloaded, list; sort by title (default), date added, release date, or date watched; title search
- **Custom lists** with optional default status / downloaded, bulk add from the library, and move between lists
- **Series progress per list** — season / episode, status, and downloaded live on membership, not only on the title
- **Release awareness** — complete dates and “out now” / “not out yet” badges; refresh last-episode air dates from TMDB
- **Panels / list view toggle** on library and list pages (persisted in `localStorage`)
- **Server-side pagination** (default 2 panel rows or 10 list rows; 25 / 50 / 100 / all)
- **JSON export / merge import** for library + lists
- **Daily JSON backup** to a GitHub Actions artifact (90 days) and Dropbox
- **Dark / light mode**, **English / Spanish UI**, **responsive shell** with mobile nav
- **PWA** (manifest, icons, service worker) — installable on a phone over HTTPS
- **In-app feedback** — report a bug or suggest an improvement; optional admin inbox
- **First-run tutorial** — dismissible tips per view, restorable from the header
- **Swagger / OpenAPI** at `/docs`

---

## Architecture

```text
                  +----------------------+
                  |      Next.js         |
                  |   App Router + PWA   |
                  |  same-origin /api    |
                  +----------+-----------+
                             |  BFF proxy
                             v
                  +----------------------+
                  |       NestJS         |
                  |  modules + Prisma    |
                  +----------+-----------+
                             |
                  +----------v-----------+
                  | PostgreSQL (Neon)    |
                  +----------+-----------+
                             |
                  +----------v-----------+
                  |      TMDB API        |
                  +----------------------+
```

The browser talks only to the Next.js origin. A catch-all App Router route (`/api/[...path]`) forwards to Nest at request time. That **BFF proxy** keeps the auth cookie first-party, which is required because Safari blocks third-party cookies across `*.vercel.app` hosts.

Production: Next.js and NestJS as separate Vercel projects; Prisma uses Neon’s pooled `DATABASE_URL` at runtime and a direct `DIRECT_URL` for migrations.

---

## Domain model

Media is a **unified `MediaItem`** (`MOVIE` | `SERIES`), not separate movie/series tables. The REST resource is `/media`.

Library status and downloaded live on the title. Custom-list **membership** (`CustomListItem`) has its own status, downloaded flag, and series progress. The same series can be Watchlist in one list and Watching S3 in another.

Lists can set default membership state. Adding or moving a title into a configured list applies that list’s defaults to **that membership** without rewriting the library title or other lists.

JSON backup stores resolved TMDB IDs and imports with **merge** semantics: existing titles and memberships are left unchanged; missing lists and memberships are created.

---

## Design patterns and engineering practices

| Practice                       | How MediaShelf uses it                                                                                                                   |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------- |
| **Modular monolith**           | Nest feature modules (`auth`, `media`, `lists`, `tmdb`, `backup`, `feedback`) each own controllers, services, DTOs, and tests            |
| **Layered architecture**       | Controllers validate and delegate; services hold business logic; repositories talk to Prisma                                             |
| **Dependency injection**       | Nest providers for services, Prisma, Passport strategies, and guards                                                                     |
| **DTO + validation**           | Global `ValidationPipe` (`whitelist`, `forbidNonWhitelisted`, `transform`) on request bodies and query DTOs                              |
| **Mapper**                     | Prisma records mapped to shared API types (`media.mapper`, `tmdb.mapper`, `lists.mapper`) so the HTTP contract is not the database shape |
| **Repository**                 | Data access isolated from services (`media.repository`, `lists.repository`)                                                              |
| **Guard / strategy**           | Passport Google, Microsoft, and JWT strategies; `JwtAuthGuard` on protected routes; optional JWT for public feedback                     |
| **Custom decorators**          | `@CurrentUser()` / optional current user for controllers                                                                                 |
| **BFF / same-origin proxy**    | Next.js forwards `/api/*` so cookies stay first-party on Safari                                                                          |
| **Shared kernel**              | `packages/shared-types` enums and interfaces used by frontend and backend                                                                |
| **Discriminated domain types** | `MediaType` / `MediaStatus` shared across Prisma, API, and UI                                                                            |
| **Idempotent merge import**    | Backup import matches TMDB titles on `(tmdbId, type)` and manuals on `(title, type)`                                                     |
| **Typed i18n**                 | English catalog is the source of truth; Spanish must match the key tree or TypeScript fails                                              |
| **Auth linking by email**      | Google and Microsoft upsert one `User`; provider IDs are optional and unique                                                             |

Frontend code is organized by domain (routes, hooks, UI components, API client) rather than a single dump of screens. Auth and guest guards wrap protected and login-only pages.

---

## Stack

| Layer      | Choice                                                                                     |
| ---------- | ------------------------------------------------------------------------------------------ |
| Frontend   | Next.js (App Router), TypeScript, Tailwind CSS                                             |
| Backend    | NestJS, TypeScript, Prisma                                                                 |
| Database   | PostgreSQL (Neon in production; Docker Postgres locally)                                   |
| Auth       | Google / Microsoft OAuth + JWT httpOnly cookie (`SameSite=Lax`)                            |
| Monorepo   | pnpm workspaces (`apps/*`, `packages/*`)                                                   |
| Containers | Docker + Docker Compose (local)                                                            |
| Production | Vercel (frontend + API) + Neon                                                             |
| CI/CD      | GitHub Actions — lint, typecheck, Prettier, Jest, build, `prisma migrate deploy` on `main` |

---

## Repository layout

```text
apps/frontend           Next.js (PWA, UI, BFF proxy)
apps/backend            NestJS + Prisma + Swagger
packages/shared-types   Shared enums and interfaces
packages/eslint-config  Shared ESLint flat configs
.github/workflows       CI and daily library backup
docs/                   Setup, project overview, engineering guidelines
```

---

## API surface

Primary resources: `/media`, `/lists`, `/tmdb`, `/backup`, `/feedback`, `/auth`.

Examples:

- `GET /media?status=WATCHING&type=SERIES&sortBy=TITLE&page=1&pageSize=25`
- `GET /media?released=true`
- `POST /media` (TMDB import) / `POST /media/manual`
- `PATCH /lists/:id/items/:mediaItemId` (per-list status, downloaded, series progress)
- `GET /backup` / `POST /backup/import`

`GET /media` and `GET /lists/:id` return a page (`items`, `page`, `pageSize`, `total`, `totalPages`). Use `pageSize=all` for every matching item.

Full request/response schemas and try-it-out: [Swagger](https://mediashelf-api.vercel.app/docs).

---

## Quality bar

- **TypeScript strict** across the monorepo; no `any` in public APIs
- **Jest unit tests** for services, mappers, auth cookies, pagination, list-state, and backup helpers
- **ESLint + Prettier** on CI; `pnpm check` runs lint, typecheck, tests, and format
- **Prisma migrations** applied from GitHub Actions after a successful `main` build, not ad hoc on the server
- **Docker Compose** for a one-command local stack (frontend, backend, Postgres)

---

## Documentation

- [Setup](docs/SETUP.md) — local Docker, OAuth, Vercel/Neon, Dropbox backup, commands
- [Project overview](docs/PROJECT_OVERVIEW.md) — goals, features, roadmap
- [Development guidelines](docs/DEVELOPMENT_GUIDELINES.md) — engineering standards
