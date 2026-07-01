import type { NextConfig } from 'next';

const isDev = process.env.NODE_ENV === 'development';

// CSP is handled by middleware.ts (nonce-based per request).
// Only static security headers live here.
const securityHeaders = [
  { key: 'X-Frame-Options',                   value: 'SAMEORIGIN' },
  { key: 'X-Content-Type-Options',            value: 'nosniff' },
  { key: 'Referrer-Policy',                   value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy',                value: 'camera=(), microphone=(), geolocation=(self)' },
  { key: 'X-XSS-Protection',                  value: '1; mode=block' },
  { key: 'Cross-Origin-Opener-Policy',        value: 'same-origin' },
  { key: 'Cross-Origin-Resource-Policy',      value: 'same-origin' },
  ...(!isDev ? [
    { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains; preload' },
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
