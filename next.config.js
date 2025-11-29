/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: { unoptimized: true },
  // Increase body size limit for file uploads
  // Default is 4.5MB, we need to support up to 100MB (10 files x 10MB each)
  api: {
    bodyParser: {
      sizeLimit: '100mb',
    },
  },
  experimental: {
    // For App Router, we need to set this in the route handler
    // But we'll also set it here for backwards compatibility
    serverActions: {
      bodySizeLimit: '100mb',
    },
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Exclude puppeteer-core, chromium, and canvas from webpack bundling
      config.externals = [...(config.externals || []), 'puppeteer-core', '@sparticuz/chromium', 'canvas'];
    }
    return config;
  },
};

module.exports = nextConfig;
