import { expect, test } from "@playwright/test";

/**
 * Release gate 6 (11-guvenlik §8, GV-06): the security headers on a public page, the panel's
 * nonce CSP, no referrer from token and signed pages (09 SEO-08), and the demo's noindex.
 * Runs once. TOKEN_PATHS: the project's token / signed routes (e.g. "/takip/yok").
 */
const TOKEN_PATHS: readonly string[] = [];

test.beforeEach(() => {
  test.skip(test.info().project.name !== "desktop", "runs once");
});

test("a public page carries the security headers and a CSP without eval", async ({ request }) => {
  const headers = (await request.get("/")).headers();
  expect(headers["strict-transport-security"]).toContain("max-age=");
  expect(headers["x-content-type-options"]).toBe("nosniff");
  expect(headers["x-frame-options"]).toBe("DENY");
  expect(headers["referrer-policy"]).toBe("strict-origin-when-cross-origin");
  expect(headers["permissions-policy"]).toContain("camera=()");
  expect(headers["x-powered-by"]).toBeUndefined();
  const csp = headers["content-security-policy"] ?? "";
  expect(csp).toContain("object-src 'none'");
  expect(csp).toContain("frame-ancestors 'none'");
  expect(csp).not.toContain("unsafe-eval");
});

test("the panel gets a per-request nonce CSP and is never indexed", async ({ request }) => {
  const [first, second] = await Promise.all([
    request.get("/panel/giris"),
    request.get("/panel/giris"),
  ]);
  const nonce = (value: string | undefined) => /'nonce-([^']+)'/.exec(value ?? "")?.[1];
  const a = nonce(first.headers()["content-security-policy"]);
  expect(a).toBeTruthy();
  expect(a).not.toBe(nonce(second.headers()["content-security-policy"]));
  expect(first.headers()["content-security-policy"]).toContain("'strict-dynamic'");
  expect(first.headers()["x-robots-tag"]).toContain("noindex");
});

test("token and signed pages send no referrer", async ({ request }) => {
  test.skip(TOKEN_PATHS.length === 0, "no token pages yet");
  for (const path of TOKEN_PATHS) {
    expect((await request.get(path)).headers()["referrer-policy"], path).toBe("no-referrer");
  }
});

test("demo: public pages say noindex", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
});
