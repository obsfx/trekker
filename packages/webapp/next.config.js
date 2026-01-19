/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  reactStrictMode: true,
  experimental: {
    serverComponentsExternalPackages: ["bun:sqlite"],
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = [...(config.externals || []), "bun:sqlite"];
    }
    // Suppress the bun:sqlite caching warnings
    config.infrastructureLogging = {
      level: "error",
    };
    return config;
  },
};

module.exports = nextConfig;
