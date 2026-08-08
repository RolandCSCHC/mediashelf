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

I currently keep track of movies and TV series inside a `.txt` file.

MediaShelf will replace that with an online platform that I can access from anywhere after deploying it to Render.

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

The data is highly relational, PostgreSQL is widely used in production, Render provides managed PostgreSQL, and Prisma offers an excellent developer experience with type safety, migrations and a modern ORM.

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

Platform:

- Render

Services:

- Frontend
- Backend
- Managed PostgreSQL

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

- TMDB ID
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

Series progress is stored on each list membership, so one series can track different seasons/episodes across lists.

---

## Import

Temporary feature.

Import my existing `.txt` file containing approximately 170+ movies and TV series.

This functionality can be removed once my library has been migrated.

---

## Export

Export the personal media library to JSON.

---

## Responsive Design

This is **not** a mobile application.

The website should work correctly on desktop, tablet and mobile browsers.

Requirements:

- Mobile-friendly layouts
- Touch-friendly controls
- No horizontal scrolling
- Responsive navigation

Future enhancement:

- Convert the application into a Progressive Web App (PWA).

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
                  |    PostgreSQL        |
                  +----------+-----------+
                             |
                  +----------v-----------+
                  |      TMDB API        |
                  +----------------------+
```

---

# Development Roadmap

## Phase 1

- Repository setup
- Monorepo structure
- Docker
- Docker Compose
- Next.js
- NestJS
- PostgreSQL
- Prisma

---

## Phase 2

- Google Authentication
- User accounts
- Protected routes

---

## Phase 3

- Dark Mode (light/dark toggle)
- Responsive UI shell
- Auth and library page polishing

---

## Phase 4

- TMDB integration
- Search movies
- Search TV series
- Import selected media

---

## Phase 5

- CRUD
- Watchlist
- Watching
- Watched
- Future
- Downloaded flag

---

## Phase 6

- Series progress
- Filters
- Sorting
- Custom lists

---

## Phase 7

- Import existing `.txt` and hiding it
- Export library to JSON

---

## Phase 8

- Feature UI polish (media cards, filters chrome)
- PWA (optional)

---

## Phase 9

- Swagger documentation
- Unit tests
- Integration tests

---

## Phase 10

- Production deployment on Render

---

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
- Deployment to Render
- Monorepo architecture

The final result should resemble a real production application rather than a simple CRUD project, showcasing both software engineering practices and a polished user experience suitable for a professional portfolio.