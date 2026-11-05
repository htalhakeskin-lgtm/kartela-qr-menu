import type { MenuContentInput, StoryInput, VenueInfoInput } from "../../src/platform/menu/content";
import ornekInfo from "./_ornek/bilgi";
import ornekStories from "./_ornek/hikayeler";
import ornekMenu from "./_ornek/menu";
import rakimInfo from "./rakim/bilgi";
import rakimStories from "./rakim/hikayeler";
import rakimMenu from "./rakim/menu";

/**
 * Content files by venue slug (D-04, D-07). Kept apart from index.ts so next.config.ts, which
 * imports the venue registry for the host map, never loads menu content. `folder` is the venue's
 * folder under content/mekanlar (story bodies: {folder}/hikayeler/{slug}.{dil}.md). A venue
 * without content gets no menu.
 */
export type VenueContentEntry = {
  folder: string;
  menu: MenuContentInput;
  stories?: readonly StoryInput[];
  info?: VenueInfoInput;
};

export const venueContents: Readonly<Record<string, VenueContentEntry>> = {
  rakim: { folder: "rakim", menu: rakimMenu, stories: rakimStories, info: rakimInfo },
  ornek: { folder: "_ornek", menu: ornekMenu, stories: ornekStories, info: ornekInfo },
};
