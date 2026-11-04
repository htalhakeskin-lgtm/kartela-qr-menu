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

/** Option price deltas may be negative ("-10": no milk). */
const delta = z.string().transform((value, ctx) => {
  const minor = parseMoney(value, { allowNegative: true });
  if (minor === null) {
    ctx.addIssue({ code: "custom", message: `Geçersiz tutar: "${value}"` });
    return z.NEVER;
  }
  return minor;
});

const percent = z.number().int().min(0).max(100);

const optionSchema = z
  .object({
    key: slug,
    name: translatedSchema,
    delta: delta.default(0),
    allergens: z.array(z.enum(ALLERGENS)).default([]),
    dietsRemoved: z.array(z.enum(DIETS)).default([]),
    default: z.boolean().default(false),
    available: z.boolean().default(true),
  })
  .strict();

/** A venue-wide option group ("Süt seçimi"); min ≥ 1 makes it required (BR-SCN-001). */
const optionGroupSchema = z
  .object({
    name: translatedSchema,
    min: z.number().int().min(0).default(0),
    max: z.number().int().min(1).default(1),
    options: z.array(optionSchema).min(1),
  })
  .strict()
  .superRefine((group, ctx) => {
    if (group.min > group.max)
      ctx.addIssue({ code: "custom", path: ["min"], message: "min, max'tan büyük olamaz" });
    if (group.min > group.options.length) {
      ctx.addIssue({
        code: "custom",
        path: ["min"],
        message: "min, seçenek sayısından büyük olamaz",
      });
    }
    const keys = group.options.map((option) => option.key);
    if (new Set(keys).size !== keys.length) {
      ctx.addIssue({ code: "custom", path: ["options"], message: "Tekrarlanan seçenek anahtarı" });
    }
    if (group.options.filter((option) => option.default).length > group.max) {
      ctx.addIssue({
        code: "custom",
        path: ["options"],
        message: "Varsayılan seçenek sayısı max'ı aşıyor",
      });
    }
  });

/** A group on a product, with optional limit overrides and price lines it applies to. */
const itemOptionSchema = z
  .object({
    group: slug,
    min: z.number().int().min(0).optional(),
    max: z.number().int().min(1).optional(),
    appliesTo: z.array(slug).min(1).optional(),
  })
  .strict();

/** "group.option" or "group" (any option of it). */
const optionRef = z.string().regex(/^[a-z0-9-]+(\.[a-z0-9-]+)?$/, "grup ya da grup.secenek");

/** BR-SCN-003: when `when` is chosen, `excludes` cannot be / `requires` must be chosen. */
const ruleSchema = z
  .object({
    /** Limit the rule to one product; without it the rule holds wherever the option appears. */
    item: slug.optional(),
    when: optionRef,
    excludes: optionRef.optional(),
    requires: optionRef.optional(),
    message: translatedSchema.optional(),
  })
  .strict()
  .refine((rule) => (rule.excludes === undefined) !== (rule.requires === undefined), {
    message: "Kural ya excludes ya da requires taşır",
  })
  .refine((rule) => rule.when.includes("."), {
    message: "when bir seçenek olmalı (grup.secenek)",
    path: ["when"],
  });

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
    /** Name an option group link can point at (appliesTo: ["buyuk"]). */
    key: slug.optional(),
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

const clock = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "HH:MM");
const monthDay = z.string().regex(/^(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/, "MM-DD");

const month = z.number().int().min(1).max(12);

/** BR-MST-001…004; the seed turns "today" and remainingToday into instants and dates. */
const availabilitySchema = z
  .object({
    /** "today": until the next 04:00 (P-01); "indefinite": until the panel clears it. */
    soldOut: z.enum(["today", "indefinite"]).optional(),
    dailyLimit: z.number().int().min(1).optional(),
    remainingToday: z.number().int().min(0).optional(),
    releaseTimes: z.array(clock).min(1).optional(),
    seasons: z
      .array(z.object({ from: month, to: month }).strict())
      .min(1)
      .optional(),
    outsideSeason: z.enum(["dim", "hide"]).default("dim"),
  })
  .strict()
  .refine(
    (value) =>
      value.remainingToday === undefined ||
      (value.dailyLimit !== undefined && value.remainingToday <= value.dailyLimit),
    { message: "remainingToday için dailyLimit gerekir ve onu aşamaz", path: ["remainingToday"] },
  );

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
    /** Configurator groups of this product, in order (D-05). */
    options: z.array(itemOptionSchema).default([]),
    availability: availabilitySchema.optional(),
    /** "Yanına" pairings and suggestions (D-06, BR-ILS-001). */
    pairings: z
      .array(z.object({ item: slug, note: translatedSchema.optional() }).strict())
      .default([]),
    suggestions: z.array(slug).default([]),
    /** Kind "set": what it contains. */
    components: z
      .array(z.object({ item: slug, qty: z.number().int().min(1).default(1) }).strict())
      .default([]),
    /** Kind "tasting": the ordered courses; a course may point at a product. */
    courses: z
      .array(
        z
          .object({
            title: translatedSchema,
            item: slug.optional(),
            description: translatedSchema.optional(),
          })
          .strict(),
      )
      .default([]),
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
    sections: z.array(sectionSchema).default([]),
    /**
     * Kind "daily" (BR-MST-005): products per ISO weekday ("1" = Monday); the seed writes entries
     * for the next `days` business dates. A weekday without a list is a closed day.
     */
    daily: z
      .object({
        weekdays: z.partialRecord(
          z.enum(["1", "2", "3", "4", "5", "6", "7"]),
          z.array(slug).min(1),
        ),
        days: z.number().int().min(1).max(31).default(14),
      })
      .strict()
      .optional(),
  })
  .strict()
  .superRefine((menu, ctx) => {
    if (menu.kind === "daily" && !menu.daily) {
      ctx.addIssue({ code: "custom", path: ["daily"], message: "Günün menüsü daily deseni ister" });
    }
    if (menu.kind !== "daily" && menu.daily) {
      ctx.addIssue({
        code: "custom",
        path: ["daily"],
        message: "daily yalnızca kind: daily menüde",
      });
    }
    if (menu.kind !== "daily" && menu.sections.length === 0) {
      ctx.addIssue({ code: "custom", path: ["sections"], message: "Menü en az bir bölüm ister" });
    }
  });

