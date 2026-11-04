import { describe, expect, it } from "vitest";

import { toSearchKey } from "../../lib/text";
import { venueTag } from "../tenant/cache-tags";
import { activeFilterCount, decodeFilters, encodeFilters, matchFilters } from "./filters";
import {
  addPick,
  changeQty,
  parseStoredPicks,
  pickKey,
  picksStorageKey,
  prunePicks,
  resolvePicks,
} from "./picks";
import { searchItems } from "./search";

describe("REQ-012: menu filters in the address bar", () => {
  it("encodes and decodes the same filters", () => {
    const filters = {
      diets: ["vegan" as const],
      excludeAllergens: ["gluten" as const, "milk" as const],
      maxSpice: 1 as const,
    };
    const param = encodeFilters(filters);
    expect(param).toBe("diyet:vegan;alerjen:gluten.milk;aci:1");
    expect(decodeFilters(param)).toEqual(filters);
    expect(activeFilterCount(filters)).toBe(4);
  });

  it("ignores what it does not know (an edited or old link never breaks the page)", () => {
    expect(decodeFilters("diyet:keto.vegan;alerjen:dairy;aci:7;x:y")).toEqual({
      diets: ["vegan"],
      excludeAllergens: [],
      maxSpice: null,
    });
    expect(decodeFilters(null)).toEqual({ diets: [], excludeAllergens: [], maxSpice: null });
    expect(encodeFilters({ diets: [], excludeAllergens: [], maxSpice: null })).toBe("");
  });

  it("hides products with an excluded allergen, warns about traces, keeps diet and spice limits", () => {
    const filters = { diets: [], excludeAllergens: ["nuts" as const], maxSpice: 1 as const };
    const item = {
      diets: [],
      allergens: [],
      mayContain: ["nuts" as const],
      spiceLevel: 0 as const,
    };
    expect(matchFilters(item, filters)).toEqual({ match: true, mayContain: ["nuts"] });
    expect(matchFilters({ ...item, allergens: ["nuts"] }, filters).match).toBe(false);
    expect(matchFilters({ ...item, spiceLevel: 2 }, filters).match).toBe(false);
    expect(
      matchFilters(item, { diets: ["vegan"], excludeAllergens: [], maxSpice: null }).match,
    ).toBe(false);
  });
});

describe("REQ-012: Turkish-aware search", () => {
  const items = [
    { name: "Mercimek çorbası", searchKey: toSearchKey("Mercimek çorbası kırmızı mercimek havuç") },
    { name: "İrmik helvası", searchKey: toSearchKey("İrmik helvası irmik tereyağı çam fıstığı") },
    { name: "Işık kahvesi", searchKey: toSearchKey("Işık kahvesi") },
  ];

  it.each([
    ["corba", ["Mercimek çorbası"]],
    ["ÇORBA", ["Mercimek çorbası"]],
    ["irmik", ["İrmik helvası"]],
    ["ışık", ["Işık kahvesi"]],
    ["ISIK", ["Işık kahvesi"]],
    ["mercimek havuç", ["Mercimek çorbası"]],
    ["mercimek fıstık", []],
  ])("%s → %o", (query, expected) => {
    expect(searchItems(items, query, 2)?.map((item) => item.name)).toEqual(expected);
  });

  it("below the minimum length there is no search yet (P-07)", () => {
    expect(searchItems(items, "ç", 2)).toBeNull();
    expect(searchItems(items, "  ", 2)).toBeNull();
  });
});

describe("REQ-013, BR-SEC-001: Seçtiklerim", () => {
  const now = new Date("2026-11-06T12:00:00Z");
  const latte = { itemId: "latte", priceId: "buyuk", optionIds: ["yulaf", "cift"] };

  it("is kept per venue, and the same choice is one line with a quantity", () => {
    expect(picksStorageKey("rakim")).toBe("kartela:secim:rakim");
    expect(pickKey("latte", "buyuk", ["yulaf", "cift"])).toBe(
      pickKey("latte", "buyuk", ["cift", "yulaf"]),
    );
    let picks = addPick([], latte, now);
    picks = addPick(picks, { ...latte, optionIds: ["cift", "yulaf"] }, now);
    expect(picks).toHaveLength(1);
    expect(picks[0]!.qty).toBe(2);
    picks = addPick(picks, { ...latte, optionIds: [] }, now);
    expect(picks).toHaveLength(2);
  });

  it("a quantity down to zero removes the line", () => {
    const picks = addPick([], latte, now);
    expect(changeQty(picks, picks[0]!.key, -1)).toEqual([]);
    expect(changeQty(picks, picks[0]!.key, 2)[0]!.qty).toBe(3);
  });

  it("BR-SEC-001: lines older than 24 hours are dropped", () => {
    const picks = addPick([], latte, new Date("2026-11-05T11:59:00Z"));
    expect(prunePicks(picks, now)).toEqual([]);
    expect(prunePicks(addPick([], latte, new Date("2026-11-05T12:00:00Z")), now)).toHaveLength(1);
  });

  it("unreadable storage is an empty list; a removed product is reported, not dropped", () => {
    expect(parseStoredPicks("{bozuk")).toEqual([]);
    expect(parseStoredPicks(JSON.stringify([{ itemId: 1 }]))).toEqual([]);
    const picks = addPick([], latte, now);
    expect(parseStoredPicks(JSON.stringify(picks))).toEqual(picks);
    expect(resolvePicks(picks, new Map())).toEqual([{ pick: picks[0], item: null }]);
  });
});

describe("BR-KRC-005: cache tags carry the venue", () => {
  it("one venue's tag never names another venue", () => {
    expect(venueTag("menu", "rakim")).toBe("menu:rakim");
    expect(venueTag("menu", "rakim")).not.toBe(venueTag("menu", "ornek"));
    expect(venueTag("stories", "rakim")).not.toBe(venueTag("menu", "rakim"));
  });
});
