import "server-only";

import type { Metadata } from "next";

import { env } from "@/lib/env";
import { publicEnv } from "@/lib/public-env";

/**
 * Metadata for the platform's own pages (09-seo §2): the introduction page, legal texts and the
 * style tile on the platform host. While PLATFORM_DEMO=true every page is noindex (09-seo §7).
 * Venue sites get their metadata from the venue shell (D-11), with the venue's own domain as
 * metadataBase and canonical (plan §15).
 */
type PageSeo = {
  title: string;
  description: string;
  path: string; // "/kvkk"
  image?: string; // absolute or site-relative; defaults to the platform share image (/og/platform)
  noindex?: boolean;
};

export function absoluteUrl(path: string): string {
  return new URL(path, publicEnv.NEXT_PUBLIC_PLATFORM_URL).toString();
}

export function pageMetadata({
  title,
  description,
  path,
  image,
  noindex = false,
}: PageSeo): Metadata {
  const index = !env.PLATFORM_DEMO && !noindex;
  return {
    title,
    description,
    alternates: { canonical: absoluteUrl(path) },
    robots: { index, follow: index },
    openGraph: {
      type: "website",
      locale: "tr_TR",
      url: absoluteUrl(path),
      title,
      description,
      // A page-level `openGraph` object replaces the inherited one, so without an explicit image
      // every page but "/" loses the share image (SEO-06).
      images: [{ url: absoluteUrl(image ?? "/og/platform"), width: 1200, height: 630 }],
    },
    twitter: { card: "summary_large_image", title, description },
  };
}

/** JSON-LD script content with "<" escaped so data can never close the script tag (11-guvenlik §6). */
export function jsonLd(data: Record<string, unknown>): string {
  return JSON.stringify({ "@context": "https://schema.org", ...data }).replace(/</g, "\\u003c");
}
