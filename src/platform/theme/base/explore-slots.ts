import type { ExploreSlots } from "./explore";
import { baseSlots } from "./slots";
import { BaseStory } from "./story";

/**
 * Keşfet's slots: the quick-menu slots plus Story. Kept apart from baseSlots so the story renderer
 * (react-markdown) is imported by server pages only and never reaches a quick menu bundle (K-34).
 */
export const baseExploreSlots: ExploreSlots = { ...baseSlots, Story: BaseStory };
