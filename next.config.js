/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: { unoptimized: true },
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Mark native modules and Puppeteer as external to prevent webpack from bundling them
      config.externals.push('canvas', 'puppeteer-core', '@sparticuz/chromium');
    }
    return config;
  },
};

module.exports = nextConfig;
