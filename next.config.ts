import type { NextConfig } from "next";

// Content Security Policy — shipped in Report-Only mode so it never breaks the app.
// It logs violations to the browser console; promote to "Content-Security-Policy"
// (enforcing) once production reports are clean. Allowlist covers Supabase, Stripe,
// Google Analytics/Tag Manager, Meta Pixel, Vercel and the public image hosts.
const contentSecurityPolicy = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com https://connect.facebook.net https://js.stripe.com https://va.vercel-scripts.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "img-src 'self' data: blob: https://images.unsplash.com https://*.supabase.co https://lh3.googleusercontent.com https://avatars.githubusercontent.com https://www.google-analytics.com https://www.googletagmanager.com https://www.facebook.com https://*.tile.openstreetmap.org",
  "font-src 'self' data: https://fonts.gstatic.com",
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://www.google-analytics.com https://region1.google-analytics.com https://www.googletagmanager.com https://connect.facebook.net https://api.stripe.com https://nominatim.openstreetmap.org https://vitals.vercel-insights.com",
  "frame-src 'self' https://js.stripe.com https://www.facebook.com",
  "frame-ancestors 'self'",
  "base-uri 'self'",
  "form-action 'self' https://checkout.stripe.com",
  "object-src 'none'",
  "upgrade-insecure-requests",
].join("; ");

const securityHeaders = [
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(self), browsing-topics=()",
  },
  // HSTS — 2 years. Add "; preload" only after submitting to the HSTS preload list.
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
  { key: "Content-Security-Policy-Report-Only", value: contentSecurityPolicy },
];

const nextConfig: NextConfig = {
  turbopack: {},
  compress: true, // gzip responses (Vercel also applies brotli at the edge)
  poweredByHeader: false, // drop the "X-Powered-By: Next.js" disclosure header
  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 2678400, // 31 days — keep optimized images cached longer
    dangerouslyAllowSVG: false, // never optimize/serve SVG through the image pipeline
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
