import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

import type { VenueView } from "@/platform/menu/view";
import { itemIndex } from "@/platform/menu/view";
import { loadVenueContent } from "@/server/content/venue-content";
import { seedVenueContent } from "@/server/db/tenant/seed-content";
import { getVenueView } from "@/server/menu/venue-view";

import { createVenue, removeVenues, type TestVenue } from "../tenant/fixtures";

/**
 * D-08: getVenueView reads a venue from the database and returns its theme's view model. The
 * "use cache" directive and cache tags are Next.js runtime features (no-ops here); the database,
 * row level security and the content are real.
 */
vi.mock("next/cache", () => ({ cacheLife: () => undefined, cacheTag: () => undefined }));

describe("getVenueView: database → view model", () => {
  let venue: TestVenue;
  let ar: VenueView;

  beforeAll(async () => {
    venue = await createVenue("gorunum");
    await seedVenueContent(venue.id, (await loadVenueContent("ornek"))!);
    ar = (await getVenueView(venue.slug, "ar"))!;
  });

  afterAll(async () => {
    await removeVenues([venue.id]);
  });

  it("returns the venue's menus and published products in the page language", () => {
    expect(ar.locale).toBe("ar");
    expect(ar.dir).toBe("rtl");
    expect(ar.menus.map((m) => m.slug)).toEqual(["gunun-yemekleri", "gunun-menusu", "kahvalti"]);
    expect(ar.items).toHaveLength(14); // 15 products, one draft
    const soup = ar.items.find((item) => item.slug === "ezogelin-corbasi")!;
    expect(soup.name).toMatchObject({ text: "شوربة إيزوجلين", lang: "ar" });
    expect(soup.description).toMatchObject({ lang: "tr", fallback: true });
  });

  it("carries photos, stories, the daily menu and the configurator data", async () => {
    const cortado = ar.items.find((item) => item.slug === "cortado")!;
    const content = (await loadVenueContent("ornek"))!;
    expect(cortado.image?.src).toBe(content.images["cortado-cam-bardak"]!.url);
    expect(cortado.optionGroups.map((g) => g.key)).toEqual(["sut", "ekstra"]);
    expect(ar.stories).toHaveLength(4);
    expect(ar.menus[1]!.daily.length).toBeGreaterThan(0);
    expect(ar.items.every((item) => item.infoGaps.length === 0 || item.kind === "tasting")).toBe(
      true,
    );
    expect(itemIndex(ar).size).toBe(14);
  });

  it("a venue that is not in the database has no view (the page answers 404)", async () => {
    expect(await getVenueView("yok-boyle-bir-mekan", "tr")).toBeNull();
  });
});
