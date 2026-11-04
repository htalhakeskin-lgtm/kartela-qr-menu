import { z } from "zod";

import { parseMoney } from "../../lib/money";
import type { Locale } from "../tenant/registry-schema";
import type { IsoWeekday } from "./clock";
import { PRICE_UNITS, priceProblems } from "./price";
import { ALLERGENS, DIETS, ITEM_KINDS, ITEM_STATUSES, MENU_KINDS } from "./vocabulary";

/**
 * Menu content file of a venue: content/mekanlar/{ad}/menu.ts (plan §10, D-04). One typed file
 * with the venue's images, products and menus; `pnpm db:seed` validates it with this schema and
 * writes it to the database (src/server/db/tenant/seed-content.ts). The panel import (D-27) uses
 * the same schema, so a file and a spreadsheet obey the same rules.
 *
 * Build / server only: the menu pages never import this module (Zod stays out of their bundle).
 */

const slug = z
  .string()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "küçük harf, rakam ve tire (ör. mercimek-corbasi)");

const otherLanguage = z.string().trim().min(1).optional();

/** { tr, en, ar, … }: Turkish required, every text trimmed and non-empty (BR-MNU-003). */
export const translatedSchema = z
  .object({
    tr: z.string().trim().min(1, "Türkçe metin zorunlu"),
    en: otherLanguage,
    ar: otherLanguage,
    ru: otherLanguage,
    de: otherLanguage,
  } satisfies Record<Locale, z.ZodType>)
  .strict();

/** "240", "320,50", "1.850" → kuruş (BR-FYT-001); never Number() / parseFloat on money. */
const amount = z.string().transform((value, ctx) => {
  const minor = parseMoney(value);
  if (minor === null || minor < 0) {
    ctx.addIssue({ code: "custom", message: `Geçersiz tutar: "${value}"` });
    return z.NEVER;
  }
  return minor;
});

const percent = z.number().int().min(0).max(100);

const imageSchema = z
  .object({
    source: z.enum(["unsplash", "pexels"]),
    url: z
      .url()
      .refine(
        (url) =>
          url.startsWith("https://images.unsplash.com/") ||
          url.startsWith("https://images.pexels.com/"),
        "Stok görsel kaynağın CDN'inden gelir (K-16)",
      ),
    /** Pixel size of the original file (20-gorsel-kalite: never shown larger than it is). */
    width: z.number().int().positive(),
    height: z.number().int().positive(),
    photographer: z.string().trim().min(1),
    sourcePage: z.url(),
    license: z.string().trim().min(1).default("Unsplash License"),
    alt: translatedSchema,
    /** Focal point in percent of width / height, for crops. */
    focal: z.tuple([percent, percent]).optional(),
  })
  .strict();

const priceSchema = z
  .object({
    unit: z.enum(PRICE_UNITS).default("portion"),
    amount,
    label: translatedSchema.optional(),
    default: z.boolean().default(false),
  })
  .strict();

const nutritionSchema = z
  .object({
    fatG: z.number().min(0),
    saturatedFatG: z.number().min(0),
    carbsG: z.number().min(0),
    sugarG: z.number().min(0),
    proteinG: z.number().min(0),
    saltG: z.number().min(0),
  })
  .partial()
  .strict();

const itemSchema = z
  .object({
    slug,
    kind: z.enum(ITEM_KINDS).default("dish"),
    name: translatedSchema,
    description: translatedSchema.optional(),
    ingredients: translatedSchema.optional(),
    allergens: z.array(z.enum(ALLERGENS)).default([]),
    mayContain: z.array(z.enum(ALLERGENS)).default([]),
    diets: z.array(z.enum(DIETS)).default([]),
    spiceLevel: z.number().int().min(0).max(3).default(0),
    energyKcal: z.number().int().min(0).optional(),
    nutrition: nutritionSchema.optional(),
    portionG: z.number().int().positive().optional(),
    volumeMl: z.number().int().positive().optional(),
    origin: translatedSchema.optional(),
    /** Kind-specific facts (bean: region, altitude, process, notes …); D-14 adds per-kind schemas. */
    attributes: z.record(z.string(), z.unknown()).default({}),
    /** Strength in tenths of a percent: 45 = 4,5 % (BR-YSL-004). */
    alcohol: z
      .object({ brand: z.string().trim().min(1), abvTenths: z.number().int().min(1) })
      .optional(),
    /** Key in `images`; no image is a first-class state (plan K-23). */
    image: z.string().optional(),
    status: z.enum(ITEM_STATUSES).default("published"),
    /** At least one line; without an explicit default the first line is the default. */
    prices: z.array(priceSchema).min(1),
  })
  .strict()
  .transform((item) => ({
    ...item,
    prices: item.prices.map((line, index) => ({
      ...line,
      default: item.prices.some((other) => other.default) ? line.default : index === 0,
    })),
  }))
  .superRefine((item, ctx) => {
    const lines = item.prices.map((line) => ({
      unit: line.unit,
      amountMinor: line.amount,
      label: line.label,
      isDefault: line.default,
    }));
    for (const problem of priceProblems(lines)) {
      ctx.addIssue({ code: "custom", path: ["prices"], message: `Fiyat satırları: ${problem}` });
    }
  });

