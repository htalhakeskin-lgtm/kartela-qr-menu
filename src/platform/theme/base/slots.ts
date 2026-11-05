import type { ThemeSlots } from "../contract";
import { lazySlot } from "../lazy-slot";
import { BaseCategoryBar } from "./category-bar";
import { BaseImageFallback, BaseItemCard } from "./item-card";
import {
  BaseEmptyState,
  BaseLegalNote,
  BaseMenuNotice,
  BaseSearchField,
  BaseSectionHeader,
} from "./parts";
import { BasePrice } from "./price";
import { BaseShell } from "./shell";

/**
 * The base implementation of every slot (ADR-0003): the ready-made theme Sade uses them as they
 * are; a custom theme spreads them and replaces the ones it redesigns. Story arrives with D-10.
 *
 * The sheets (product panel with its configurator and facts, Seçtiklerim, filters) load on first
 * use (D-12): the quick menu wraps them in Suspense and preloads them after the first paint.
 */
export const baseSlots: Omit<ThemeSlots, "Story"> = {
  Shell: BaseShell,
  CategoryBar: BaseCategoryBar,
  SectionHeader: BaseSectionHeader,
  SearchField: BaseSearchField,
  FilterPanel: lazySlot(() => import("./filter-panel").then((m) => m.BaseFilterPanel)),
  ItemCard: BaseItemCard,
  ItemSheet: lazySlot(() => import("./item-sheet").then((m) => m.BaseItemSheet)),
  Price: BasePrice,
  ItemFacts: lazySlot(() => import("./item-facts").then((m) => m.BaseItemFacts)),
  OptionPicker: lazySlot(() => import("./option-picker").then((m) => m.BaseOptionPicker)),
  Picks: lazySlot(() => import("./picks").then((m) => m.BasePicks)),
  MenuNotice: BaseMenuNotice,
  LegalNote: BaseLegalNote,
  EmptyState: BaseEmptyState,
  ImageFallback: BaseImageFallback,
};

export type QuickMenuSlots = typeof baseSlots;
