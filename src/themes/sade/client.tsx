"use client";

import type { VenueView } from "@/platform/menu/view";
import { QuickMenu } from "@/platform/theme/base/quick-menu";
import { baseSlots } from "@/platform/theme/base/slots";

/**
 * Sade's client entry (ADR-0003): the quick menu with the base slots as they are. A venue's
 * layout choice (liste / kart / izgara) comes from its theme configuration in D-39; until then
 * "liste", or ?yerlesim= for review.
 */
export function SadeQuickMenu({ venue }: { venue: VenueView }) {
  return <QuickMenu venue={venue} slots={baseSlots} layout="liste" />;
}
