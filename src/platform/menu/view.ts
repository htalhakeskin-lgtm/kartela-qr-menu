import { toSearchKey } from "../../lib/text";
import { localize, type Localized, localizeOptional, type Translated } from "../i18n/fallback";
import type { Locale, VenueKind } from "../tenant/registry-schema";
import type { ItemAvailability } from "./availability";
import { type InfoGap, infoGaps } from "./completeness";
import type { ConfigGroup, ConfigRule } from "./configurator";
import { priceText, type PriceUnit } from "./price";
import type { MenuSchedule, OutsideWindow } from "./schedule";
import type {
  MediaAsset,
  MenuItem,
  MenuSection,
  OpeningHours,
  Story,
  VenueInfo,
  VenueMenu,
} from "./types";
import type { Allergen, Diet, ItemKind, MenuKind, SpiceLevel, StoryKind } from "./vocabulary";

/**
 * The view model a theme renders (ADR-0003, D-08): one venue's menu prepared on the server for one
 * page language. Every text is already localized and carries the language it is shown in (a
 * fallback is marked with lang="…", BR-MNU-003); prices are written with their unit; missing
 * product information is flagged (BR-YSL-005). Time is not applied here: the page is static, the
 * browser runs menuStatus() / availabilityStatus() (ADR-0005). Plain data, serializable as props.
 */

/** A localized text and its language (differs from the page language when it fell back). */
export type Text = Localized;

export type ImageView = {
  src: string;
  width: number;
  height: number;
  alt: Text;
  focalX: number;
  focalY: number;
};

export type PriceView = {
  id: string;
  unit: PriceUnit;
  amountMinor: number;
  label: string | null;
  /** The label in the venue's default language ("show the waiter", REQ-013). */
  defaultLabel: string | null;
  amount: string;
  isDefault: boolean;
};

export type ItemView = {
  id: string;
  slug: string;
  kind: ItemKind;
  name: Text;
  /** The name in the venue's default language: the waiter reads it (REQ-013, SCR-004). */
  defaultName: string;
  description: Text | null;
  ingredients: Text | null;
  origin: Text | null;
  allergens: Allergen[];
  mayContain: Allergen[];
  diets: Diet[];
  spiceLevel: SpiceLevel;
  energyKcal: number | null;
  portionG: number | null;
  volumeMl: number | null;
  nutrition: MenuItem["nutrition"];
  alcohol: MenuItem["alcohol"];
  attributes: Record<string, unknown>;
  image: ImageView | null;
  prices: PriceView[];
  /** The line a compact row shows. */
  defaultPrice: PriceView | null;
  /** Configurator data stays raw (names as { tr, en … }): the theme localizes with t(). */
  optionGroups: ConfigGroup[];
  optionRules: ConfigRule[];
  availability: ItemAvailability | null;
  pairings: { itemId: string; note: Text | null }[];
  suggestions: string[];
  components: { itemId: string; qty: number }[];
  courses: { no: number; title: Text; itemId: string | null; description: Text | null }[];
  infoGaps: InfoGap[];
  /** Turkish-aware search key over name, description and ingredients (useMenuSearch). */
  searchKey: string;
};

export type SectionView = {
  id: string;
  name: Text;
  description: Text | null;
  layoutHint: string | null;
  items: { itemId: string; featured: boolean }[];
  children: SectionView[];
};

export type MenuView = {
  id: string;
  slug: string;
  kind: MenuKind;
  name: Text;
  schedule: MenuSchedule | null;
  outsideWindow: OutsideWindow;
  access: "public" | "password";
  contexts: string[];
  sections: SectionView[];
  daily: { onDate: string; itemId: string }[];
};

export type StoryView = {
  id: string;
  slug: string;
  kind: StoryKind;
  collection: string | null;
  stop: number | null;
  title: Text;
  summary: Text | null;
  /** Markdown in `body.lang`; rendered on the server by StoryMarkdown (K-34). */
  body: Text;
  cover: ImageView | null;
  gallery: ImageView[];
  itemIds: string[];
};

/** The information page, localized (SCR-005). Phones stay E.164; the page formats them. */
export type InfoView = {
  description: Text | null;
  address: string | null;
  mapUrl: string | null;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  hours: OpeningHours;
  wifi: { network: string; password: string | null } | null;
  faq: { q: Text; a: Text }[];
  allergenStatement: Text | null;
};

export type VenueView = {
  slug: string;
  name: string;
  kind: VenueKind;
  mode: "demo" | "live";
  locale: Locale;
  defaultLocale: Locale;
  locales: Locale[];
  dir: "ltr" | "rtl";
  timeZone: string;
  menus: MenuView[];
  /** Every published product once, menu order first. */
  items: ItemView[];
  stories: StoryView[];
  info: InfoView | null;
};

export type VenueFacts = {
  slug: string;
  name: string;
  kind: VenueKind;
  mode: "demo" | "live";
  defaultLocale: Locale;
  locales: Locale[];
  timeZone: string;
};

