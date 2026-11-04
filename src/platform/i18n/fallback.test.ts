import { describe, expect, it } from "vitest";

import { localize, localizeOptional } from "./fallback";

describe("BR-MNU-003: a missing translation falls back and says so", () => {
  const description = {
    tr: "Yıkanmış işleme, bergamot ve şeftali.",
    en: "Washed, bergamot, peach.",
  };

  it("the requested language when it exists", () => {
    expect(localize(description, "en")).toEqual({
      text: "Washed, bergamot, peach.",
      lang: "en",
      fallback: false,
    });
  });

  it("Turkish on the Arabic page, marked with its language (REQ-006)", () => {
    expect(localize(description, "ar")).toEqual({
      text: "Yıkanmış işleme, bergamot ve şeftali.",
      lang: "tr",
      fallback: true,
    });
  });

  it("the venue's default language comes before Turkish", () => {
    expect(localize({ tr: "Çorba", en: "Soup" }, "ar", "en")).toMatchObject({
      text: "Soup",
      lang: "en",
    });
  });

  it("an empty or blank translation counts as missing", () => {
    expect(localize({ tr: "Çorba", en: "  " }, "en")).toMatchObject({ text: "Çorba", lang: "tr" });
  });

  it("optional fields: null when there is no text at all", () => {
    expect(localizeOptional(null, "en")).toBeNull();
    expect(localizeOptional({ tr: "" }, "en")).toBeNull();
    expect(localizeOptional({ tr: "Mercimek" }, "tr")).toMatchObject({ fallback: false });
  });
});
