import { loadEnvConfig } from '@next/env';
import type { NextConfig } from 'next';
import path from 'path';

const monorepoRoot = path.join(__dirname, '../..');
// Repo-root `.env` is the source of truth (Docker Compose and local `pnpm dev`).
loadEnvConfig(monorepoRoot);

const nextConfig: NextConfig = {
  output: 'standalone',
  // Required for correct file tracing in a pnpm monorepo
  outputFileTracingRoot: monorepoRoot,
};

export default nextConfig;
