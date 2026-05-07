import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Emit a self-contained server bundle into `.next/standalone` so the
  // production Docker image can run with just node + the standalone folder.
  output: 'standalone',
};

export default nextConfig;
