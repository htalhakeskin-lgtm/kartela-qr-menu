import { type Browser, expect, type Page, test } from "@playwright/test";

import { galleryRoutes, notFoundRoute, publicRoutes, venueRoutes } from "./routes";

/**
 * Image quality is measured, not judged (20-gorsel-kalite §8). On every public route, at a
 * retina laptop and a 3× phone:
 * - GK-04 sharpness: the file's real pixels ≥ 80% of the device pixels it covers (DPR capped at 2),
 *   i.e. at most 1.25× upscaling. Real pixels are probed from the downloaded file: `naturalWidth`
 *   of an <img srcset> is density-corrected by the w descriptor and would mislead.
 * - no broken images,
 * - GK-03 one role per image: the same file is not shown twice on a page (gallery routes and
 *   elements marked `data-allow-repeat` are exempt).
 * Runs once (desktop project) because it creates its own device contexts.
 */

const MAX_UPSCALE = 1.25; // a 2400 px hero on a 1440 px @2x screen (1.2×) passes
const MIN_BOX = 40; // smaller images (icons, avatars) are ignored

const SETUPS = [
  {
    name: "1440 @2x",
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
    isMobile: false,
    hasTouch: false,
  },
  {
    name: "390 @3x",
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
  },
] as const;

type Audit = { blurry: string[]; broken: string[]; repeated: string[] };

async function openPage(browser: Browser, setup: (typeof SETUPS)[number], route: string) {
  const context = await browser.newContext({
    viewport: setup.viewport,
    deviceScaleFactor: setup.deviceScaleFactor,
    isMobile: setup.isMobile,
    hasTouch: setup.hasTouch,
    baseURL: test.info().project.use.baseURL,
    locale: "tr-TR",
    timezoneId: "Europe/Istanbul",
  });
  const page = await context.newPage();
  await page.goto(route);
  await page.waitForLoadState("networkidle");
  // Scroll through the page so lazy images load, then wait until they are decoded.
  await page.evaluate(async () => {
    for (let y = 0; y < document.documentElement.scrollHeight; y += window.innerHeight) {
      window.scrollTo(0, y);
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    window.scrollTo(0, 0);
    await Promise.all([...document.images].map((img) => img.decode().catch(() => undefined)));
  });
  return page;
}

function audit(page: Page, allowRepeat: boolean): Promise<Audit> {
  return page.evaluate(
    async ({ maxUpscale, minBox, allowRepeat }) => {
      const dpr = Math.min(window.devicePixelRatio, 2);
      /** Same picture, any size variant: next/image url param, CDN path, "-960" style suffix. */
      const fileKey = (src: string) => {
        const url = new URL(src, location.href);
        const inner = url.pathname.startsWith("/_next/image") ? url.searchParams.get("url") : null;
        const target = inner ? new URL(inner, location.href) : url;
        return target.pathname.replace(/[-_@](\d{2,4}w?|\dx)(?=\.\w+$)/, "");
      };
      const result = { blurry: [] as string[], broken: [] as string[], repeated: [] as string[] };
      const seen = new Map<string, number>();

      for (const img of document.images) {
        const src = img.currentSrc || img.src;
        if (!src || src.startsWith("data:") || /\.svg(\?|$)/.test(src)) continue;
        const box = img.getBoundingClientRect();
        const style = getComputedStyle(img);
        if (box.width < minBox || box.height < minBox || style.visibility === "hidden") continue;
        const key = fileKey(src);
        if (!img.complete || img.naturalWidth === 0) {
          result.broken.push(key);
          continue;
        }
        // Real pixel size of the file the browser chose (from cache; no srcset density applied).
        const probe = new Image();
        probe.src = src;
        await probe.decode().catch(() => undefined);
        const width = probe.naturalWidth || img.naturalWidth;
        const height = probe.naturalHeight || img.naturalHeight;
        const sx = box.width / width;
        const sy = box.height / height;
        const fit = style.objectFit;
        const scale =
          fit === "contain" || fit === "scale-down" ? Math.min(sx, sy) : Math.max(sx, sy);
        if (scale * dpr > maxUpscale) {
          result.blurry.push(
            `${key}: ${width}×${height} px shown at ${Math.round(box.width)}×${Math.round(box.height)} CSS px (needs ≥ ${Math.ceil((width * scale * dpr) / maxUpscale)} px wide)`,
          );
        }
        if (!allowRepeat && !img.closest("[data-allow-repeat]"))
          seen.set(key, (seen.get(key) ?? 0) + 1);
      }
      for (const [key, count] of seen) if (count > 1) result.repeated.push(`${key} ×${count}`);
      return result;
    },
    { maxUpscale: MAX_UPSCALE, minBox: MIN_BOX, allowRepeat },
  );
}

for (const route of [...publicRoutes, ...venueRoutes].filter((r) => r !== notFoundRoute)) {
  for (const setup of SETUPS) {
    test(`${route} images are sharp, intact and not repeated at ${setup.name}`, async ({
      browser,
    }) => {
      test.skip(test.info().project.name !== "desktop", "runs once with its own device contexts");
      const page = await openPage(browser, setup, route);
      const result = await audit(page, galleryRoutes.includes(route));
      await page.context().close();

      expect.soft(result.broken, "broken images").toEqual([]);
      expect.soft(result.blurry, "upscaled (blurry) images — GK-04").toEqual([]);
      expect.soft(result.repeated, "same image in two roles — GK-03").toEqual([]);
    });
  }
}
