/** @type {import('next').NextConfig} */
const nextConfig = {
  // keep strict: do NOT ignore TS/ESLint here
  webpack: (config) => {
    // Avoid bundling native modules that break on Netlify
    config.resolve = config.resolve || {};
    config.resolve.fallback = {
      ...(config.resolve.fallback || {}),
      canvas: false, // native - block it unless you truly use it
      fs: false,
      path: false,
    };
    return config;
  },
};

module.exports = nextConfig;
