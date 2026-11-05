"use client";

import type { VenueView } from "@/platform/menu/view";
import { QuickMenu } from "@/platform/theme/base/quick-menu";
import { baseSlots } from "@/platform/theme/base/slots";
import { StyleTile } from "@/platform/theme/base/style-tile";

import meta from "./meta";

/**
 * Sade's client entry (ADR-0003): the quick menu with the base slots as they are. A venue's
 * layout choice (liste / kart / izgara) comes from its theme configuration in D-39; until then
 * "liste", or ?yerlesim= for review.
 */
export function SadeQuickMenu({ venue }: { venue: VenueView }) {
  return <QuickMenu venue={venue} slots={baseSlots} layout="liste" />;
}

/** Sade's style tile (SCR-007): its tokens, type scale and slots on the venue's own products. */
export function SadeStyleTile({ venue }: { venue: VenueView }) {
  return <StyleTile venue={venue} meta={meta} slots={baseSlots} />;
}
