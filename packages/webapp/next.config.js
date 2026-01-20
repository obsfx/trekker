/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  reactStrictMode: true,
  serverExternalPackages: ["bun:sqlite"],
  turbopack: {},
};

module.exports = nextConfig;
