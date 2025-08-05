/** @type {import('next').NextConfig} */
const nextConfig = {
  // App directory is now stable in Next.js 13.4+, no experimental flag needed
  generateBuildId: async () => {
    return process.env.RAILWAY_GIT_COMMIT_SHA || "development";
  },
  // Disable static generation for all pages by default
  trailingSlash: false,
  poweredByHeader: false,
  compress: true,
};

module.exports = nextConfig;
