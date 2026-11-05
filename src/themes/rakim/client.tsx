"use client";

import type { VenueView } from "@/platform/menu/view";
import { baseSlots } from "@/platform/theme/base/slots";
import { StyleTile } from "@/platform/theme/base/style-tile";

import meta from "./meta";

/**
 * Rakım's client entry (ADR-0003). D-14: the style tile shows Rakım's tokens, type and the
 * base slots on its own products; D-15 / D-16 replace the slots Rakım redesigns.
 */
export function RakimStyleTile({ venue }: { venue: VenueView }) {
  return <StyleTile venue={venue} meta={meta} slots={baseSlots} />;
}
