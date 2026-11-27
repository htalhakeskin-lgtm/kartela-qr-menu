import type { Metadata } from "next";
import Link from "next/link";

import { buttonClass } from "@/components/panel/ui";
import { platformVenues } from "@/server/platform/venues";

export const metadata: Metadata = { title: "Mekân yönetimi" };

const STATUS = { active: "Etkin", pending: "DNS bekleniyor", error: "Hata" } as const;

/**
 * SCR-130: every venue with its theme, mode, languages, team size and domains. A new venue is
 * created with `pnpm mekan:yeni` (D-21): content files, and code for a custom theme.
 */
export default async function PlatformVenuesPage() {
  const venues = await platformVenues();
  return (
    <>
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Mekân yönetimi</h1>
        <p className="mt-1 text-muted-foreground">
          Kip, alan adları ve yayın. Yeni mekân{" "}
          <code className="font-mono text-sm">pnpm mekan:yeni</code> komutuyla eklenir; içerik
          dosyaları ve tema seçimi orada yapılır.
        </p>
      </header>
      <ul className="mt-6 grid gap-4 md:grid-cols-2">
        {venues.map((venue) => (
          <li
            key={venue.id}
            className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-5"
          >
            <div>
              <h2 className="text-lg font-semibold">{venue.name}</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {venue.mode === "live" ? "Canlı" : "Demo"} · tema {venue.themeId} ·{" "}
                <span className="uppercase">{venue.locales.join(", ")}</span> ·{" "}
                {String(venue.members)} kişi
              </p>
            </div>
            <ul className="flex flex-col gap-1 text-sm">
              {venue.domains.length === 0 ? (
                <li className="text-muted-foreground">Alan adı yok (yalnız önizleme adresi)</li>
              ) : (
                venue.domains.map((domain) => (
                  <li key={domain.id} className="flex flex-wrap justify-between gap-x-3">
                    <span className="break-all">{domain.host}</span>
                    <span className="text-muted-foreground">{STATUS[domain.status]}</span>
                  </li>
                ))
              )}
            </ul>
            <Link
              href={`/panel/platform/mekanlar/${venue.slug}` as never}
              className={buttonClass("secondary", "mt-auto self-start")}
            >
              Yönet<span className="sr-only">: {venue.name}</span>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
