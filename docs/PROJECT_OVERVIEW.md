# MediaShelf - Portfolio Project Overview

## Goal

Build a production-quality full-stack web application called **MediaShelf** that serves as a portfolio project for potential employers.

The objective is **not only to create a CRUD application**, but to demonstrate knowledge of modern software engineering practices, including:

- Modern frontend development
- Modern backend architecture
- Authentication
- REST API design
- Database design
- External API integration
- Docker
- CI/CD
- Testing
- Deployment
- Documentation

The application should be something I personally use every day while also showcasing real-world engineering skills.

---

# Purpose of the Application

MediaShelf is an online personal media library I can access from anywhere after deploying it to Vercel (apps) and Supabase (database).

Each authenticated user has their own private media library.

---

# Recommended Tech Stack

## Frontend

- Next.js
- TypeScript
- Tailwind CSS
- Responsive Design
- Dark Mode

### Reason

Although I already know React, Next.js is the industry standard React framework and introduces routing, server-side rendering, server components and a more modern React architecture.

---

## Backend

- NestJS
- TypeScript

### Reason

I already know Django and Flask. NestJS exposes me to the Node.js ecosystem while maintaining a structured architecture through controllers, services, dependency injection, DTOs, validation and modules.

---

## Database

- PostgreSQL

ORM:

- Prisma

### Reason

The data is highly relational, PostgreSQL is widely used in production, Supabase provides managed PostgreSQL (with connection pooling for serverless), and Prisma offers an excellent developer experience with type safety, migrations and a modern ORM.

---

## Authentication

Google OAuth only.

No traditional username/password authentication.

Store:

- Google ID
- Email
- Name
- Profile Picture

---

## External API

TMDB (The Movie Database)

Use TMDB to:

- Search movies
- Search TV series
- Retrieve posters
- Retrieve descriptions
- Retrieve release dates
- Retrieve genres
- Retrieve seasons
- Retrieve episodes
- Retrieve backdrops

Only store the TMDB ID together with the metadata required by the application.

---

## Deployment

Platforms:

- **Vercel** — frontend (Next.js) and backend (NestJS) as separate projects
- **Supabase** — managed PostgreSQL

Services:

- Frontend (`mediashelf-frontend`)
- Backend / API (`mediashelf-api`)
- Managed PostgreSQL on Supabase (`DATABASE_URL` pooler + `DIRECT_URL` for Prisma migrations)

---

# Containerization

Use Docker **from the beginning**.

Each application will have its own Dockerfile.

Local development should be as simple as:

```bash
docker compose up --build
```

This should start:

- Frontend
- Backend
- PostgreSQL

---

# Repository Structure

The project will be developed as a **monorepo**.

```text
mediashelf/
│
├── apps/
│   ├── frontend/
│   │   ├── Dockerfile
│   │   └── ...
│   │
│   └── backend/
│       ├── Dockerfile
│       └── ...
│
├── packages/
│   └── shared-types/
│
├── docker-compose.yml
├── .env
├── .env.example
├── README.md
├── .github/
└── docs/
```

The `packages` directory is intended for code shared between the frontend and backend, such as:

- Shared TypeScript interfaces
- Enums
- Validation schemas
- Utility functions
- ESLint configuration
- TypeScript configuration

---

# Main Features

## Authentication

- Google Login
- Logout
- Private user accounts

---

## Media Library

CRUD for movies and TV series through a **unified `MediaItem` model** (not separate movie/series tables).

Each item has a `type` of `MOVIE` or `SERIES`. The REST resource is `/media`.

Each media item should contain information such as:

- TMDB ID (nullable for manually added titles)
- Title
- Description
- Poster
- Backdrop
- Release date
- Genres
- Runtime
- Media type (Movie / Series)

Series progress fields (`currentSeason`, `currentEpisode`) live on **list membership** (`CustomListItem`), not on the media item itself. The same series can have different progress in different lists (for example S1–2 in “Series watched” and S3 in “Series to watch”). Progress is only used when the media `type` is `SERIES`.

---

## Status

Each media item has a status instead of existing in separate tables.

Possible statuses:

- Watchlist
- Watching
- Watched
- Future

Downloaded should be a separate boolean flag.

Example:

```json
{
  "status": "WATCHLIST",
  "downloaded": true
}
```

This allows a movie or series to be both downloaded and still waiting to be watched.

---

## Series Progress

Track per custom list membership:

- Current season
- Current episode

The same title can appear in multiple lists with different progress in each.

Possible future additions:

- Completed series
- Rewatch count

---

## Search

The primary workflow should be searching TMDB instead of manually entering information.

Example:

```text
The Lord of the Rings
```

The backend queries TMDB.

Results appear with posters.

The user selects one.

MediaShelf automatically imports all relevant information.

When a title cannot be found on TMDB, the user can add it manually (title and type required; year, description, notes, and status optional). Manual items have no TMDB ID or poster.

---

## Filters

Allow filtering by:

- Status
- Genre
- Movie / Series
- Downloaded

---

## Sorting

Allow sorting by:

- Title
- Date added
- Release date
- Date watched

---

## Custom Lists

Examples:

- Favorites
- Horror
- Marvel
- Christmas
- 2026 Watchlist

