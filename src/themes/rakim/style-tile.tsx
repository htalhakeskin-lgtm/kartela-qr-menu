"use client";

import type { VenueView } from "@/platform/menu/view";
import { StyleTile } from "@/platform/theme/base/style-tile";

import meta from "./meta";
import { rakimSlots } from "./slots";

/**
 * The theme's style tile (SCR-007): its tokens, type scale and slots on the venue's own products.
 * A client module of its own: in the same module as the quick menu, the tile's code rode along
 * with every menu page (D-15 measurement: about 10 KB gzip).
 */
export function RakimStyleTile({ venue }: { venue: VenueView }) {
  return <StyleTile venue={venue} meta={meta} slots={rakimSlots} />;
}
