/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    // Allow builds to pass even if ESLint reports errors
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Allow builds to pass even if there are TS type errors
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
};

export default nextConfig;
