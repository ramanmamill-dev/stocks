/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [],
  },
  turbopack: {},
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      'yahoo-finance2/dist/esm/src/lib/fetchDevel.js': false,
      'yahoo-finance2/dist/esm/src/lib/fetchDevel': false,
    };
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      crypto: false,
      path: false,
    };
    return config;
  },
};

module.exports = nextConfig;
