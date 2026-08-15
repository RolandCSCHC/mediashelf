# Development Guidelines

## Purpose

This document defines the engineering standards, conventions and best
practices for the MediaShelf project.

The goal is to build a production-quality application with a clean,
maintainable and scalable codebase.

When making architectural or implementation decisions, always prioritize
readability, maintainability and simplicity over cleverness.

------------------------------------------------------------------------

# General Principles

-   Follow SOLID principles where appropriate.
-   Prefer composition over inheritance.
-   Avoid premature optimization.
-   Avoid unnecessary abstractions.
-   Keep the codebase consistent.
-   Every class, function and module should have a single
    responsibility.
-   Prefer explicit code over implicit behavior.
-   If multiple solutions exist, choose the simplest one that scales.

------------------------------------------------------------------------

# Architecture

The project follows a modular architecture.

Each module should encapsulate:

-   Controllers
-   Services
-   DTOs
-   Domain models
-   Database access
-   Tests

Avoid creating "God" services or utility classes that contain unrelated
responsibilities.

------------------------------------------------------------------------

# Backend Guidelines (NestJS)

## Controllers

Controllers should:

-   Receive requests
-   Validate input
-   Call services
-   Return responses

Controllers should **not**:

-   Contain business logic
-   Query the database directly
-   Perform calculations
-   Call external APIs directly

## Services

Services contain business logic.

Services may:

-   Call repositories
-   Call external APIs
-   Coordinate multiple operations

Services should remain focused on a single domain.

## DTOs

Always validate request bodies using DTOs.

Prefer explicit validation over manual checks.

## Database

Use Prisma as the only way to access PostgreSQL.

Never write raw SQL unless absolutely necessary.

Keep migrations small and descriptive.

------------------------------------------------------------------------

# Frontend Guidelines (Next.js)

Organize features by domain instead of by file type whenever practical.

Keep components small.

Separate:

-   UI components
-   Business logic
-   API calls
-   Hooks

Avoid large components responsible for multiple concerns.

------------------------------------------------------------------------

# TypeScript

Enable strict mode.

Avoid using:

-   any

Prefer:

-   unknown
-   proper interfaces
-   discriminated unions
-   enums only when appropriate

Always define types explicitly for public APIs.

------------------------------------------------------------------------

# API Design

Use REST.

Resources should use predictable URLs.

Examples:

GET /media

GET /media?status=WATCHING&type=SERIES&sortBy=TITLE&page=1&pageSize=25

POST /media

GET /media/:id

PATCH /media/:id

DELETE /media/:id

GET /tmdb/search?q=dune&type=ALL

GET /tmdb/:type/:tmdbId

GET /lists

POST /lists

GET /lists/:id

GET /lists/:id?search=dune&sortBy=TITLE&page=1&pageSize=25

PATCH /lists/:id

DELETE /lists/:id

POST /lists/:id/items

PATCH /lists/:id/items/:mediaItemId

POST /lists/:id/items/:mediaItemId/move

DELETE /lists/:id/items/:mediaItemId

GET /lists/for-media/:mediaItemId

GET /backup

POST /backup/import

Return consistent HTTP status codes.

Return meaningful error messages.

------------------------------------------------------------------------

# Naming Conventions

Controllers

-   MediaController
-   AuthController
-   TmdbController

Services

-   MediaService
-   TmdbService
-   AuthService

DTOs

-   CreateMediaItemDto
-   UpdateMediaItemDto

Repositories

-   MediaRepository

Enums

-   MediaStatus

Interfaces

-   MediaItem
-   User
-   TmdbMovie
-   HealthResponse

------------------------------------------------------------------------

# File Organization

Prefer feature-based organization.

Example:

apps/backend/src/modules/media/

-   media.controller.ts
-   media.service.ts
-   media.repository.ts
-   media.module.ts
-   dto/
-   entities/
-   tests/

------------------------------------------------------------------------

# Error Handling

-   Never silently ignore errors.
-   Always return meaningful exceptions.
-   Log unexpected errors.
-   Avoid exposing internal implementation details to clients.

------------------------------------------------------------------------

# Security

-   Validate all input.
-   Never trust client data.
-   Use environment variables for secrets.
-   Never commit secrets.
-   Protect authenticated endpoints.
-   Use secure cookies or JWT best practices.

------------------------------------------------------------------------

# Testing

Every new feature should include appropriate tests.

Prefer:

-   Unit tests for business logic.
-   Integration tests for endpoints.

Test behavior, not implementation details.

------------------------------------------------------------------------

# Code Quality

-   Prefer small functions.
-   Prefer early returns.
-   Avoid deeply nested conditionals.
-   Avoid duplicate code.
-   Extract reusable logic only after duplication appears.

------------------------------------------------------------------------

# Comments

Code should be self-explanatory.

Write comments only when explaining:

-   Why something exists.
-   Non-obvious business rules.
-   Important architectural decisions.

Do not comment obvious code.

------------------------------------------------------------------------

# Dependencies

Before introducing a new dependency, ask:

-   Does the platform already solve this?
-   Is there a simpler alternative?
-   Is the dependency actively maintained?
-   Is it widely adopted?

Avoid adding dependencies for small utilities.

------------------------------------------------------------------------

# Git

Write meaningful commit messages.

Examples:

-   feat(auth): add Google OAuth
-   feat(tmdb): implement movie search
-   fix(api): validate movie status
-   refactor(media): simplify repository layer

------------------------------------------------------------------------

# Documentation

Keep documentation updated when architecture changes.

Update PROJECT_OVERVIEW.md when requirements evolve.

Update DEVELOPMENT_GUIDELINES.md when coding standards change.

------------------------------------------------------------------------

# Decision Making

When multiple solutions exist:

1.  Explain the available options.
2.  Explain the trade-offs.
3.  Recommend the best approach.
4.  Wait for approval if the decision is significant.

Do not make major architectural decisions silently.

------------------------------------------------------------------------

# Long-Term Goal

The objective is not simply to finish the application.

The objective is to build a codebase that another experienced software
engineer could confidently maintain and extend.
