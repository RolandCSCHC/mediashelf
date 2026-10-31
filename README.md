# MediaShelf

A production-style personal media library for movies and TV series. Sign in with Google or Microsoft, search TMDB, keep custom lists with per-list watch progress, and export JSON backups. I run it at [mediashelf.rolandschlosser.dev](https://mediashelf.rolandschlosser.dev): Next.js and the API on Vercel, PostgreSQL on Neon.

This is a portfolio project: a real app I use, built to show how I structure a full-stack product.

## Stack

| Layer      | Choice                                                                                     |
| ---------- | ------------------------------------------------------------------------------------------ |
| Frontend   | Next.js (App Router), TypeScript, Tailwind CSS                                             |
| Backend    | NestJS, TypeScript, Prisma, Passport                                                       |
| Database   | PostgreSQL (Neon in production; Docker Postgres locally)                                   |
| Auth       | Google / Microsoft OAuth (authorization code) + JWT httpOnly cookie (`SameSite=Lax`)       |
| Email      | Resend — share one list as a JSON attachment                                               |
| Monorepo   | pnpm workspaces (`apps/*`, `packages/*`)                                                   |
| Containers | Docker + Docker Compose (local)                                                            |
| Production | Vercel (frontend + API) + Neon                                                             |
| CI/CD      | GitHub Actions — lint, typecheck, Prettier, Jest, build, `prisma migrate deploy` on `main` |

---

<table>
  <tr>
    <td><strong>App</strong></td>
    <td><a href="https://mediashelf.rolandschlosser.dev">mediashelf.rolandschlosser.dev</a></td>
  </tr>
  <tr>
    <td><strong>API</strong></td>
    <td><a href="https://mediashelf-api.vercel.app">mediashelf-api.vercel.app</a></td>
  </tr>
  <tr>
    <td><strong>Health</strong></td>
    <td><a href="https://mediashelf-api.vercel.app/health">mediashelf-api.vercel.app/health</a></td>
  </tr>
  <tr>
    <td><strong>Swagger</strong></td>
    <td><a href="https://mediashelf-api.vercel.app/docs">mediashelf-api.vercel.app/docs</a></td>
  </tr>
</table>

Local setup, OAuth, Vercel/Neon, and backups: **[docs/SETUP.md](docs/SETUP.md)**.

---

## Features

- **Google and Microsoft OAuth** — JWT in an httpOnly cookie; same email is the same private library
- **TMDB search and import** — posters, genres, metadata; preview cast / directors / creators before adding
- **Manual entries** when a title is missing from TMDB
- **Library CRUD** — catalog of titles; status (Watchlist / Watching / Watched / Upcoming) and downloaded live on each list membership
- **Filters and sort** — status (any list in the library), type, genre, downloaded, list; sort by title (default), date added, release date, or date watched; title search
- **Custom lists** with optional default status / downloaded, bulk add from the library, move between lists, sort by the date a title was added to that list, and share one list as JSON by email
- **Series progress per list** — season / episode, status, and downloaded live on membership
- **Release awareness** — complete dates and “out now” / “not out yet” badges; refresh last-episode air dates from TMDB
- **Panels / list view toggle** on library and list pages (persisted in `localStorage`)
- **Server-side pagination** (default 2 panel rows or 10 list rows; 25 / 50 / 100 / all)
- **JSON export / merge import** for the library and every list; a shared list email uses the same file
- **Daily JSON backup** to a GitHub Actions artifact (90 days) and Dropbox
- **Dark / light mode**, **English / Spanish UI**, **responsive shell** with mobile nav
- **PWA** (manifest, icons, service worker) — installable on a phone over HTTPS
- **In-app feedback** — report a bug or suggest an improvement; optional admin inbox
- **First-run tutorial** — dismissible tips per view, restorable from the header
- **Swagger / OpenAPI** at `/docs`

---

## Architecture

```text
                    +------------------------+
                    |        Next.js         |
                    |   App Router + PWA     |
                    |    client UI + /api    |
                    +-----------+------------+
                                | BFF proxy
                                v
                    +------------------------+
                    |         NestJS         |
                    |    modules + Prisma    |
                    +-----------+------------+
                                |
            +-------------------+-------------------+
            |                   |                   |
            v                   v                   v
   +----------------+  +----------------+  +----------------+
   | PostgreSQL     |  |    TMDB API    |  |     Resend     |
   | (Neon)         |  +----------------+  | (list email)   |
   +----------------+                      +----------------+
```

The browser talks only to `mediashelf.rolandschlosser.dev`. A catch-all App Router route (`/api/[...path]`) forwards to Nest at request time. That **BFF proxy** keeps the auth cookie first-party. Safari blocks third-party cookies across separate `*.vercel.app` hosts, so the UI calls the API through the frontend origin. The Vercel frontend hostname redirects to the custom domain. The API project stays on its own Vercel host.

Prisma uses Neon’s pooled `DATABASE_URL` at runtime and a direct `DIRECT_URL` for migrations. The pooler is what a serverless function needs; migrations need a direct connection.

---

## Why I built it this way

I wanted a library I would keep using, and a codebase that shows how I make structural choices.

I already knew React, so the frontend is Next.js App Router: file-based routes, metadata, a PWA manifest, and a server route that proxies the API. I already knew Django and Flask. NestJS is how I work in Node with that same shape — modules, dependency injection, controllers that validate and delegate, services that own the rules. The data is relational, so the database is PostgreSQL. Prisma gives me typed queries and migrations. Neon hosts it. The API on Vercel can go idle, so queries go through Neon’s pooled connection and migrations use a separate direct URL.

Sign-in is Google or Microsoft OAuth, authorization-code flow, with a client secret on the API. The account is the email address: both providers open the same library. The session is a JWT in an httpOnly cookie (`mediashelf_token`) for seven days, `SameSite=Lax`, and `Secure` when the site is HTTPS. `Secure` follows `FRONTEND_URL`, so a production Docker image on local HTTP still sets a cookie the browser will store. The OAuth callback is on the frontend origin (`/api/auth/.../callback`) and the BFF forwards it, which is what makes the cookie first-party. The login buttons stay disabled until `GET /health` succeeds, because a cold API would fail the redirect.

The product UI is a client application inside Next.js. Library screens are interactive, and every request needs the session cookie, so pages load data with a typed `fetch` client (`apps/frontend/src/lib/api.ts`) that always calls same-origin `/api` with `credentials: 'include'`. Auth, theme, and locale are React context. The root layout is a server component: it reads the locale cookie and sets `<html lang>` before paint, and a small inline script applies the theme so the first frame matches the saved mode. Client state stays in those providers and in the page that uses it. Shared UI is a button and a modal. The frontend and the API share `packages/shared-types`, so a response shape has to change in one place.

Movies and series are one `MediaItem`. Watch state sits on list membership, so one series can be Watched in one list and Watchlist in another. I copy the TMDB fields the UI shows (poster, genres, dates, runtime) onto the row at import. The library still opens when TMDB is down. Last-episode air dates refresh only when I ask. Genres are a text array on the item, which is enough to filter by them. Each repository method takes the signed-in `userId` and filters with it. Deleting a user cascades to their titles and lists.

JSON import merges. An existing title or membership stays as it is, so a restore keeps the progress already on the account. A shared list email reuses that file for one list and leaves out notes and date watched. Resend sends it in the language the UI is using, and replies go to the account that clicked Share. Those files can be large, so the API accepts a 10 MB JSON body.

I set the repo up as a pnpm monorepo and ran it in Docker Compose from the start, so the frontend, the API, and Postgres come up together. Features landed in phases: auth, TMDB import, the library, lists, then Vercel and Neon. The phase list is in [docs/PROJECT_OVERVIEW.md](docs/PROJECT_OVERVIEW.md). GitHub Actions lints, typechecks, tests, and builds both apps on every pull request. A push to `main` applies Prisma migrations. A daily workflow writes the same backup JSON to an Actions artifact (90 days) and to Dropbox.

---

## Domain model

Media is a **unified `MediaItem`** (`MOVIE` | `SERIES`), not separate movie/series tables. The REST resource is `/media`.

The library is a catalog of titles. Status, downloaded, and series progress live on custom-list **membership** (`CustomListItem`). The same series can be Watchlist in one list and Watching S3 in another. Filtering the library by Watching shows titles with that status on any list.

Lists can set default membership state. Adding or moving a title into a configured list applies that list’s defaults to **that membership** without rewriting other lists. Grouping lists with no defaults start new memberships as Watchlist and not downloaded.

JSON backup stores resolved TMDB IDs and imports with **merge** semantics: existing titles and memberships are left unchanged; missing lists and memberships are created. A single-list download uses that same file shape (without notes or date watched) so it can be imported to recreate the list.

---

## Design patterns and engineering practices

| Practice                       | How MediaShelf uses it                                                                                                                                                |
| ------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Modular monolith**           | Nest feature modules (`auth`, `media`, `lists`, `tmdb`, `backup`, `feedback`, `health`) own their HTTP surface. `mail` is the Resend provider the backup module calls |
| **Layered architecture**       | Controllers validate and delegate; services hold business logic; repositories talk to Prisma                                                                          |
| **Dependency injection**       | Nest providers for services, Prisma, Passport strategies, and guards                                                                                                  |
| **DTO + validation**           | Global `ValidationPipe` (`whitelist`, `forbidNonWhitelisted`, `transform`) on request bodies and query DTOs                                                           |
| **Mapper**                     | Prisma records mapped to shared API types (`media.mapper`, `tmdb.mapper`, `lists.mapper`) so the HTTP contract is not the database shape                              |
| **Repository**                 | Data access isolated from services (`media.repository`, `lists.repository`)                                                                                           |
| **Guard / strategy**           | Passport Google, Microsoft, and JWT strategies; `JwtAuthGuard` on protected routes; optional JWT for public feedback                                                  |
| **Custom decorators**          | `@CurrentUser()` / optional current user for controllers                                                                                                              |
| **BFF / same-origin proxy**    | Next.js forwards `/api/*` so cookies stay first-party on Safari                                                                                                       |
| **Shared kernel**              | `packages/shared-types` enums and interfaces used by frontend and backend                                                                                             |
| **Discriminated domain types** | `MediaType` / `MediaStatus` shared across Prisma, API, and UI                                                                                                         |
| **Idempotent merge import**    | Backup import matches TMDB titles on `(tmdbId, type)` and manuals on `(title, type)`                                                                                  |
| **Typed i18n**                 | English catalog is the source of truth; Spanish must match the key tree or TypeScript fails                                                                           |
| **Auth linking by email**      | Google and Microsoft upsert one `User`; provider IDs are optional and unique                                                                                          |
| **Context providers**          | `AuthProvider`, `ThemeProvider`, and `LocaleProvider` hold session, theme, and UI language                                                                            |
| **Route guards**               | `AuthGuard` wraps private pages; `GuestGuard` wraps login. Both read the session from context                                                                         |
| **Typed API client**           | `lib/api.ts` calls same-origin `/api` with the shared request and response types                                                                                      |
| **Ownership scoping**          | Repository queries filter by `userId`. A signed-in user only reads and writes their own rows                                                                          |

Frontend code is organized by domain: `app/` routes, `components/` (UI, guards, providers), `hooks/`, `lib/` (API client and domain helpers), and `i18n/` catalogs. The interactive pages are client components. The server layout owns fonts, metadata, the locale cookie, and the theme script.

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

- `GET /media?status=WATCHING&type=SERIES&sortBy=TITLE&page=1&pageSize=25` (status matches any list membership)
- `GET /media?released=true`
- `POST /media` (TMDB import) / `POST /media/manual`
- `PATCH /media/:id` (notes, date watched)
- `PATCH /lists/:id/items/:mediaItemId` (per-list status, downloaded, series progress)
- `GET /backup` / `GET /backup/lists/:id` / `POST /backup/import`

`GET /media` and `GET /lists/:id` return a page (`items`, `page`, `pageSize`, `total`, `totalPages`). Use `pageSize=all` for every matching item.

Full request/response schemas and try-it-out: [Swagger](https://mediashelf-api.vercel.app/docs).

---

## Quality bar

- **TypeScript strict** across the monorepo; public APIs use explicit types
- **Jest unit tests** for services, mappers, auth cookies, pagination, list-state, mail, and backup helpers
- **Input validation** — global `ValidationPipe` (`whitelist`, `forbidNonWhitelisted`, `transform`) strips unknown fields
- **Session cookie** — httpOnly `mediashelf_token`, `SameSite=Lax`, `Secure` on HTTPS, seven days
- **ESLint + Prettier** on CI; `pnpm check` runs lint, typecheck, tests, and format
- **Prisma migrations** applied from GitHub Actions after a successful `main` build
- **Docker Compose** for a one-command local stack (frontend, backend, Postgres)

---

## Documentation

- [Setup](docs/SETUP.md) — local Docker, OAuth, Vercel/Neon, Dropbox backup, commands
- [Project overview](docs/PROJECT_OVERVIEW.md) — goals, features, roadmap
- [Development guidelines](docs/DEVELOPMENT_GUIDELINES.md) — engineering standards
