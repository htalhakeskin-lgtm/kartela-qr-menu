"use client";

import { uiText } from "@/platform/i18n/ui";
import { rememberView } from "@/platform/menu/hooks";
import { localeHome, pageHref, useVenueBase } from "@/platform/theme/base/shell";
import type { ShellProps } from "@/platform/theme/contract";
import { OfflineSupport } from "@/platform/theme/offline";

/**
 * Rakım's top bar (plan §11.5 #1): the word mark on the left, the menu being served in the middle,
 * Hızlı / Keşfet and the languages on the right — set like a notebook header, no pills. Two
 * languages fit on a phone (TR · EN), so they stay side by side. The bar keeps its place during
 * the Hızlı ↔ Keşfet page transition (view-transition-name, rakim.css). Offline support as in the
 * base shell (D-13).
 */
export function RakimShell({ venue, view, children, headerCenter }: ShellProps) {
  const base = useVenueBase(venue.slug);
  const ui = uiText(venue.locale);
  const home = localeHome(base, venue.locale, venue.defaultLocale);
  const viewHome = (locale: string) => {
    const target = localeHome(base, locale, venue.defaultLocale);
    return view === "hizli" ? target : pageHref(target, view);
  };
  const views =
    venue.stories.length > 0
      ? ([
          ["hizli", ui.quick, home],
          ["kesfet", ui.explore, pageHref(home, "kesfet")],
        ] as const)
      : null;
  // The word mark: the first word of the venue's name ("Rakım Kahve Kavurma" → "Rakım").
  const mark = venue.name.split(" ")[0] ?? venue.name;
  return (
    <div className="min-h-dvh bg-background text-foreground">
      <OfflineSupport
        hosts={venue.hosts}
        labels={{ offline: ui.offline, lastUpdate: ui.lastUpdate }}
      />
      <header className="rakim-ust-cubuk sticky top-0 z-30 border-b border-border bg-background">
        <div className="mx-auto flex h-14 max-w-[64rem] items-center gap-3 px-4">
          <a
            href={home}
            aria-label={venue.name}
            className="flex min-h-11 items-center text-lg font-bold tracking-tight"
          >
            {mark}
          </a>
          <span className="min-w-0 flex-1 truncate text-center text-sm text-muted-foreground">
            {headerCenter}
          </span>
          {views ? (
            <nav aria-label={`${ui.quick} / ${ui.explore}`} className="hidden items-center sm:flex">
              {views.map(([key, label, href]) => (
                <a
                  key={key}
                  href={href}
                  aria-current={view === key ? "page" : undefined}
                  onClick={() => {
                    rememberView(key);
                  }}
                  className="flex min-h-11 min-w-11 items-center justify-center border-b-2 border-transparent px-2 text-sm text-muted-foreground aria-[current=page]:border-accent aria-[current=page]:text-foreground"
                >
                  {label}
                </a>
              ))}
            </nav>
          ) : null}
          {venue.locales.length > 1 ? (
            <nav aria-label={ui.languages} className="flex items-center font-mono text-xs">
              {venue.locales.map((locale, index) => (
                <span key={locale} className="flex items-center">
                  {index > 0 ? (
                    <span aria-hidden="true" className="text-muted-foreground">
                      ·
                    </span>
                  ) : null}
                  <a
                    href={viewHome(locale)}
                    hrefLang={locale}
                    lang={locale}
                    aria-current={locale === venue.locale ? "page" : undefined}
                    className="flex min-h-11 min-w-11 items-center justify-center text-muted-foreground uppercase aria-[current=page]:text-foreground"
                  >
                    {locale}
                  </a>
                </span>
              ))}
            </nav>
          ) : null}
        </div>
      </header>
      {views ? (
        // Phone: Hızlı / Keşfet as two tabs under the bar; not sticky, so the bar stays 56 px
        // and the category bar sticks right under it.
        <nav
          aria-label={`${ui.quick} / ${ui.explore}`}
          className="mx-auto flex max-w-[64rem] px-2 sm:hidden"
        >
          {views.map(([key, label, href]) => (
            <a
              key={key}
              href={href}
              aria-current={view === key ? "page" : undefined}
              onClick={() => {
                rememberView(key);
              }}
              className="flex min-h-11 flex-1 items-center justify-center border-b-2 border-transparent text-sm text-muted-foreground aria-[current=page]:border-accent aria-[current=page]:text-foreground"
            >
              {label}
            </a>
          ))}
        </nav>
      ) : null}
      {children}
    </div>
  );
}
