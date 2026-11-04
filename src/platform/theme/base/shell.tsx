"use client";

import { useSyncExternalStore } from "react";

import { uiText } from "../../i18n/ui";
import type { ShellProps } from "../contract";

const LANGUAGE_NAMES: Record<string, string> = {
  tr: "TR",
  en: "EN",
  ar: "AR",
  ru: "RU",
  de: "DE",
};

/** "" on the venue's own domain, "/m/{slug}" on a path-prefixed preview (ADR-0002 v2). */
export function useVenueBase(slug: string): string {
  return useSyncExternalStore(
    () => () => undefined,
    () => (window.location.pathname.startsWith(`/m/${slug}`) ? `/m/${slug}` : ""),
    () => "",
  );
}

/** Home of a locale on this venue: "/" for the default language, "/en" for the others. */
export function localeHome(base: string, locale: string, defaultLocale: string): string {
  if (locale === defaultLocale) return base || "/";
  return `${base}/${locale}`;
}

/**
 * Shell slot (SCR-001): a 56 px top bar — the venue's name, the menu being served, the language
 * links — above the page. The bottom action bar belongs to the page (it drives the sheets).
 */
export function BaseShell({ venue, children, headerCenter }: ShellProps) {
  const base = useVenueBase(venue.slug);
  const ui = uiText(venue.locale);
  return (
    <div className="min-h-dvh bg-background text-foreground">
      <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-background px-4">
        <a
          href={localeHome(base, venue.locale, venue.defaultLocale)}
          className="flex min-h-11 min-w-0 items-center truncate text-base font-semibold tracking-tight"
        >
          {venue.name}
        </a>
        <span className="hidden min-w-0 flex-1 truncate text-center text-sm text-muted-foreground sm:block">
          {headerCenter}
        </span>
        <span className="flex-1 sm:hidden" aria-hidden="true" />
        {venue.locales.length > 1 ? (
          <nav aria-label={ui.languages} className="flex shrink-0 items-center">
            {venue.locales.map((locale) => (
              <a
                key={locale}
                href={localeHome(base, locale, venue.defaultLocale)}
                hrefLang={locale}
                lang={locale}
                aria-current={locale === venue.locale ? "page" : undefined}
                className={`flex min-h-11 min-w-11 items-center justify-center text-sm ${
                  locale === venue.locale
                    ? "font-semibold text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {LANGUAGE_NAMES[locale] ?? locale}
              </a>
            ))}
          </nav>
        ) : null}
      </header>
      {children}
    </div>
  );
}
