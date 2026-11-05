import { baseSlots, type QuickMenuSlots } from "@/platform/theme/base/slots";

import { RakimImageFallback, RakimItemCard, RakimPrice } from "./item-card";
import { RakimShell } from "./shell";

/**
 * Rakım's slots (ADR-0003, D-15): the base implementation with Rakım's top bar, ledger rows,
 * mono price and data card. D-16 replaces the product panel with the recipe card; D-17 the bean
 * card and the brewing guide. Keşfet and Bilgi take theirs from page-slots.ts (K-44).
 */
export const rakimSlots: QuickMenuSlots = {
  ...baseSlots,
  Shell: RakimShell,
  ItemCard: RakimItemCard,
  Price: RakimPrice,
  ImageFallback: RakimImageFallback,
};