/** A product in a section: its slug, or { item, featured }. */
const placementSchema = z
  .union([slug, z.object({ item: slug, featured: z.boolean().default(false) }).strict()])
  .transform((value) => (typeof value === "string" ? { item: value, featured: false } : value));

const clock = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "HH:MM");
const monthDay = z.string().regex(/^(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/, "MM-DD");

const scheduleSchema = z
  .object({
    days: z
      .array(z.number().int().min(1).max(7))
      .min(1)
      .transform((days) => days as IsoWeekday[])
      .optional(),
    windows: z
      .array(
        z
          .object({ start: clock, end: clock })
          .strict()
          .refine((window) => window.start !== window.end, "Başlangıç ve bitiş aynı olamaz"),
      )
      .min(1)
      .optional(),
    seasons: z
      .array(z.object({ from: monthDay, to: monthDay }).strict())
      .min(1)
      .optional(),
  })
  .strict();

const subSectionSchema = z
  .object({
    name: translatedSchema,
    description: translatedSchema.optional(),
    layoutHint: z.string().optional(),
    items: z.array(placementSchema).default([]),
  })
  .strict();

/** Two levels at most: a sub-section has no children of its own (the schema has no field). */
const sectionSchema = subSectionSchema.extend({ children: z.array(subSectionSchema).default([]) });

const menuSchema = z
  .object({
    slug,
    kind: z.enum(MENU_KINDS).default("all_day"),
    name: translatedSchema,
    schedule: scheduleSchema.optional(),
    outsideWindow: z.enum(["dim", "hide"]).default("dim"),
    sections: z.array(sectionSchema).min(1),
  })
  .strict();

export const menuContentSchema = z
  .object({
    images: z.record(slug, imageSchema).default({}),
    items: z.array(itemSchema).min(1),
    menus: z.array(menuSchema).min(1),
  })
  .strict()
  .superRefine((content, ctx) => {
    const itemSlugs = new Set<string>();
    content.items.forEach((item, index) => {
      if (itemSlugs.has(item.slug)) {
        ctx.addIssue({
          code: "custom",
          path: ["items", index, "slug"],
          message: `Tekrarlanan ürün: ${item.slug}`,
        });
      }
      itemSlugs.add(item.slug);
      if (item.image !== undefined && !(item.image in content.images)) {
        ctx.addIssue({
          code: "custom",
          path: ["items", index, "image"],
          message: `Kayıtsız görsel: ${item.image}`,
        });
      }
    });

    const menuSlugs = new Set<string>();
    content.menus.forEach((menu, menuIndex) => {
      if (menuSlugs.has(menu.slug)) {
        ctx.addIssue({
          code: "custom",
          path: ["menus", menuIndex, "slug"],
          message: `Tekrarlanan menü: ${menu.slug}`,
        });
      }
      menuSlugs.add(menu.slug);
      const checkSection = (section: { items: { item: string }[] }, path: (string | number)[]) => {
        const seen = new Set<string>();
        section.items.forEach((placement, index) => {
          if (!itemSlugs.has(placement.item)) {
            ctx.addIssue({
              code: "custom",
              path: [...path, "items", index],
              message: `Kayıtsız ürün: ${placement.item}`,
            });
          }
          if (seen.has(placement.item)) {
            ctx.addIssue({
              code: "custom",
              path: [...path, "items", index],
              message: `Bölümde iki kez: ${placement.item}`,
            });
          }
          seen.add(placement.item);
        });
      };
      menu.sections.forEach((section, sectionIndex) => {
        const path = ["menus", menuIndex, "sections", sectionIndex];
        checkSection(section, path);
        section.children.forEach((child, childIndex) => {
          checkSection(child, [...path, "children", childIndex]);
        });
      });
    });
  });

export type MenuContentInput = z.input<typeof menuContentSchema>;
export type MenuContent = z.output<typeof menuContentSchema>;

/** Typed helper for content/mekanlar/{ad}/menu.ts; validation happens when the seed reads it. */
export function defineMenuContent(content: MenuContentInput): MenuContentInput {
  return content;
}

/** Validates a content file and throws with every problem and its path. */
export function parseMenuContent(venue: string, input: unknown): MenuContent {
  const parsed = menuContentSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error(`${venue} menü içeriği geçersiz:\n${z.prettifyError(parsed.error)}`);
  }
  return parsed.data;
}
