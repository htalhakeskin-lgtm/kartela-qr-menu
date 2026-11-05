import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { PanelShell } from "@/components/panel/shell";
import { buttonClass } from "@/components/panel/ui";
import { ROLE_LABELS } from "@/config/permissions";
import { currentPanelVenues, requirePanelUser } from "@/server/panel/session";

export const metadata: Metadata = { title: "Mekânlar" };

/**
 * The venue picker (SCR-102). A member of a single venue goes straight to it; a platform admin
 * and a member of several venues choose. Venue management (create, domain, theme, mode) comes
 * with the platform pages (D-19).
 */
export default async function VenuePickerPage() {
  const user = await requirePanelUser();
  const venues = await currentPanelVenues();
  const only = venues[0];
  if (venues.length === 1 && only && !user.platformAdmin) redirect(`/panel/${only.slug}` as never);

  return (
    <PanelShell user={user} venue={null} venues={venues}>
      <h1 className="text-2xl font-semibold tracking-tight">Mekânlar</h1>
      <p className="mt-1 text-muted-foreground">
        {user.platformAdmin
          ? "Platformdaki bütün mekânlar. Panelini açmak istediğiniz mekânı seçin."
          : "Üyesi olduğunuz mekânlar. Panelini açmak istediğiniz mekânı seçin."}
      </p>

      {venues.length === 0 ? (
        <div className="mt-8 rounded-lg border border-dashed border-control-border bg-surface p-6">
          <h2 className="font-semibold">Henüz bir mekâna üye değilsiniz</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Mekânın sahibinden sizi ekibe davet etmesini isteyin; davet kabul edilince mekân burada
            görünür.
          </p>
        </div>
      ) : (
        <ul className="mt-8 grid gap-4 md:grid-cols-2">
          {venues.map((venue) => (
            <li
              key={venue.id}
              className="flex flex-col gap-4 rounded-lg border border-border bg-surface p-5"
            >
              <div>
                <h2 className="text-lg font-semibold">{venue.name}</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {ROLE_LABELS[venue.role]} · {venue.mode === "live" ? "Canlı" : "Demo"}
                </p>
              </div>
              <div className="mt-auto flex flex-wrap gap-2">
                <Link href={`/panel/${venue.slug}` as never} className={buttonClass("primary")}>
                  Paneli aç
                  <span className="sr-only">: {venue.name}</span>
                </Link>
                <a
                  href={`/m/${venue.slug}/`}
                  target="_blank"
                  rel="noopener"
                  className={buttonClass("secondary")}
                >
                  Siteyi görüntüle
                  <span className="sr-only">: {venue.name} (yeni sekmede açılır)</span>
                </a>
              </div>
            </li>
          ))}
        </ul>
      )}
    </PanelShell>
  );
}
