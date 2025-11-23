/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: { unoptimized: true },
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Exclude puppeteer-core, chromium, and canvas from webpack bundling
      config.externals = [...(config.externals || []), 'puppeteer-core', '@sparticuz/chromium', 'canvas'];
    }
    return config;
  },
};

module.exports = nextConfig;
