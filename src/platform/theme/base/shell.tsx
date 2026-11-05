"use client";

import { useSyncExternalStore } from "react";

import { uiText } from "../../i18n/ui";
import { rememberView } from "../../menu/hooks";
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
export function BaseShell({ venue, view, children, headerCenter }: ShellProps) {
  const base = useVenueBase(venue.slug);
  const ui = uiText(venue.locale);
  const home = localeHome(base, venue.locale, venue.defaultLocale);
  /** The same view in another language: Keşfet stays Keşfet. */
  const viewHome = (locale: string) => {
    const target = localeHome(base, locale, venue.defaultLocale);
    return view === "kesfet" ? `${target === "/" ? "" : target}/kesfet` : target;
  };
  const languageLinks = venue.locales.map((locale) => (
    <a
      key={locale}
      href={viewHome(locale)}
      hrefLang={locale}
      lang={locale}
      aria-current={locale === venue.locale ? "page" : undefined}
      className={`flex min-h-11 min-w-11 items-center justify-center px-2 text-sm ${
        locale === venue.locale
          ? "font-semibold text-foreground"
          : "text-muted-foreground hover:text-foreground"
      }`}
    >
      {LANGUAGE_NAMES[locale] ?? locale}
    </a>
  ));
  // Hızlı ↔ Keşfet (UC-04): the choice is remembered in a cookie the host rewrites read, so the
  // next scan of the QR opens the same view with no extra round trip (ADR-0002 v2).
  const views =
    venue.stories.length > 0
      ? ([
          ["hizli", ui.quick, home],
          ["kesfet", ui.explore, `${home === "/" ? "" : home}/kesfet`],
        ] as const)
      : null;
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
        {views ? (
          <nav
            aria-label={`${ui.quick} / ${ui.explore}`}
            className="flex shrink-0 items-center rounded-full border border-border p-0.5"
          >
            {views.map(([key, label, href]) => (
              <a
                key={key}
                href={href}
                aria-current={view === key ? "page" : undefined}
                onClick={() => {
                  rememberView(key);
                }}
                className={`flex min-h-11 items-center rounded-full px-3 text-sm ${
                  view === key
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {label}
              </a>
            ))}
          </nav>
        ) : null}
        {venue.locales.length > 1 ? (
          <>
            {/* ≥ 640 px: the languages side by side. */}
            <nav aria-label={ui.languages} className="hidden shrink-0 items-center sm:flex">
              {languageLinks}
            </nav>
            {/* Phone: one button opens the list (popover, works without JavaScript). */}
            <button
              type="button"
              popoverTarget="kt-diller"
              aria-label={`${ui.languages}: ${LANGUAGE_NAMES[venue.locale] ?? venue.locale}`}
              className="flex min-h-11 min-w-11 shrink-0 items-center justify-center text-sm font-semibold sm:hidden"
            >
              {LANGUAGE_NAMES[venue.locale] ?? venue.locale}
            </button>
            <nav
              id="kt-diller"
              popover="auto"
              aria-label={ui.languages}
              className="kt-popover sm:hidden"
            >
              {languageLinks}
            </nav>
          </>
        ) : null}
      </header>
      {children}
    </div>
  );
}
