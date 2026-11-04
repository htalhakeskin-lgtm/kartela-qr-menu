import type { MenuContentInput } from "../../src/platform/menu/content";
import ornek from "./_ornek/menu";

/**
 * Menu content files by venue slug (D-04). Kept apart from index.ts so next.config.ts, which
 * imports the venue registry for the host map, never loads menu content. Rakım's menu arrives
 * with its image pool in D-14; a venue without content simply gets no menu from the seed.
 */
export const venueContents: Readonly<Record<string, MenuContentInput>> = {
  ornek,
};
