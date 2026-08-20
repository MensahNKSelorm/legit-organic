import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Production deploys build into a staging directory, then swap it into place.
  // This prevents the running server from serving HTML and CSS from different builds.
  distDir: process.env.NEXT_DIST_DIR || '.next',
  images: {
    qualities: [75, 80],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'api.legitorganic.com',
        pathname: '/media/**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '8000',
        pathname: '/media/**',
      },
      {
        protocol: 'http',
        hostname: '127.0.0.1',
        port: '8000',
        pathname: '/media/**',
      },
    ],
  },
};

export default nextConfig;
