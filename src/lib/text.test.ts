import { describe, expect, it } from "vitest";

import { compareTurkish, slugify, toSearchKey } from "./text";

describe("Turkish text helpers", () => {
  it("builds diacritic-free search keys with Turkish casing", () => {
    expect(toSearchKey("IŞIK")).toBe("isik");
    expect(toSearchKey("İstanbul  Üsküdar")).toBe("istanbul uskudar");
  });

  it("creates ASCII kebab-case slugs", () => {
    expect(slugify("Diş Beyazlatma & Bakım")).toBe("dis-beyazlatma-bakim");
    expect(slugify("  Kadıköy 3+1 Satılık Daire ")).toBe("kadikoy-3-1-satilik-daire");
  });

  it("sorts with the Turkish alphabet", () => {
    expect(["Çorum", "Cide", "Ağrı", "Adana"].sort(compareTurkish)).toEqual([
      "Adana",
      "Ağrı",
      "Cide",
      "Çorum",
    ]);
  });
});
