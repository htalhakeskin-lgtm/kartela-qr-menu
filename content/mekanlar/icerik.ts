import type { MenuContentInput, StoryInput } from "../../src/platform/menu/content";
import ornekStories from "./_ornek/hikayeler";
import ornekMenu from "./_ornek/menu";

/**
 * Content files by venue slug (D-04, D-07). Kept apart from index.ts so next.config.ts, which
 * imports the venue registry for the host map, never loads menu content. `folder` is the venue's
 * folder under content/mekanlar (story bodies: {folder}/hikayeler/{slug}.{dil}.md). Rakım's menu
 * and stories arrive with its image pool in D-14; a venue without content gets no menu.
 */
export type VenueContentEntry = {
  folder: string;
  menu: MenuContentInput;
  stories?: readonly StoryInput[];
};

export const venueContents: Readonly<Record<string, VenueContentEntry>> = {
  ornek: { folder: "_ornek", menu: ornekMenu, stories: ornekStories },
};
