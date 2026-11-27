import type { Metadata } from "next";
import Link from "next/link";

import { NoPermission } from "@/components/panel/no-permission";
import { buttonClass } from "@/components/panel/ui";
import { formatDate } from "@/lib/format";
import { dailyView } from "@/server/panel/availability";
import { requireVenuePage } from "@/server/panel/session";

import { DailyForm } from "./daily-form";

export const metadata: Metadata = { title: "Günün menüsü" };

/**
 * SCR-109 (BR-MST-005): a daily menu's products for a business date; the visitor sees the day's
 * products, nothing for a day without any. Date and menu in the address (?tarih=, ?menu=).
 */
export default async function DailyMenuPage({
  params,
  searchParams,
}: {
  params: Promise<{ mekan: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { mekan } = await params;
  const { venue, allowed } = await requireVenuePage(mekan, "availability.edit");
  if (!allowed) return <NoPermission title="Günün menüsü" />;
  const query = await searchParams;
  const view = await dailyView(venue.id, venue.slug, {
    menuId: typeof query.menu === "string" ? query.menu : undefined,
    onDate: typeof query.tarih === "string" ? query.tarih : undefined,
    now: new Date(),
    timeZone: venue.timezone,
  });
  const base = `/panel/${venue.slug}/gunun-menusu`;

  return (
    <>
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Günün menüsü</h1>
        <p className="mt-1 text-muted-foreground">
          {formatDate(new Date(`${view.onDate}T12:00:00Z`), "withWeekday")}
        </p>
      </header>

      {view.menuId === null ? (
        <p className="mt-6 rounded-lg border border-dashed border-control-border bg-surface p-6 text-muted-foreground">
          Bu mekânda günün menüsü yok. Günlük değişen bir menü içerik yönetiminden eklenir.
        </p>
      ) : (
        <>
          <form method="get" action={base} className="mt-6 flex flex-wrap items-end gap-3">
            {view.menus.length > 1 ? (
              <label className="flex flex-col gap-1.5 text-sm font-medium">
                Menü
                <select
                  name="menu"
                  defaultValue={view.menuId}
                  className="min-h-11 rounded-md border border-control-border bg-surface px-3 text-base"
                >
                  {view.menus.map((menu) => (
                    <option key={menu.id} value={menu.id}>
                      {menu.name}
                    </option>
                  ))}
                </select>
              </label>
            ) : (
              <input type="hidden" name="menu" value={view.menuId} />
            )}
            <label className="flex flex-col gap-1.5 text-sm font-medium">
              Tarih
              <input
                type="date"
                name="tarih"
                defaultValue={view.onDate}
                className="min-h-11 rounded-md border border-control-border bg-surface px-3 text-base"
              />
            </label>
            <button type="submit" className={buttonClass("secondary")}>
              Göster
            </button>
          </form>
          <p className="mt-2 text-sm">
            <Link
              href={base as never}
              className="inline-flex min-h-11 items-center underline-offset-4 hover:underline"
            >
              Bugüne dön
            </Link>
          </p>
          <div className="mt-4">
            <DailyForm
              key={`${view.menuId}-${view.onDate}`}
              venueId={venue.id}
              menuId={view.menuId}
              onDate={view.onDate}
              items={view.items}
              selected={view.selected}
            />
          </div>
        </>
      )}
    </>
  );
}
