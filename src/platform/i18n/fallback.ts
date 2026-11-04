import type { Locale } from "../tenant/registry-schema";

/**
 * Field-level translation (plan §9, K-08): content is stored per field as { tr, en, ar, … } with
 * Turkish mandatory. A missing translation falls back to the venue's default language, then to
 * Turkish, and says which language it is in, so the page can mark it with lang="…" (BR-MNU-003,
 * REQ-006: an untranslated Turkish description on the EN page carries lang="tr").
 */
export type Translated = { tr: string } & Partial<Record<Locale, string>>;

export type Localized = {
  text: string;
  /** Language of `text`; differs from the requested locale when it fell back. */
  lang: Locale;
  fallback: boolean;
};

const present = (value: string | undefined): value is string =>
  value !== undefined && value.trim() !== "";

export function localize(
  field: Translated,
  locale: Locale,
  defaultLocale: Locale = "tr",
): Localized {
  for (const lang of [locale, defaultLocale, "tr"] as const) {
    const text = field[lang];
    if (present(text)) return { text, lang, fallback: lang !== locale };
  }
  return { text: field.tr, lang: "tr", fallback: locale !== "tr" };
}

/** Optional fields (description, ingredients): null when there is no text in any language. */
export function localizeOptional(
  field: Translated | null | undefined,
  locale: Locale,
  defaultLocale: Locale = "tr",
): Localized | null {
  if (!field) return null;
  const localized = localize(field, locale, defaultLocale);
  return present(localized.text) ? localized : null;
}
