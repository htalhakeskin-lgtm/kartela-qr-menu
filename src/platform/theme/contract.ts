import type { ComponentType, ReactNode } from "react";

import type { MenuFilters } from "../menu/filters";
import type { MenuStatus } from "../menu/schedule";
import type {
  ItemView,
  MenuView,
  PriceView,
  SectionView,
  StoryView,
  VenueView,
} from "../menu/view";
import type { ThemeId } from "../tenant/registry-schema";

/**
 * Theme contract (ADR-0003, D-08). A theme is a route subtree with its own root layout plus a
 * module that satisfies ThemeModule: tokens, motion, slots and venue metadata. The ready-made
 * theme Sade implements every slot (D-09, D-10); a custom theme replaces only what it redesigns.
 * Later slices add print components (D-29) and per-venue configuration (D-39).
 */

/** Colour tokens every theme provides; the theme's CSS declares the same values (conformance test). */
export interface ThemeTokens {
  color: {
    background: string;
    surface: string;
    surfaceMuted: string;
    foreground: string;
    mutedForeground: string;
    border: string;
    primary: string;
    primaryForeground: string;
    /** At most a tenth of the screen (GK-05). */
    accent: string;
    accentForeground: string;
    soldOut: string;
    focus: string;
  };
}

/** Times of day the pre-paint script writes to <html data-gun-dilimi> (venue time zone). */
export const DAYPARTS = ["sabah", "ogle", "aksam", "gece"] as const;
export type Daypart = (typeof DAYPARTS)[number];

export type TokenVariants = {
  /** The dark / evening set: prefers-color-scheme: dark and, where the theme says so, dayparts. */
  dark?: ThemeTokens["color"];
  /** Dayparts that switch to the dark set (Rakım: evening and night, plan §11.2). */
  darkDayparts?: readonly Daypart[];
};

/** Signature motion settings. Under prefers-reduced-motion everything is off, whatever the theme. */
export interface MotionPreset {
  enter: "none" | "fade" | "rise";
  sheet: "ease" | "spring";
  /** Price digits slide when the total changes (transform / opacity only, K-28). */
  priceTick: boolean;
}

export type QuickLayout = "liste" | "kart" | "izgara";
export type ExploreLayout = "akis" | "dergi";
export type ViewMode = "hizli" | "kesfet";

export type ShellProps = { venue: VenueView; view: ViewMode; children: ReactNode };
export type CategoryBarProps = { sections: Pick<SectionView, "id" | "name">[] };
export type SectionHeaderProps = { section: SectionView };
export type SearchFieldProps = { value: string; onChange: (value: string) => void };
export type FilterPanelProps = { filters: MenuFilters; onChange: (filters: MenuFilters) => void };
export type ItemCardProps = {
  item: ItemView;
  variant: "satir" | "kart" | "one-cikan";
  venue: VenueView;
};
export type ItemSheetProps = { item: ItemView; venue: VenueView; onClose: () => void };
export type PriceProps = { price: PriceView };
export type ItemFactsProps = { item: ItemView; venue: VenueView };
export type OptionPickerProps = { item: ItemView; venue: VenueView };
export type PicksProps = { venue: VenueView };
export type StoryProps = { story: StoryView; venue: VenueView };
export type MenuNoticeProps = { menu: MenuView; status: MenuStatus; venue: VenueView };
export type LegalNoteProps = { venue: VenueView };
export type EmptyStateProps = { reason: "search" | "filter" | "menu" | "daily"; venue: VenueView };
export type ImageFallbackProps = { item: ItemView; venue: VenueView };

/** View slots: Sade provides the base implementation of each; a theme overrides some. */
export interface ThemeSlots {
  Shell: ComponentType<ShellProps>;
  CategoryBar: ComponentType<CategoryBarProps>;
  SectionHeader: ComponentType<SectionHeaderProps>;
  SearchField: ComponentType<SearchFieldProps>;
  FilterPanel: ComponentType<FilterPanelProps>;
  ItemCard: ComponentType<ItemCardProps>;
  ItemSheet: ComponentType<ItemSheetProps>;
  Price: ComponentType<PriceProps>;
  ItemFacts: ComponentType<ItemFactsProps>;
  OptionPicker: ComponentType<OptionPickerProps>;
  Picks: ComponentType<PicksProps>;
  Story: ComponentType<StoryProps>;
  MenuNotice: ComponentType<MenuNoticeProps>;
  LegalNote: ComponentType<LegalNoteProps>;
  EmptyState: ComponentType<EmptyStateProps>;
  ImageFallback: ComponentType<ImageFallbackProps>;
}

/** The light half of a theme module: no components, safe to import anywhere (venue files, tests). */
export interface ThemeMeta {
  id: ThemeId;
  kind: "hazir" | "ozel";
  version: string;
  supports: {
    rtl: boolean;
    layouts: { quick: readonly QuickLayout[]; explore: readonly ExploreLayout[] };
  };
  tokens: ThemeTokens;
  tokenVariants?: TokenVariants;
  motion: MotionPreset;
}

export interface ThemeModule extends ThemeMeta {
  slots: Partial<ThemeSlots>;
}

/** Typed helpers for src/themes/{id}/meta.ts and index.ts. */
export const defineThemeMeta = <T extends ThemeMeta>(meta: T): T => meta;
export const defineTheme = <T extends ThemeModule>(theme: T): T => theme;
