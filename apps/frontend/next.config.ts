import type { NextConfig } from 'next';
import path from 'path';

const nextConfig: NextConfig = {
  output: 'standalone',
  // Required for correct file tracing in a pnpm monorepo
  outputFileTracingRoot: path.join(__dirname, '../../'),
};

export default nextConfig;
