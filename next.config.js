/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: { unoptimized: true },
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Exclude puppeteer-core and chromium from webpack bundling
      config.externals = [...(config.externals || []), 'puppeteer-core', '@sparticuz/chromium'];
    }
    return config;
  },
};

module.exports = nextConfig;
