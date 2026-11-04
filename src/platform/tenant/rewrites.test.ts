import {
  getRewrittenUrl,
  unstable_getResponseFromNextConfig,
} from "next/experimental/testing/server";
import { describe, expect, it } from "vitest";

import nextConfig from "../../../next.config";

/**
 * REQ-001, BR-KRC-004: the host rewrites of the real next.config.ts, evaluated by Next.js' own
 * routing helper (no server). The helper returns the FIRST matching rewrite and ignores the
 * filesystem; Next.js chains beforeFiles rewrites. The rules are ordered so both agree, and the
 * e2e spec (tests/e2e/tenant.spec.ts) checks the real chain on a running server.
 */
async function route(url: string, init: { cookies?: Record<string, string> } = {}) {
  const response = await unstable_getResponseFromNextConfig({
    url,
    nextConfig,
    cookies: init.cookies ?? {},
  });
  const rewritten = getRewrittenUrl(response);
  return rewritten ? new URL(rewritten).pathname + new URL(rewritten).search : null;
}

describe("tenant routing by host (ADR-0002 v2)", () => {
  it("a venue domain opens the venue's theme tree", async () => {
    expect(await route("https://rakim-kahve.vercel.app/")).toBe("/tema-rakim/rakim/tr");
    expect(await route("https://rakim-kahve.vercel.app/urun/latte")).toBe(
      "/tema-rakim/rakim/tr/urun/latte",
    );
  });

  it("{slug}.localhost works locally, and a ready-made theme is shared", async () => {
    expect(await route("http://rakim.localhost:3020/")).toBe("/tema-rakim/rakim/tr");
    expect(await route("http://ornek.localhost:3020/")).toBe("/tema-sade/ornek/tr");
  });

  it("non-default locales get their prefix, the default does not", async () => {
    expect(await route("http://ornek.localhost:3020/ar")).toBe("/tema-sade/ornek/ar");
    expect(await route("http://ornek.localhost:3020/en/kesfet")).toBe("/tema-sade/ornek/en/kesfet");
  });

  it("robots.txt, sitemap.xml and the manifest come from the venue's tree", async () => {
    expect(await route("https://rakim-kahve.vercel.app/robots.txt")).toBe(
      "/tema-rakim/rakim/robots.txt",
    );
    expect(await route("http://ornek.localhost:3020/sitemap.xml")).toBe(
      "/tema-sade/ornek/sitemap.xml",
    );
    expect(await route("http://rakim.localhost:3020/manifest.webmanifest")).toBe(
      "/tema-rakim/rakim/manifest.webmanifest",
    );
  });

  it("assets and API calls are never rewritten on a venue host", async () => {
    expect(await route("https://rakim-kahve.vercel.app/_next/static/chunks/a.js")).toBeNull();
    expect(await route("https://rakim-kahve.vercel.app/api/health")).toBeNull();
  });

  it("BR-KRC-004: an internal /tema-* path requested directly answers 404", async () => {
    for (const url of [
      "https://rakim-kahve.vercel.app/tema-rakim/rakim/tr",
      "http://localhost:3020/tema-sade/ornek/tr",
    ]) {
      expect(await route(url), url).not.toMatch(/^\/tema-/);
    }
    expect(await route("http://localhost:3020/tema-rakim/rakim/tr")).toBe("/bilinmeyen-alan-adi");
  });

  it("the platform host keeps its own pages", async () => {
    expect(await route("http://localhost:3020/")).toBeNull();
    expect(await route("https://kartela-platform.vercel.app/kvkk")).toBeNull();
    expect(await route("https://kartela-git-feat-talha-keskin.vercel.app/")).toBeNull();
  });

  it("/m/{slug} opens a venue on any host (path-prefixed preview)", async () => {
    expect(await route("http://localhost:3020/m/rakim")).toBe("/tema-rakim/rakim/tr");
    expect(await route("http://localhost:3020/m/ornek/ar")).toBe("/tema-sade/ornek/ar");
  });

  it("?mekan= goes to the preview switch, keeping the path", async () => {
    const switchTo = async (url: string) => {
      const target = new URL((await route(url)) ?? "/", "http://x");
      return { path: target.pathname, ...Object.fromEntries(target.searchParams) };
    };
    expect(await switchTo("http://localhost:3020/?mekan=rakim")).toEqual({
      path: "/api/onizleme",
      yol: "",
      mekan: "rakim",
    });
    // An empty value counts as "no parameter" in Next.js; leaving the preview is ?mekan=platform.
    expect(await switchTo("http://localhost:3020/kvkk?mekan=platform")).toEqual({
      path: "/api/onizleme",
      yol: "kvkk",
      mekan: "platform",
    });
  });

  it("the preview cookie turns the platform host into the venue, except the panel", async () => {
    const cookies = { kartela_onizleme: "ornek" };
    expect(await route("http://localhost:3020/", { cookies })).toBe("/tema-sade/ornek/tr");
    expect(await route("http://localhost:3020/ar", { cookies })).toBe("/tema-sade/ornek/ar");
    expect(await route("http://localhost:3020/panel", { cookies })).toBeNull();
  });

  it("a venue host still serves the shared API and assets (not caught as unknown)", async () => {
    expect(await route("http://rakim.localhost:3020/api/health")).toBeNull();
    expect(await route("https://rakim-kahve.vercel.app/api/olay")).toBeNull();
  });

  it("BR-KRC-004: an unknown host answers 404", async () => {
    expect(await route("http://bilinmeyen.localhost:3020/")).toBe("/bilinmeyen-alan-adi");
    expect(await route("https://example.com/menu")).toBe("/bilinmeyen-alan-adi");
  });
});