export const menuContentSchema = z
  .object({
    images: z.record(slug, imageSchema).default({}),
    optionGroups: z.record(slug, optionGroupSchema).default({}),
    items: z.array(itemSchema).min(1),
    rules: z.array(ruleSchema).default([]),
    menus: z.array(menuSchema).min(1),
  })
  .strict()
  .superRefine((content, ctx) => {
    const optionExists = (ref: string) => {
      const [groupKey = "", optionKey] = ref.split(".");
      const group = content.optionGroups[groupKey];
      return Boolean(
        group && (optionKey === undefined || group.options.some((o) => o.key === optionKey)),
      );
    };
    content.items.forEach((item, index) => {
      const priceKeys = new Set(item.prices.flatMap((line) => (line.key ? [line.key] : [])));
      item.options.forEach((link, linkIndex) => {
        const path = ["items", index, "options", linkIndex];
        const group = content.optionGroups[link.group];
        if (!group) {
          ctx.addIssue({
            code: "custom",
            path: [...path, "group"],
            message: `Kayıtsız seçenek grubu: ${link.group}`,
          });
          return;
        }
        const [min, max] = [link.min ?? group.min, link.max ?? group.max];
        if (min > max) ctx.addIssue({ code: "custom", path, message: "min, max'tan büyük olamaz" });
        for (const key of link.appliesTo ?? []) {
          if (!priceKeys.has(key)) {
            ctx.addIssue({
              code: "custom",
              path: [...path, "appliesTo"],
              message: `Ürünün fiyat satırında yok: ${key}`,
            });
          }
        }
      });
    });
    const kinds = new Map(content.items.map((item) => [item.slug, item.kind]));
    const known = (slugRef: string) => kinds.has(slugRef);
    content.items.forEach((item, index) => {
      const refs: [string, string][] = [
        ...item.pairings.map((p, i): [string, string] => [`pairings.${String(i)}`, p.item]),
        ...item.suggestions.map((ref, i): [string, string] => [`suggestions.${String(i)}`, ref]),
        ...item.components.map((c, i): [string, string] => [`components.${String(i)}`, c.item]),
        ...item.courses.flatMap((c, i): [string, string][] =>
          c.item ? [[`courses.${String(i)}`, c.item]] : [],
        ),
      ];
      for (const [field, ref] of refs) {
        if (!known(ref))
          ctx.addIssue({
            code: "custom",
            path: ["items", index, field],
            message: `Kayıtsız ürün: ${ref}`,
          });
        if (ref === item.slug) {
          ctx.addIssue({
            code: "custom",
            path: ["items", index, field],
            message: "Ürün kendisine bağlanamaz (BR-ILS-001)",
          });
        }
      }
      if ((item.kind === "set") !== item.components.length > 0) {
        ctx.addIssue({
          code: "custom",
          path: ["items", index, "components"],
          message: "Bileşenler yalnızca ve her zaman kind: set üründe",
        });
      }
      if ((item.kind === "tasting") !== item.courses.length > 0) {
        ctx.addIssue({
          code: "custom",
          path: ["items", index, "courses"],
          message: "Tadım sırası yalnızca ve her zaman kind: tasting üründe",
        });
      }
    });
    content.menus.forEach((menu, index) => {
      for (const [weekday, slugs] of Object.entries(menu.daily?.weekdays ?? {})) {
        for (const ref of slugs) {
          if (!known(ref)) {
            ctx.addIssue({
              code: "custom",
              path: ["menus", index, "daily", "weekdays", weekday],
              message: `Kayıtsız ürün: ${ref}`,
            });
          }
        }
      }
    });

    content.rules.forEach((rule, index) => {
      for (const field of ["when", "excludes", "requires"] as const) {
        const ref = rule[field];
        if (ref !== undefined && !optionExists(ref)) {
          ctx.addIssue({
            code: "custom",
            path: ["rules", index, field],
            message: `Kayıtsız seçenek: ${ref}`,
          });
        }
      }
      if (rule.item !== undefined && !content.items.some((item) => item.slug === rule.item)) {
        ctx.addIssue({
          code: "custom",
          path: ["rules", index, "item"],
          message: `Kayıtsız ürün: ${rule.item}`,
        });
      }
      if (rule.excludes === rule.when || rule.requires === rule.when) {
        ctx.addIssue({
          code: "custom",
          path: ["rules", index],
          message: "Bir seçenek kendisini dışlayamaz ya da gerektiremez",
        });
      }
    });

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
