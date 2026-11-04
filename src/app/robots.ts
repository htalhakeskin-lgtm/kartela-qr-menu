import type { MetadataRoute } from "next";

import { env } from "@/lib/env";
import { absoluteUrl } from "@/lib/seo";

/**
 * robots.txt of the platform host (09-seo §3). Demo: nothing is indexed. Live: the panel and the
 * API are off limits. Venue hosts get their own robots.txt from their theme tree: the proxy
 * rewrites /robots.txt per venue (ADR-0002, D-01 / D-11), driven by the venue's own mode.
 */
export default function robots(): MetadataRoute.Robots {
  if (env.PLATFORM_DEMO) return { rules: [{ userAgent: "*", disallow: "/" }] };
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/panel", "/api/", "/m/"] }],
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
