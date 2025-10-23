// next.config.mjs
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    // Don't fail the production build because of ESLint errors.
    // You should still run `npm run lint` locally/CI.
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Keep this false so real TS errors still fail the build.
    ignoreBuildErrors: false,
  },
};
export default nextConfig;
