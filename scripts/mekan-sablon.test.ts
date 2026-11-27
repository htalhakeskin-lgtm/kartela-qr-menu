import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { venueRecords } from "../content/mekanlar";
import { parseRegistry, type VenueRecordInput } from "../src/platform/tenant/registry-schema";
import {
  addTheme,
  addThemeMeta,
  addToContents,
  addToIndex,
  type NewVenue,
  renameTheme,
  venueFile,
} from "./mekan-sablon";

/** REQ-023 (D-21): what `pnpm mekan:yeni` / `tema:yeni` write, on the real registry files. */
const read = (path: string) => readFileSync(new URL(path, import.meta.url), "utf8");

const venue: NewVenue = {
  slug: "kepce-yeni",
  name: "Kepçe Lokantası",
  kind: "lokanta",
  theme: "sade",
  locales: ["tr", "en", "ar"],
  defaultLocale: "tr",
  domains: ["kepce-yeni-kartela.vercel.app"],
};

describe("REQ-023: a new venue in one command", () => {
  it("the record passes the registry with every existing venue", () => {
    expect(() =>
      parseRegistry([...venueRecords, { ...venue, mode: "demo" } as VenueRecordInput]),
    ).not.toThrow();
    expect(venueFile(venue)).toContain('slug: "kepce-yeni"');
    expect(venueFile(venue)).toContain('mode: "demo"');
  });

  it("adds the venue to the registry list and the content list, once", () => {
    const index = addToIndex(read("../content/mekanlar/index.ts"), venue.slug);
    expect(index).toContain('import kepceYeni from "./kepce-yeni/mekan";');
    expect(index).toMatch(/\[rakim, ornek, kepceYeni\]/);
    expect(addToIndex(index, venue.slug)).toBe(index);

    const contents = addToContents(read("../content/mekanlar/icerik.ts"), venue.slug);
    expect(contents).toContain('import kepceYeniMenu from "./kepce-yeni/menu";');
    expect(contents).toContain(
      '"kepce-yeni": { folder: "kepce-yeni", menu: kepceYeniMenu, stories: kepceYeniStories, info: kepceYeniInfo },',
    );
  });

  it("a new theme joins THEMES, the ESLint boundaries and the meta map", () => {
    expect(addTheme(read("../src/platform/tenant/registry-schema.ts"), "kepce")).toContain(
      'export const THEMES = ["rakim", "sade", "kepce"] as const;',
    );
    expect(addTheme(read("../eslint.config.mjs"), "kepce")).toContain(
      'const THEMES = ["rakim", "sade", "kepce"];',
    );
    const meta = addThemeMeta(read("../src/themes/meta.ts"), "kepce");
    expect(meta).toContain('import kepce from "./kepce/meta";');
    expect(meta).toContain("{ rakim, sade, kepce }");
  });

  it("renames Sade's identifiers but not Turkish words that contain them", () => {
    expect(
      renameTheme('import "@/themes/sade/sade.css"; sadeFontClassName; SadeShell', "kepce"),
    ).toBe('import "@/themes/kepce/kepce.css"; kepceFontClassName; KepceShell');
    expect(renameTheme("sadece bir not", "kepce")).toBe("sadece bir not");
  });
});
