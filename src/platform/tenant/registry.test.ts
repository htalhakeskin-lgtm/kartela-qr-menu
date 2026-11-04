import { describe, expect, it } from "vitest";

import { themeLocaleParams, venueOrigin, venues } from "./registry";
import { parseRegistry, type VenueRecordInput } from "./registry-schema";

const base: VenueRecordInput = {
  slug: "deneme",
  name: "Deneme",
  theme: "sade",
  locales: ["tr"],
  defaultLocale: "tr",
  domains: ["deneme.vercel.app"],
  mode: "demo",
};

describe("venue registry (ADR-0002 v2)", () => {
  it("the shipped registry is valid and includes Rakım on its own domain", () => {
    const rakim = venues.find((venue) => venue.slug === "rakim");
    expect(rakim?.theme).toBe("rakim");
    expect(rakim && venueOrigin(rakim)).toBe("https://rakim-kahve.vercel.app");
  });

  it("static params follow the registry: one entry per venue × locale of the theme", () => {
    expect(themeLocaleParams("rakim")).toEqual([{ mekan: "rakim", dil: "tr" }]);
    expect(themeLocaleParams("sade").map((p) => p.dil)).toEqual(["tr", "en", "ar"]);
  });

  it("rejects a default locale the venue does not serve", () => {
    expect(() => parseRegistry([{ ...base, defaultLocale: "en" }])).toThrow(/defaultLocale/);
  });

  it("rejects a slug that cannot be a subdomain or path segment", () => {
    expect(() => parseRegistry([{ ...base, slug: "Rakım Kahve" }])).toThrow(/slug/);
  });

  it("rejects slugs the routing reserves (preview exit, panel, api)", () => {
    for (const slug of ["platform", "panel", "api"]) {
      expect(() => parseRegistry([{ ...base, slug }]), slug).toThrow(/ayrılmış/);
    }
  });

  it("BR-KRC-004: rejects one host bound to two venues", () => {
    expect(() =>
      parseRegistry([base, { ...base, slug: "ikinci", domains: ["deneme.vercel.app"] }]),
    ).toThrow(/deneme\.vercel\.app hem deneme hem ikinci/);
  });

  it("rejects duplicate slugs and malformed domains", () => {
    expect(() => parseRegistry([base, { ...base, domains: [] }])).toThrow(/slug tekrarlandı/);
    expect(() => parseRegistry([{ ...base, domains: ["https://deneme.app"] }])).toThrow();
  });
});
