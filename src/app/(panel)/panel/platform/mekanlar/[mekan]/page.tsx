import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { PanelCard } from "@/components/panel/ui";
import { currentPanelUser } from "@/server/panel/session";
import { platformVenues } from "@/server/platform/venues";
import { deployHookConfigured, vercelConfigured } from "@/server/platform/vercel";

import { AddDomainForm, DomainActions, ModeForm, RedeployForm } from "../../forms";

export const metadata: Metadata = { title: "Mekân" };

const STATUS = { active: "Etkin", pending: "DNS bekleniyor", error: "Hata" } as const;

/**
 * SCR-131: a venue's mode, domains and the redeploy that carries them into the host map (K-50).
 * Without the Vercel API token / Deploy Hook the page lists the manual steps.
 */
export default async function PlatformVenuePage({
  params,
}: {
  params: Promise<{ mekan: string }>;
}) {
  const { mekan } = await params;
  const venue = (await platformVenues()).find((entry) => entry.slug === mekan);
  if (!venue) notFound();
  const user = await currentPanelUser();
  const readOnly = user?.demo ?? true;
  const api = vercelConfigured();

  return (
    <>
      <p className="text-sm">
        <Link
          href="/panel/platform/mekanlar"
          className="inline-flex min-h-11 items-center underline-offset-4 hover:underline"
        >
          ← Mekân yönetimi
        </Link>
      </p>
      <h1 className="text-2xl font-semibold tracking-tight">{venue.name}</h1>
      <p className="mt-1 text-muted-foreground">
        Tema {venue.themeId} · <span className="uppercase">{venue.locales.join(", ")}</span> ·{" "}
        <Link href={`/panel/${venue.slug}` as never} className="underline-offset-4 hover:underline">
          mekânın paneli
        </Link>
      </p>
      {readOnly ? (
        <p role="note" className="mt-6 rounded-md bg-surface-muted px-4 py-3 text-sm">
          Demo hesabıyla platform değiştirilemez; burada yalnızca görüntülenir.
        </p>
      ) : null}

      <div className="mt-6 flex flex-col gap-4">
        <PanelCard
          id="kip"
          title={`Kip: ${venue.mode === "live" ? "Canlı" : "Demo"}`}
          description="Demo kipte sayfalar arama motorlarına kapalıdır ve alt bilgide demo notu durur."
        >
          {readOnly ? null : <ModeForm slug={venue.slug} mode={venue.mode} />}
        </PanelCard>

        <PanelCard
          id="alan-adlari"
          title="Alan adları"
          description="İlk alan adı birincildir (paylaşım ve canonical adresi). Bir alan adı tek mekâna bağlanır."
        >
          <ul className="flex flex-col divide-y divide-border">
            {venue.domains.map((domain) => (
              <li
                key={domain.id}
                className="flex flex-col gap-2 py-3 first:pt-0 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-medium break-all">{domain.host}</p>
                  <p className="text-sm text-muted-foreground">
                    {domain.isPrimary ? "Birincil · " : ""}
                    {STATUS[domain.status]}
                  </p>
                </div>
                {readOnly ? null : (
                  <DomainActions
                    slug={venue.slug}
                    domainId={domain.id}
                    host={domain.host}
                    canVerify={domain.status !== "active"}
                    canRemove={!domain.isPrimary}
                  />
                )}
              </li>
            ))}
          </ul>
          {readOnly ? null : (
            <div className="mt-4 border-t border-border pt-4">
              <AddDomainForm slug={venue.slug} />
              {api ? null : (
                <ol className="mt-4 list-decimal space-y-1 ps-5 text-sm text-muted-foreground">
                  <li>Vercel’de projenin Settings → Domains sayfasında alan adını ekleyin.</li>
                  <li>Vercel’in gösterdiği DNS kaydını alan adının sağlayıcısında girin.</li>
                  <li>Vercel alan adını doğruladığında burada “Doğrula” düğmesine basın.</li>
                </ol>
              )}
            </div>
          )}
        </PanelCard>

        <PanelCard
          id="yayin"
          title="Yayın"
          description="Alan adı ve kip değişiklikleri bir sonraki üretim yayınıyla yönlendirmeye girer."
        >
          {readOnly ? null : deployHookConfigured() ? (
            <RedeployForm />
          ) : (
            <p className="text-sm text-muted-foreground">
              Deploy Hook tanımlı değil: Vercel’de son üretim yayınını “Redeploy” ile yeniden
              başlatın.
            </p>
          )}
        </PanelCard>
      </div>
    </>
  );
}
