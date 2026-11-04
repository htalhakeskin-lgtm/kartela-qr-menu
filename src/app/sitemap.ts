import type { MetadataRoute } from "next";

import { absoluteUrl } from "@/lib/seo";

/**
 * Sitemap of the platform host (09-seo §3). Venue sites have their own sitemap.xml from their
 * theme tree (D-11); venues never link to each other (plan §15).
 */
const staticPaths = ["/", "/kvkk", "/gizlilik", "/cerez-politikasi"];

export default function sitemap(): MetadataRoute.Sitemap {
  return staticPaths.map((path) => ({ url: absoluteUrl(path) }));
}
