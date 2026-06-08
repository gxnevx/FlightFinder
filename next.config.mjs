/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Lint roda via `npm run lint`; não bloqueia o build/deploy.
  eslint: { ignoreDuringBuilds: true },
};

export default nextConfig;
