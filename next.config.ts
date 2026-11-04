import type { NextConfig } from "next";

import { venues } from "./src/platform/tenant/registry";
import { buildTenantHeaders, buildTenantRewrites } from "./src/platform/tenant/rewrites";

/**
 * Tenant routing (ADR-0002 v2, K-39): host-based beforeFiles rewrites built from the venue
 * registry at build time. The platform's own host comes from NEXT_PUBLIC_PLATFORM_URL.
 */
const platformHost = new URL(process.env.NEXT_PUBLIC_PLATFORM_URL ?? "http://localhost:3020")
  .hostname;
const tenantRewrites = buildTenantRewrites(venues, { platformHosts: [platformHost] });

/**
 * Security headers for every response (11-guvenlik §8). The panel gets a stricter nonce-based
 * CSP from src/proxy.ts, so the static CSP below skips it (two CSP headers would be combined
 * into the stricter intersection).
 *
 * Venue menu pages are static (ADR-0005): Next.js' own inline bootstrap scripts cannot carry a
 * per-request nonce, so 'unsafe-inline' stays. Do NOT add a script hash here: in CSP Level 2+
 * browsers a hash or nonce makes them ignore 'unsafe-inline' and Next.js' inline scripts break
 * (plan K-33). The pre-paint daypart script (ADR-0005 §2) is covered by 'unsafe-inline' too.
 */
const isDev = process.env.NODE_ENV === "development";

const publicCsp = [
  "default-src 'self'",
  // React's dev tools need eval in development only.
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' blob: data: https:",
  "font-src 'self'",
  "connect-src 'self'",
  "frame-src 'none'",
  "worker-src 'self'", // per-venue service worker (D-13)
  "manifest-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "upgrade-insecure-requests",
].join("; ");

const securityHeaders = [
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
];

const nextConfig: NextConfig = {
  reactCompiler: true,
  // Plan §10: venue menus are static with tag revalidation; the panel is dynamic.
  cacheComponents: true,
  // Off on purpose (DERSLER D-012, 12-performans PF-08): create-next-app 16.4.3 turns it on; a tag
  // update followed by a client navigation received a half-filled prefetch on 16.4.2 (React #412).
  partialPrefetching: false,
  experimental: {
    // Multiple root layouts (platform + one per theme, ADR-0003) leave no single layout for a
    // global 404; this is the documented convention for that case (plan K-32).
    globalNotFound: true,
  },
  typedRoutes: true,
  // Pages read content/ (legal texts now; venue content from D-04) with "use cache"; a
  // revalidation on Vercel must find the files in the function bundle.
  outputFileTracingIncludes: { "/**": ["./content/**/*"] },
  turbopack: {
    rules: {
      "*.css": { loaders: ["@tailwindcss/turbopack"], as: "*.css" },
    },
  },
  images: {
    // Stock photos come from the Unsplash / Pexels CDN at the requested width (20 §6, SY-06);
    // Vercel's image optimisation is never used (plan K-16: the quota is per account).
    loader: "custom",
    loaderFile: "./src/lib/image-loader.ts",
    qualities: [60, 75, 85, 90],
  },
  poweredByHeader: false,
  rewrites() {
    return Promise.resolve({ beforeFiles: tenantRewrites, afterFiles: [], fallback: [] });
  },
  headers() {
    return Promise.resolve([
      { source: "/:path*", headers: securityHeaders },
      {
        source: "/((?!panel|api).*)",
        headers: [{ key: "Content-Security-Policy", value: publicCsp }],
      },
      ...buildTenantHeaders(),
    ]);
  },
};

export default nextConfig;
