/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  transpilePackages: ['@mocktrade/shared'],
  output: 'standalone',
};

module.exports = nextConfig;
