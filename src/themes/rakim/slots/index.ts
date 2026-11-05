import { baseSlots, type QuickMenuSlots } from "@/platform/theme/base/slots";
import { lazySlot } from "@/platform/theme/lazy-slot";

import { RakimImageFallback, RakimItemCard } from "./item-card";
import { RakimPrice } from "./price";
import { RakimShell } from "./shell";

/**
 * Rakım's slots (ADR-0003, D-15): the base implementation with Rakım's top bar, ledger rows,
 * mono price and data card; the product panel with the recipe card (D-16). D-17 adds the bean
 * card and the brewing guide. Keşfet and Bilgi take theirs from page-slots.ts (K-44).
 */
export const rakimSlots: QuickMenuSlots = {
  ...baseSlots,
  Shell: RakimShell,
  ItemCard: RakimItemCard,
  Price: RakimPrice,
  ImageFallback: RakimImageFallback,
  // The panel and its recipe card load on first use, like the base sheets (D-12).
  ItemSheet: lazySlot(() => import("./item-sheet").then((m) => m.RakimItemSheet)),
  OptionPicker: lazySlot(() => import("./recipe-card").then((m) => m.RakimOptionPicker)),
};
