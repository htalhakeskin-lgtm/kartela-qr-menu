import type { ExploreSlots } from "./explore";
import { BaseEmptyState, BaseLegalNote } from "./parts";
import { BaseShell } from "./shell";
import { BaseStory } from "./story";

/**
 * Keşfet's slots, named one by one rather than spread from baseSlots: Next.js puts every client
 * component a route's server modules import into that route's JavaScript, so the quick menu's
 * sheets, picks and cards would load on Keşfet too (D-12 measurement: 17.6 KB gzip). Story stays
 * on the server (react-markdown never reaches a bundle, K-34).
 */
export const baseExploreSlots: ExploreSlots = {
  Shell: BaseShell,
  EmptyState: BaseEmptyState,
  LegalNote: BaseLegalNote,
  Story: BaseStory,
};