Users should be able to create unlimited custom lists.

Series progress is stored on each list membership, so one series can track different seasons/episodes across lists. Moving a title from one list to another copies that progress onto the destination membership.

---

## Export / JSON backup

Export the personal media library (and custom lists) to JSON.

Import the same JSON with **merge** semantics:

- TMDB titles match on `(tmdbId, type)` and are skipped if already present
- Manual titles match on `(title, type)` and are skipped if already present
- Missing lists are created by name; existing lists are reused
- Missing list memberships are added; existing memberships (and series progress) are left unchanged

The backup stores resolved TMDB IDs, so ambiguous titles do not need to be re-matched on import.

---

## Responsive Design

This is **not** a native mobile application.

The website should work correctly on desktop, tablet and mobile browsers.

Requirements:

- Mobile-friendly layouts
- Touch-friendly controls
- No horizontal scrolling
- Responsive navigation (including a mobile menu)

## Progressive Web App (PWA)

MediaShelf is installable as a Progressive Web App so it can be added to a
phone home screen after deployment (HTTPS).

Included:

- Web app manifest
- App icons
- Minimal service worker (installability + light shell caching)

This is still a responsive web app, not a store-distributed mobile app.

---

## Dark Mode

Support:

- Light Mode
- Dark Mode

---

# REST API

The frontend communicates with the backend through a REST API.

Primary library resource:

- `GET /media`
- `POST /media`
- `GET /media/:id`
- `PATCH /media/:id`
- `DELETE /media/:id`

Document every endpoint using Swagger (OpenAPI).

Swagger should allow developers to:

- Explore endpoints
- View request schemas
- View response schemas
- Execute requests directly from the browser

A developer should be able to understand and test the API without requiring Postman.

---

# Testing

## Unit Tests

Examples:

- Services
- Utility functions
- Business logic

## Integration Tests

Examples:

- Authentication
- CRUD operations
- TMDB integration
- API endpoints

---

# CI/CD

Use GitHub Actions.

Run automatically on every Pull Request:

- Install dependencies
- Lint
- Run tests
- Build frontend
- Build backend

Possible future additions:

- Docker image builds
- Automatic deployment

---

# Database

- PostgreSQL
- Prisma ORM
- Prisma migrations

---

# Architecture

```text
                  +----------------------+
                  |      Next.js         |
                  |      Frontend        |
                  +----------+-----------+
                             |
                         REST API
                             |
                  +----------v-----------+
                  |       NestJS         |
                  |       Backend        |
                  +----------+-----------+
                             |
                          Prisma ORM
                             |
                  +----------v-----------+
                  | PostgreSQL (Supabase)|
                  +----------+-----------+
                             |
                  +----------v-----------+
                  |      TMDB API        |
                  +----------------------+
```

Production hosting: Next.js and NestJS on Vercel; database on Supabase.

---

# Development Roadmap

## Phase 1

- Repository setup ✓
- Monorepo structure ✓
- Docker ✓
- Docker Compose ✓
- Next.js ✓
- NestJS ✓
- PostgreSQL ✓
- Prisma ✓

---

## Phase 2

- Google Authentication ✓
- User accounts ✓
- Protected routes ✓

---

## Phase 3

- Dark Mode (light/dark toggle) ✓
- Responsive UI shell ✓
- Auth and library page polishing ✓

---

## Phase 4

- TMDB integration ✓
- Search movies ✓
- Search TV series ✓
- Import selected media ✓

---

## Phase 5

- CRUD ✓
- Watchlist ✓
- Watching ✓
- Watched ✓
- Future ✓
- Downloaded flag ✓

---

## Phase 6

- Series progress ✓
- Filters ✓
- Sorting ✓
- Custom lists ✓

---

## Phase 7

- Search in Library and Lists ✓
- Manual entry if you can't find a movie/series ✓
- Export / import library JSON (merge) ✓

---

## Phase 8

- Mobile navigation (burger menu) 
- PWA (manifest, icons, service worker) — installable on phone after deploy ✓

---

## Phase 9

- Swagger documentation ✓
- Unit tests ✓

---

## Phase 10

- Production deployment on Vercel (frontend + backend) ✓
- Managed PostgreSQL on Supabase ✓

---

## Phase 11

- Panel/List toggle in Library and Lists ✓
- Fix so Google Auth works in Safari in cellphone ✓
- Fix so the Google button enables when the app is ready to work after sleep ✓

---

## Phase 12

- Redirect to Library when user is logged in ✓
- Move Movies/Series between lists ✓
- Pagination
- Lists sets states
- Fix Go Back in lists
- English/Spanish toggle
- Delete Open button in lists
- Make the lists cells clickable

# Portfolio Goals

This project should demonstrate proficiency in:

- TypeScript
- Next.js
- NestJS
- PostgreSQL
- Prisma
- Docker
- Google OAuth
- REST API development
- Swagger / OpenAPI
- TMDB integration
- Testing
- CI/CD
- GitHub best practices
- Database design
- Modern full-stack architecture
- Deployment to Vercel
- Managed PostgreSQL on Supabase
- Monorepo architecture

The final result should resemble a real production application rather than a simple CRUD project, showcasing both software engineering practices and a polished user experience suitable for a professional portfolio.
