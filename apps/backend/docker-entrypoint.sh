#!/bin/sh
set -e

echo "Running Prisma migrations..."
pnpm exec prisma migrate deploy

echo "Seeding database (idempotent)..."
node prisma/seed.js || true

echo "Starting NestJS..."
exec node dist/main.js
