const API_ORIGIN = process.env.API_ORIGIN ?? 'http://localhost:3001';

const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
];

const nextConfig = {
  output: 'standalone',
  poweredByHeader: false,
  reactStrictMode: true,
  transpilePackages: ['@acme/web-utils'],
  headers: () => Promise.resolve([{ source: '/:path*', headers: securityHeaders }]),
  rewrites: () =>
    Promise.resolve([{ source: '/api/v1/:path*', destination: `${API_ORIGIN}/api/v1/:path*` }]),
};

export default nextConfig;
