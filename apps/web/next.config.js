/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@mocktrade/shared'],
  output: 'standalone',
};

module.exports = nextConfig;
