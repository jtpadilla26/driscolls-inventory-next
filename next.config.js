/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: { typedRoutes: true },
  redirects: async () => [
    { source: "/", destination: "/dashboard", permanent: false }
  ]
};
module.exports = nextConfig;
