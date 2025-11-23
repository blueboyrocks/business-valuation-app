/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: { unoptimized: true },
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Mark canvas as external to prevent webpack from bundling it
      config.externals.push('canvas');
    }
    return config;
  },
};

module.exports = nextConfig;
