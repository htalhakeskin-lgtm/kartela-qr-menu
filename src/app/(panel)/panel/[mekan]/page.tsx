import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { buttonClass, PanelCard } from "@/components/panel/ui";
import { formatDate, formatTime } from "@/lib/format";
import { type Dashboard, venueDashboard } from "@/server/panel/dashboard";
import { requirePanelVenue } from "@/server/panel/session";

export const metadata: Metadata = { title: "Pano" };

/**
 * SCR-102 dashboard skeleton (plan §12: "Bugün" first). The scan counts and unanswered searches
 * join with statistics (P1, D-35); the quick sold-out list becomes a switch with availability
 * (D-20).
 */
const GAP_LABELS = { ingredients: "bileşen", energy: "enerji" } as const;
const LIST_LIMIT = 8;

function Stat({
  label,
  value,
  detail,
  wide = false,
}: {
  label: string;
  value: string;
  detail: string;
  /** Spans both columns of the phone grid. */
  wide?: boolean;
}) {
  return (
    <div
      className={`rounded-lg border border-border bg-surface p-4 md:p-5 ${wide ? "col-span-2 sm:col-span-1" : ""}`}
    >
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold tracking-tight tabular-nums">{value}</p>
      <p className="mt-1 text-sm text-muted-foreground">{detail}</p>
    </div>
  );
}

function openDetail(dashboard: Dashboard): { value: string; detail: string } {
  const first = dashboard.open[0];
  if (first) {
    const others = dashboard.open.length - 1;
    return {
      value: first.name,
      detail: [
        first.until ? `Bitiş ${first.until}` : "Saat sınırı yok",
        others > 0 ? `${String(others)} menü daha açık` : null,
      ]
        .filter(Boolean)
        .join(" · "),
    };
  }
  const next = dashboard.later[0];
  return next
    ? { value: "Kapalı", detail: `${next.name} · başlangıç ${next.startsAt ?? ""}` }
    : { value: "Kapalı", detail: "Bugün açılacak menü yok" };
}

function More({ count }: { count: number }) {
  if (count <= LIST_LIMIT) return null;
  return (
    <p className="mt-3 text-sm text-muted-foreground">ve {String(count - LIST_LIMIT)} ürün daha</p>
  );
}

export default async function VenueDashboardPage({
  params,
}: {
  params: Promise<{ mekan: string }>;
}) {
  const { mekan } = await params;
  const { venue } = await requirePanelVenue(mekan);
  const now = new Date();
  const dashboard = await venueDashboard(venue.slug, now);
  if (!dashboard) notFound();

  const open = openDetail(dashboard);
  return (
    <>
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Pano</h1>
        <p className="mt-1 text-muted-foreground">Bugün · {formatDate(now, "withWeekday")}</p>
      </header>

      <section aria-label="Bugünün özeti" className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Stat label="Şu an açık menü" value={open.value} detail={open.detail} wide />
        <Stat
          label="Tükenen ürün"
          value={String(dashboard.soldOut.length)}
          detail={
            dashboard.soldOut.length === 0
              ? "Bütün ürünler serviste"
              : "Gün sonunda kendiliğinden servise döner"
          }
        />
        <Stat
          label="Eksik ürün bilgisi"
          value={String(dashboard.gaps.length)}
          detail={`${String(dashboard.itemCount)} ürün içinde`}
        />
      </section>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <PanelCard
          id="tukenenler"
          title="Tükenenler"
          description="Ziyaretçi menüsünde soluk görünür ve sona dizilir."
        >
          {dashboard.soldOut.length === 0 ? (
            <p className="text-sm text-muted-foreground">Bugün tükenen ürün yok.</p>
          ) : (
            <>
              <ul className="divide-y divide-border">
                {dashboard.soldOut.slice(0, LIST_LIMIT).map((item) => (
                  <li key={item.id} className="flex items-baseline justify-between gap-4 py-2.5">
                    <span className="min-w-0">{item.name}</span>
                    <span className="shrink-0 text-sm text-muted-foreground">
                      {item.byCount
                        ? "Günlük adet bitti"
                        : item.until
                          ? `Tekrar serviste: ${formatTime(item.until)}`
                          : "Süresiz"}
                    </span>
                  </li>
                ))}
              </ul>
              <More count={dashboard.soldOut.length} />
            </>
          )}
        </PanelCard>

        <PanelCard
          id="eksik-bilgi"
          title="Eksik ürün bilgisi"
          description="Bileşen ya da enerji bilgisi olmayan ürünlerde ziyaretçi “bilgi için personele sorun” görür."
        >
          {dashboard.gaps.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Bütün ürünlerde bileşen ve enerji bilgisi var.
            </p>
          ) : (
            <>
              <ul className="divide-y divide-border">
                {dashboard.gaps.slice(0, LIST_LIMIT).map((item) => (
                  <li key={item.id} className="flex items-baseline justify-between gap-4 py-2.5">
                    <span className="min-w-0">{item.name}</span>
                    <span className="shrink-0 text-sm text-muted-foreground">
                      Eksik: {item.gaps.map((gap) => GAP_LABELS[gap]).join(", ")}
                    </span>
                  </li>
                ))}
              </ul>
              <More count={dashboard.gaps.length} />
            </>
          )}
        </PanelCard>
      </div>

      <section aria-labelledby="hizli" className="mt-8">
        <h2 id="hizli" className="text-base font-semibold">
          Ziyaretçinin gördüğü
        </h2>
        <div className="mt-3 flex flex-wrap gap-2">
          <a
            href={`/m/${venue.slug}/`}
            target="_blank"
            rel="noopener"
            className={buttonClass("secondary")}
          >
            Hızlı menü
            <span className="sr-only">(yeni sekmede açılır)</span>
          </a>
          <a
            href={`/m/${venue.slug}/kesfet`}
            target="_blank"
            rel="noopener"
            className={buttonClass("secondary")}
          >
            Keşfet
            <span className="sr-only">(yeni sekmede açılır)</span>
          </a>
          <a
            href={`/m/${venue.slug}/bilgi`}
            target="_blank"
            rel="noopener"
            className={buttonClass("secondary")}
          >
            Bilgi
            <span className="sr-only">(yeni sekmede açılır)</span>
          </a>
        </div>
      </section>
    </>
  );
}
