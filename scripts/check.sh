#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

echo "==> ESLint"
pnpm lint

echo "==> TypeScript (tsc --noEmit)"
pnpm typecheck

echo "==> Prettier"
pnpm format:check

echo "==> All checks passed"
