import { readFileSync } from "node:fs";
import { mkdir } from "node:fs/promises";

import { type Browser, test } from "@playwright/test";

import { PANEL_STATE } from "./routes";

/**
 * Portfolio screenshots (19-portfolyo §3). Run with `pnpm screenshots` after `pnpm db:reset`.
 * Desktop 1440×900 @2x, phone 390×844 @3x, tablet 820×1180 @2x. Animations end in their final
 * frame (reduced motion), the cookie banner is pre-dismissed, the demo banner stays visible.
 * A shot may run steps first (`hazirla`: fill, click, wait — Playwright selectors; a native
 * <dialog> is `dialog[open]`, not `[role=dialog]`). `{key}` in a path is replaced from `links`,
 * which resolveLinks() fills (e.g. a fresh tracking link from the database; 19 §3, PO-05).
 */

type Device = "masaustu" | "mobil" | "tablet";
type Step = { tikla?: string; doldur?: string; metin?: string; bekle?: string };
type Shot = {
  dosya: string;
  yol: string;
  cihaz: Device;
  tamSayfa?: boolean;
  panel?: boolean;
  hazirla?: Step[];
};

const DEVICES: Record<
  Device,
  {
    viewport: { width: number; height: number };
    deviceScaleFactor: number;
    isMobile: boolean;
    hasTouch: boolean;
  }
> = {
  masaustu: {
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
    isMobile: false,
    hasTouch: false,
  },
  mobil: {
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
  },
  tablet: {
    viewport: { width: 820, height: 1180 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  },
};

const OUT_DIR = "portfolyo/screenshot";
const shots = (JSON.parse(readFileSync("portfolyo/ekranlar.json", "utf8")) as { ekranlar: Shot[] })
  .ekranlar;

/** Cookie preference stored before the page loads, so the banner never appears in a shot. */
const COOKIE_CONSENT = { name: "cookie-consent", value: "necessary" }; // match the banner's cookie

const links: Record<string, string> = {};

/**
 * Paths only the database knows (a tracking token, today's next appointment). beforeAll runs per
 * worker: derive tokens from a fixed seed so every worker writes the same one.
 */
async function resolveLinks(): Promise<void> {
  // Project-specific, e.g. links.takip = `/takip/${token}` after storing its hash.
}

async function capture(browser: Browser, baseURL: string, shot: Shot) {
  const path = shot.yol.replace(/\{(\w+)\}/g, (_, key: string) => links[key] ?? "/");
  const context = await browser.newContext({
    ...DEVICES[shot.cihaz],
    baseURL,
    locale: "tr-TR",
    timezoneId: "Europe/Istanbul",
    reducedMotion: "reduce",
    colorScheme: "light",
    storageState: shot.panel ? PANEL_STATE : undefined,
  });
  await context.addCookies([{ ...COOKIE_CONSENT, url: baseURL }]);
  const page = await context.newPage();
  await page.goto(path, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  // Trigger lazy images, then return to the top.
  await page.evaluate(async () => {
    for (let y = 0; y < document.documentElement.scrollHeight; y += window.innerHeight) {
      window.scrollTo(0, y);
      await new Promise((resolve) => setTimeout(resolve, 120));
    }
    window.scrollTo(0, 0);
  });
  await page.waitForLoadState("networkidle");
  for (const step of shot.hazirla ?? []) {
    if (step.doldur)
      await page
        .locator(step.doldur)
        .first()
        .fill(step.metin ?? "");
    if (step.tikla) await page.locator(step.tikla).first().click();
    if (step.bekle) await page.locator(step.bekle).first().waitFor();
  }
  await page.waitForLoadState("networkidle");
  await page.addStyleTag({
    content: "::-webkit-scrollbar{display:none} *{caret-color:transparent !important}",
  });

  await page.screenshot({ path: `${OUT_DIR}/${shot.dosya}.png` });
  if (shot.tamSayfa)
    await page.screenshot({ path: `${OUT_DIR}/${shot.dosya}-tam.png`, fullPage: true });
  await context.close();
}

test.describe.configure({ mode: "parallel" });

test.beforeAll(async () => {
  await mkdir(OUT_DIR, { recursive: true });
  await resolveLinks();
});

for (const shot of shots) {
  test(shot.dosya, async ({ browser, baseURL }) => {
    test.setTimeout(60_000);
    await capture(browser, baseURL ?? "http://localhost:3020", shot);
  });
}
