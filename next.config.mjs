/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Lint roda via `npm run lint`; não bloqueia o build/deploy.
  eslint: { ignoreDuringBuilds: true },
  // O core Python vive em tools/ e não faz parte do build web.
  outputFileTracingExcludes: {
    "*": ["tools/**", ".claude/**"],
  },
};

export default nextConfig;
