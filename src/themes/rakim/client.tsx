"use client";

import type { VenueView } from "@/platform/menu/view";
import { QuickMenu } from "@/platform/theme/base/quick-menu";

import { rakimSlots } from "./slots";
import { RAKIM_ITEM_PHOTO } from "./slots/names";

/** Rakım's client entry (ADR-0003): the quick menu as a ledger (plan §11.5). */
export function RakimQuickMenu({ venue }: { venue: VenueView }) {
  return (
    <QuickMenu venue={venue} slots={rakimSlots} layout="liste" photoTransition={RAKIM_ITEM_PHOTO} />
  );
}
