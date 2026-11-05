import { gzipSync } from "node:zlib";

import { type APIRequestContext, expect, test } from "@playwright/test";

import { venues } from "../../src/platform/tenant/registry";
import { venueHost } from "./routes";

/**
 * D-12 (REQ-016, NFR-05): every venue page is built ahead of time and stays within the JavaScript
 * budget; the day-end cron answers only to Vercel's secret and makes the pages rebuild. Each venue
 * in the registry is measured on its own host, so a new venue joins without editing this file.
 */

/** NFR-05: framework base 177 KB gzip + a venue route's share of 50 KB. */
const BUDGET_KB = 227;
/** Pages a theme tree may have; a page the theme does not have yet answers 404 and is skipped. */
const PAGES = ["/", "/kesfet", "/bilgi", "/cevrimdisi"] as const;

async function firstLoadJs(request: APIRequestContext, html: string) {
  const srcs = [...new Set([...html.matchAll(/<script[^>]+src="([^"]+)"/g)].map((m) => m[1]!))];
  let bytes = 0;
  const bodies: string[] = [];
  for (const src of srcs) {
    const body = await (await request.get(src)).body();
    bytes += gzipSync(body).length;
    bodies.push(body.toString("utf8"));
  }
  return { kb: bytes / 1024, bodies };
}

test.describe("static venue pages (D-12)", () => {
  for (const venue of venues) {
    test(`REQ-016 / NFR-05: ${venue.slug}'s pages are prerendered and within ${String(BUDGET_KB)} KB`, async ({
      request,
    }) => {
      test.skip(test.info().project.name !== "desktop", "runs once");
      for (const path of PAGES) {
        const response = await request.get(path, { headers: { host: venueHost(venue.slug) } });
        if (response.status() === 404 && path !== "/") continue;
        expect(response.status(), path).toBe(200);
        // Built at build time and served from the cache (ADR-0005), not rendered per request.
        // (next start may send the header twice: "1, 1").
        expect(response.headers()["x-nextjs-prerender"], path).toMatch(/^1(, 1)*$/);

        const { kb, bodies } = await firstLoadJs(request, await response.text());
        expect(kb, `${path}: ${kb.toFixed(0)} KB gzip`).toBeLessThanOrEqual(BUDGET_KB);
        // Schema code stays on the server: a client import of the registry once added 44 KB.
        for (const body of bodies) expect(body, path).not.toMatch(/ZodError|safeParse/);
      }
    });
  }
});

test.describe("day-end cron (P-01)", () => {
  const cron = "/api/cron/gun-sonu";

  test("answers 401 without Vercel's secret", async ({ request }) => {
    test.skip(test.info().project.name !== "desktop", "runs once");
    expect((await request.get(cron)).status()).toBe(401);
    const wrong = await request.get(cron, { headers: { authorization: "Bearer yanlis" } });
    expect(wrong.status()).toBe(401);
  });

  test("with the secret it reports every venue and their menus rebuild on the next visit", async ({
    request,
  }) => {
    test.skip(test.info().project.name !== "desktop", "runs once");
    // eslint-disable-next-line no-restricted-properties -- test harness reads the same .env as the app
    const secret = process.env.CRON_SECRET;
    test.skip(!secret, "CRON_SECRET is not set");
    // The English quick menu: no other spec visits it, so no parallel test starts its rebuild.
    const page = "/en";
    const host = { host: venueHost("ornek") };
    await request.get(page, { headers: host }); // the page is in the cache

    const response = await request.get(cron, { headers: { authorization: `Bearer ${secret!}` } });
    expect(response.status()).toBe(200);
    const report = (await response.json()) as { venues: string[] };
    expect(report.venues).toEqual(expect.arrayContaining(["ornek"]));

    // Stale-while-revalidate: the first visit gets the old page and starts the rebuild…
    const first = await request.get(page, { headers: host });
    expect(first.status()).toBe(200);
    expect(first.headers()["x-nextjs-cache"]).toBe("STALE");
    // …and a later one the rebuilt page.
    await expect
      .poll(async () => (await request.get(page, { headers: host })).headers()["x-nextjs-cache"])
      .toBe("HIT");
  });
});
