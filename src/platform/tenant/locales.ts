/**
 * Page languages (plan K-08), in a module with no imports: client components read these
 * constants, and registry-schema.ts would bring zod and the schema into every venue bundle
 * (D-12 measurement: +44 KB gzip on Sade pages).
 */
export const LOCALES = ["tr", "en", "ar", "ru", "de"] as const;
export type Locale = (typeof LOCALES)[number];

/** Right-to-left locales: the theme root layout sets dir="rtl" (REQ-006). */
export const RTL_LOCALES: readonly Locale[] = ["ar"];
