import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { NoPermission } from "@/components/panel/no-permission";
import { LOCALES } from "@/platform/tenant/locales";
import { getVenue } from "@/platform/tenant/registry";
import { requireVenuePage } from "@/server/panel/session";
import { settingsForm, WEEKDAYS } from "@/server/panel/settings";

import { SettingsForm } from "./settings-form";

export const metadata: Metadata = { title: "Ayarlar" };

/** SCR-117: venue settings (owner). Languages come from the venue's record (a deploy changes them). */
export default async function SettingsPage({
  params,
  searchParams,
}: {
  params: Promise<{ mekan: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { mekan } = await params;
  const { venue, allowed } = await requireVenuePage(mekan, "settings.edit");
  if (!allowed) return <NoPermission title="Ayarlar" />;

  const locales = (getVenue(venue.slug)?.locales ?? ["tr"]).filter((locale) =>
    (LOCALES as readonly string[]).includes(locale),
  );
  const form = await settingsForm(venue.id, locales);
  if (!form) notFound();
  const saved = (await searchParams).kaydedildi === "1";

  return (
    <>
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Ayarlar</h1>
        <p className="mt-1 text-muted-foreground">
          Bilgi sayfasının içeriği. Kaydettiğinizde mekânın sayfaları hemen güncellenir.
        </p>
      </header>
      {saved ? (
        <p role="status" className="mt-6 rounded-md bg-surface-muted px-4 py-3 text-sm">
          Ayarlar kaydedildi; mekânın sayfaları güncellendi.
        </p>
      ) : null}
      <div className="mt-6">
        <SettingsForm
          venueId={venue.id}
          slug={venue.slug}
          version={form.version}
          locales={form.locales}
          weekdays={WEEKDAYS}
          initial={form.fields}
        />
      </div>
    </>
  );
}
