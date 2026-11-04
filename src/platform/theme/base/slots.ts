import type { ThemeSlots } from "../contract";
import { BaseCategoryBar } from "./category-bar";
import { BaseImageFallback, BaseItemCard } from "./item-card";
import { BaseItemFacts } from "./item-facts";
import { BaseItemSheet } from "./item-sheet";
import { BaseOptionPicker } from "./option-picker";
import {
  BaseEmptyState,
  BaseFilterPanel,
  BaseLegalNote,
  BaseMenuNotice,
  BaseSearchField,
  BaseSectionHeader,
} from "./parts";
import { BasePicks } from "./picks";
import { BasePrice } from "./price";
import { BaseShell } from "./shell";

/**
 * The base implementation of every slot (ADR-0003): the ready-made theme Sade uses them as they
 * are; a custom theme spreads them and replaces the ones it redesigns. Story arrives with D-10.
 */
export const baseSlots: Omit<ThemeSlots, "Story"> = {
  Shell: BaseShell,
  CategoryBar: BaseCategoryBar,
  SectionHeader: BaseSectionHeader,
  SearchField: BaseSearchField,
  FilterPanel: BaseFilterPanel,
  ItemCard: BaseItemCard,
  ItemSheet: BaseItemSheet,
  Price: BasePrice,
  ItemFacts: BaseItemFacts,
  OptionPicker: BaseOptionPicker,
  Picks: BasePicks,
  MenuNotice: BaseMenuNotice,
  LegalNote: BaseLegalNote,
  EmptyState: BaseEmptyState,
  ImageFallback: BaseImageFallback,
};

export type QuickMenuSlots = typeof baseSlots;