export type VenueViewInput = {
  venue: VenueFacts;
  menu: VenueMenu;
  stories: Story[];
  media: Record<string, MediaAsset>;
  info?: VenueInfo | null;
};

/** Field translation for themes: t(item.name, locale) on raw { tr, en … } data (configurator). */
export function t(field: Translated, locale: Locale, defaultLocale: Locale = "tr"): Text {
  return localize(field, locale, defaultLocale);
}

export function buildVenueView(
  input: VenueViewInput,
  locale: Locale,
  options: { rtl: boolean },
): VenueView {
  const { venue } = input;
  const fallback = venue.defaultLocale;
  const text = (field: Translated) => localize(field, locale, fallback);
  const optional = (field: Translated | null) => localizeOptional(field, locale, fallback);
  const image = (id: string | null): ImageView | null => {
    const asset = id ? input.media[id] : undefined;
    return asset
      ? {
          src: asset.url,
          width: asset.width,
          height: asset.height,
          alt: text(asset.alt),
          focalX: asset.focalX,
          focalY: asset.focalY,
        }
      : null;
  };

  const items = input.menu.items.map((item): ItemView => {
    const prices = item.prices.map((line) => {
      const written = priceText(line, locale, fallback);
      return {
        id: line.id,
        unit: line.unit,
        amountMinor: line.amountMinor,
        label: written.label,
        defaultLabel: priceText(line, fallback, fallback).label,
        amount: written.amount,
        isDefault: line.isDefault,
      };
    });
    const name = text(item.name);
    const description = optional(item.description);
    const ingredients = optional(item.ingredients);
    return {
      id: item.id,
      slug: item.slug,
      kind: item.kind,
      name,
      defaultName: localize(item.name, fallback, fallback).text,
      description,
      ingredients,
      origin: optional(item.origin),
      allergens: item.allergens,
      mayContain: item.mayContain,
      diets: item.diets,
      spiceLevel: item.spiceLevel,
      energyKcal: item.energyKcal,
      portionG: item.portionG,
      volumeMl: item.volumeMl,
      nutrition: item.nutrition,
      alcohol: item.alcohol,
      attributes: item.attributes,
      image: image(item.imageId),
      prices,
      defaultPrice: prices.find((line) => line.isDefault) ?? prices[0] ?? null,
      optionGroups: item.optionGroups,
      optionRules: item.optionRules,
      availability: item.availability,
      pairings: item.pairings.map((pairing) => ({
        itemId: pairing.itemId,
        note: optional(pairing.note),
      })),
      suggestions: item.suggestions,
      components: item.components,
      courses: item.courses.map((course) => ({
        no: course.no,
        title: text(course.title),
        itemId: course.itemId,
        description: optional(course.description),
      })),
      infoGaps: infoGaps(item),
      searchKey: toSearchKey(
        [name.text, description?.text ?? "", ingredients?.text ?? ""].join(" "),
      ),
    };
  });

  const section = (source: MenuSection): SectionView => ({
    id: source.id,
    name: text(source.name),
    description: optional(source.description),
    layoutHint: source.layoutHint,
    items: source.items.map((placement) => ({
      itemId: placement.item.id,
      featured: placement.featured,
    })),
    children: source.children.map(section),
  });

  return {
    slug: venue.slug,
    name: venue.name,
    kind: venue.kind,
    mode: venue.mode,
    locale,
    defaultLocale: venue.defaultLocale,
    locales: venue.locales,
    dir: options.rtl ? "rtl" : "ltr",
    timeZone: venue.timeZone,
    menus: input.menu.menus.map((menu) => ({
      id: menu.id,
      slug: menu.slug,
      kind: menu.kind,
      name: text(menu.name),
      schedule: menu.schedule,
      outsideWindow: menu.outsideWindow,
      access: menu.access,
      contexts: menu.contexts,
      sections: menu.sections.map(section),
      daily: menu.daily,
    })),
    items,
    info: input.info
      ? {
          description: optional(input.info.description),
          address: input.info.address,
          mapUrl: input.info.mapUrl,
          phone: input.info.phone,
          whatsapp: input.info.whatsapp,
          email: input.info.email,
          hours: input.info.hours,
          wifi: input.info.wifi,
          faq: input.info.faq.map((entry) => ({ q: text(entry.q), a: text(entry.a) })),
          allergenStatement: optional(input.info.allergenStatement),
        }
      : null,
    stories: input.stories.map((story) => ({
      id: story.id,
      slug: story.slug,
      kind: story.kind,
      collection: story.collection,
      stop: story.stop,
      title: text(story.title),
      summary: optional(story.summary),
      body: text(story.body),
      cover: image(story.coverId),
      gallery: story.galleryIds.flatMap((id) => {
        const view = image(id);
        return view ? [view] : [];
      }),
      itemIds: story.itemIds,
    })),
  };
}

/** Items by id, for slot components that receive ids (sections, pairings, picks). */
export function itemIndex(view: Pick<VenueView, "items">): Map<string, ItemView> {
  return new Map(view.items.map((item) => [item.id, item]));
}
