import type { ExploreSlots } from "@/platform/theme/base/explore";
import type { InfoSlots } from "@/platform/theme/base/info";
import { BaseEmptyState, BaseLegalNote } from "@/platform/theme/base/parts";
import { BaseStory } from "@/platform/theme/base/story";

import { RakimShell } from "./shell";

/**
 * The slots of Rakım's Keşfet and information pages, named one by one in a module of their own:
 * a page bundles every client component the modules it imports reference, so these must not sit
 * next to the quick menu's slot object (K-44; D-15 measurement: +17 KB on /bilgi).
 */
export const rakimExploreSlots: ExploreSlots = {
  Shell: RakimShell,
  EmptyState: BaseEmptyState,
  LegalNote: BaseLegalNote,
  Story: BaseStory,
};

export const rakimInfoSlots: InfoSlots = { Shell: RakimShell, LegalNote: BaseLegalNote };
