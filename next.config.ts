import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  /**
   * Next.js locks the dist directory while a dev server is running, so a
   * second `next dev` in the same project is refused. `NEXT_DIST_DIR` lets the
   * mail route test (`npm run test:email-routes`) start its own server with
   * its own output directory instead of colliding with the developer's.
   */
  distDir: process.env.NEXT_DIST_DIR || ".next",
  async headers() {
    const isProd = process.env.NODE_ENV === "production";
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "X-DNS-Prefetch-Control",
            value: "on",
          },
          {
            key: "Strict-Transport-Security",
            value: isProd
              ? "max-age=63072000; includeSubDomains; preload"
              : "max-age=0",
          },
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value:
              "camera=(), microphone=(), geolocation=(), interest-cohort=()",
          },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob: https://images.unsplash.com https://*.public.blob.vercel-storage.com https://*.blob.vercel-storage.com https:",
              "font-src 'self' data:",
              "connect-src 'self'",
              "frame-ancestors 'self'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join("; "),
          },
        ],
      },
    ];
  },
  async redirects() {
    return [
      { source: "/login", destination: "/auth/login", permanent: true },
      { source: "/signup", destination: "/auth/signup", permanent: true },
      { source: "/register", destination: "/auth/signup", permanent: true },
      {
        source: "/forgot-password",
        destination: "/auth/forgot-password",
        permanent: true,
      },
      {
        source: "/reset-password",
        destination: "/auth/reset-password",
        permanent: true,
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "*.public.blob.vercel-storage.com",
      },
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
};

export default nextConfig;
