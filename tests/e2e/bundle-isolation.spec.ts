import { type APIRequestContext, expect, test } from "@playwright/test";

import { venues } from "../../src/platform/tenant/registry";
import { venueHost } from "./routes";

/**
 * D-22 (NFR-05, ADR-0003, K-35): a venue downloads only its own theme. Another theme's fonts and
 * client modules are 0 bytes on its pages, and the platform's typeface (Inter) never reaches a
 * venue. Every venue in the registry is checked, so a new venue or theme joins on its own.
 */

/**
 * Strings only a theme's first-load client code contains (Rakım: its photo transition name, D-16;
 * the rolling digits live in a lazy chunk and are not a first-load marker).
 */
const THEME_MARKERS: Record<string, readonly string[]> = {
  rakim: ["rakim-urun-gorseli"],
};

/**
 * Themes whose own typeface is the platform's (Sade: Inter, plan §11.8 pairing 1). For every other
 * theme a platform font file on a venue page is the K-35 leak (global-not-found importing fonts).
 */
const SHARES_PLATFORM_TYPEFACE = new Set(["sade"]);

type Assets = { fonts: Set<string>; scripts: string[] };

async function assetsOf(
  request: APIRequestContext,
  host: string | null,
  path = "/",
): Promise<Assets> {
  const headers = host ? { host } : undefined;
  const html = await (await request.get(path, { headers })).text();
  const fonts = new Set<string>();
  for (const match of html.matchAll(/href="([^"]+\.woff2)"/g)) fonts.add(match[1]!);
  for (const match of html.matchAll(/<link[^>]+rel="stylesheet"[^>]+href="([^"]+)"/g)) {
    const css = await (await request.get(match[1]!)).text();
    for (const font of css.matchAll(/url\(([^)]+\.woff2)\)/g)) {
      fonts.add(
        font[1]!.replace(/^["']|["']$/g, "").replace(/^.*\/media\//, "/_next/static/media/"),
      );
    }
  }
  const scripts: string[] = [];
  for (const match of html.matchAll(/<script[^>]+src="([^"]+)"/g)) {
    scripts.push(await (await request.get(match[1]!)).text());
  }
  return { fonts, scripts };
}

const media = (fonts: Set<string>) => new Set([...fonts].map((url) => url.split("/").pop()!));

test("NFR-05: no venue loads another theme's fonts or modules, nor the platform's typeface", async ({
  request,
}) => {
  test.skip(test.info().project.name !== "desktop", "runs once");
  const platform = media((await assetsOf(request, null, "/")).fonts);
  expect(platform.size, "the platform page has its own font").toBeGreaterThan(0);

  const byVenue = new Map<string, { theme: string; fonts: Set<string>; scripts: string[] }>();
  for (const venue of venues) {
    const assets = await assetsOf(request, venueHost(venue.slug));
    byVenue.set(venue.slug, {
      theme: venue.theme,
      fonts: media(assets.fonts),
      scripts: assets.scripts,
    });
  }

  for (const [slug, own] of byVenue) {
    if (!SHARES_PLATFORM_TYPEFACE.has(own.theme)) {
      for (const font of own.fonts) {
        expect(platform.has(font), `${slug}: platform font ${font}`).toBe(false);
      }
    }
    for (const [otherSlug, other] of byVenue) {
      if (other.theme === own.theme) continue;
      for (const font of own.fonts) {
        expect(other.fonts.has(font), `${slug} and ${otherSlug} share ${font}`).toBe(false);
      }
      for (const marker of THEME_MARKERS[other.theme] ?? []) {
        const leaked = own.scripts.some((body) => body.includes(marker));
        expect(leaked, `${slug} (${own.theme}) ships ${other.theme}'s ${marker}`).toBe(false);
      }
    }
  }
});

test("the signature markers are real: each theme's own pages contain them", async ({ request }) => {
  test.skip(test.info().project.name !== "desktop", "runs once");
  for (const venue of venues) {
    const markers = THEME_MARKERS[venue.theme];
    if (!markers) continue;
    const { scripts } = await assetsOf(request, venueHost(venue.slug));
    for (const marker of markers) {
      expect(
        scripts.some((body) => body.includes(marker)),
        `${venue.slug}: ${marker}`,
      ).toBe(true);
    }
  }
});
