import type { NextConfig } from 'next';

const isDev = process.env.NODE_ENV === 'development';

const apiOrigin = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') ?? 'http://localhost:4000';

const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  `connect-src 'self' ${apiOrigin} https:`,
  "frame-ancestors 'none'",
  "object-src 'none'",
  "base-uri 'self'",
].join('; ');

const securityHeaders = [
  { key: 'X-Frame-Options',              value: 'SAMEORIGIN' },
  { key: 'X-Content-Type-Options',       value: 'nosniff' },
  { key: 'Referrer-Policy',              value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy',           value: 'camera=(), microphone=(), geolocation=(self)' },
  { key: 'X-XSS-Protection',             value: '1; mode=block' },
  { key: 'Content-Security-Policy',      value: csp },
  ...(!isDev ? [
    { key: 'Strict-Transport-Security',  value: 'max-age=31536000; includeSubDomains; preload' },
  ] : []),
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  experimental: { typedRoutes: true },
  poweredByHeader: false,
  async headers() {
    return [{ source: '/(.*)', headers: securityHeaders }];
  },
};

export default nextConfig;
