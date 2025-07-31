/** @type {import('next').NextConfig} */
const nextConfig = {
  // App directory is now stable in Next.js 13.4+, no experimental flag needed
  output: "standalone",
  generateBuildId: async () => {
    return process.env.RAILWAY_GIT_COMMIT_SHA || "development";
  },
  // Disable static generation for all pages by default
  trailingSlash: false,
  poweredByHeader: false,
  compress: true,
  experimental: {
    // Disable prerendering for all pages to avoid SSR issues with Clerk
    appDir: true,
    serverComponentsExternalPackages: ["@clerk/nextjs"],
  },
  // Force dynamic rendering for all routes
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Cache-Control",
            value: "no-store, max-age=0",
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
