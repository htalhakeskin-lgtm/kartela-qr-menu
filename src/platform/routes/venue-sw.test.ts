import { describe, expect, it } from "vitest";

import { SW_IMAGE_CACHE_LIMIT } from "../../config/limits";
import { SW_STORED_AT_HEADER, SW_WARM_MESSAGE } from "./sw-protocol";
import { swCacheNames, venueServiceWorker } from "./venue-sw";

const options = {
  slug: "ornek",
  version: "abc123",
  offlinePages: { tr: "/cevrimdisi", en: "/en/cevrimdisi", ar: "/ar/cevrimdisi" },
  defaultLocale: "tr",
};

/** The configuration object the generated worker starts from. */
function configOf(script: string): Record<string, unknown> {
  const match = /const C = (\{.*\});/.exec(script);
  if (!match?.[1]) throw new Error("no configuration line");
  return JSON.parse(match[1]) as Record<string, unknown>;
}

describe("D-13: the venue service worker (ADR-0005 §7)", () => {
  it("is valid JavaScript", () => {
    // eslint-disable-next-line @typescript-eslint/no-implied-eval -- parse only, never called
    expect(() => new Function(venueServiceWorker(options))).not.toThrow();
  });

  it("names its caches after the venue and the deploy, so a new deploy drops the old ones", () => {
    const config = configOf(venueServiceWorker(options));
    expect(config.names).toEqual(swCacheNames("ornek", "abc123"));
    expect(swCacheNames("ornek", "abc123").pages).toBe("kartela-ornek-sayfa-abc123");
    expect(swCacheNames("ornek", "def456").pages).not.toBe(swCacheNames("ornek", "abc123").pages);
    // Images survive a deploy (their addresses do not change); the cap keeps them bounded.
    expect(swCacheNames("ornek", "def456").images).toBe(swCacheNames("ornek", "abc123").images);
  });

  it("knows each language's offline page, the image cap (P-05) and the page protocol", () => {
    const config = configOf(venueServiceWorker(options));
    expect(config).toMatchObject({
      offlinePages: options.offlinePages,
      defaultLocale: "tr",
      imageLimit: SW_IMAGE_CACHE_LIMIT,
      imageHosts: ["images.unsplash.com", "images.pexels.com"],
      timeout: 3000,
      warm: SW_WARM_MESSAGE,
      storedAt: SW_STORED_AT_HEADER,
    });
    expect(SW_IMAGE_CACHE_LIMIT).toBe(60);
  });

  it("leaves the API, the panel and itself alone", () => {
    const script = venueServiceWorker(options);
    expect(script).toContain(
      'path.startsWith("/api/") || path.startsWith("/panel") || path === "/sw.js"',
    );
  });
});
