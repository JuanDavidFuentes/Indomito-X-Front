import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_API_URL: process.env.API_URL ?? 'http://localhost:4000',
    NEXT_PUBLIC_WEB_URL: process.env.WEB_URL ?? 'http://localhost:3000',
  },
};

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

export default withNextIntl(nextConfig);
