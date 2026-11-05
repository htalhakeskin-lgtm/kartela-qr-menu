"use client";

import { useParams } from "next/navigation";
import { useSyncExternalStore } from "react";

import { uiText } from "../../i18n/ui";
import type { Locale } from "../../tenant/registry-schema";

/**
 * Home of the language the guest was in, read from the address: "/en/xyz" → "/en", "/xyz" → "/",
 * "/m/ornek/en/xyz" → "/m/ornek/en". The default language has no prefix, so a first segment that
 * is not this page's language means the default home.
 */
function homeFromPath(pathname: string, slug: string, locale: string): string {
  const prefix = pathname.startsWith(`/m/${slug}`) ? `/m/${slug}` : "";
  const rest = pathname.slice(prefix.length);
  const first = rest.split("/")[1] ?? "";
  return first === locale ? `${prefix}/${locale}` : prefix || "/";
}

/**
 * A venue's 404 (D-11): rendered by not-found.tsx inside the venue's theme layout, so it carries
 * the venue's type, colours and language. not-found files take no props; the language comes from
 * the route parameters. Next.js adds noindex to every not-found render.
 */
export function VenueNotFound() {
  const params = useParams<{ mekan: string; dil: string }>();
  // The rewrites only route a venue's own languages here; uiText falls back for anything else.
  // No schema import: this component ships with every page of the theme tree.
  const locale = params.dil as Locale;
  const ui = uiText(locale);
  const home = useSyncExternalStore(
    () => () => undefined,
    () => homeFromPath(window.location.pathname, params.mekan, locale),
    () => "/",
  );
  return (
    <main className="mx-auto flex min-h-dvh max-w-[40rem] flex-col justify-center px-4 py-16">
      <title>{ui.notFoundTitle}</title>
      <p className="text-sm font-semibold tracking-wide text-muted-foreground tabular-nums">404</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">{ui.notFoundTitle}</h1>
      <p className="mt-4 text-lg text-muted-foreground">{ui.notFoundBody}</p>
      <a
        href={home}
        className="mt-8 inline-flex min-h-12 items-center justify-center self-start rounded-md bg-primary px-6 font-semibold text-primary-foreground"
      >
        {ui.backToMenu}
      </a>
    </main>
  );
}
