#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

echo "==> Prepare shared types"
pnpm --filter @mediashelf/shared-types build

echo "==> Generate Prisma client"
pnpm --filter @mediashelf/backend exec prisma generate

echo "==> ESLint"
pnpm lint

echo "==> TypeScript (tsc --noEmit)"
pnpm typecheck

echo "==> Unit tests"
pnpm test

echo "==> Prettier"
pnpm format

echo "==> All checks passed"
