#!/bin/sh
set -e

echo "Running Prisma migrations..."
pnpm exec prisma migrate deploy

echo "Starting NestJS..."
exec node dist/main.js
