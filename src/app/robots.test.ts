import { describe, expect, it, vi } from "vitest";

const env = vi.hoisted(() => ({ PLATFORM_DEMO: false }));
vi.mock("@/lib/env", () => ({ env }));

const { default: robots } = await import("./robots");

/** What a crawler following `Disallow` prefixes may fetch (09-seo §3). */
function allowed(path: string): boolean {
  const rules = [robots().rules].flat();
  const disallow = rules.flatMap((rule) => [rule.disallow ?? []].flat());
  return !disallow.some((prefix) => path.startsWith(prefix));
}

describe("platform robots.txt (09-seo §3)", () => {
  it("live: the panel, the API and path-prefixed venue previews are off limits", () => {
    env.PLATFORM_DEMO = false;
    expect(allowed("/")).toBe(true);
    expect(allowed("/kvkk")).toBe(true);
    for (const path of ["/panel", "/panel/rakim", "/api/health", "/m/rakim/"]) {
      expect(allowed(path), path).toBe(false);
    }
    expect(robots().sitemap).toMatch(/\/sitemap\.xml$/);
  });

  it("demo: nothing is crawled", () => {
    env.PLATFORM_DEMO = true;
    expect(allowed("/")).toBe(false);
  });
});
