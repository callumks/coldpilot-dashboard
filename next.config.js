/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  generateBuildId: async () => {
    return process.env.RAILWAY_GIT_COMMIT_SHA || "development";
  },
  trailingSlash: false,
  poweredByHeader: false,
  compress: true,
  experimental: {
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
