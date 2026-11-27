import type { Metadata } from "next";
import Link from "next/link";

import { NoPermission } from "@/components/panel/no-permission";
import { buttonClass } from "@/components/panel/ui";
import { formatDateTime } from "@/lib/format";
import { AUDIT_GROUPS, AUDIT_PAGE, auditView } from "@/server/panel/audit";
import { requireVenuePage } from "@/server/panel/session";

export const metadata: Metadata = { title: "İşlem geçmişi" };

/** "Yönetici → Sahip"; a first value alone; a removed one as "Personel (kaldırıldı)". */
function describe(change: { from: string | null; to: string | null }): string {
  if (change.from === "değişti" || change.to === "değişti") return "değişti";
  if (change.from === null) return change.to ?? "—";
  if (change.to === null) return `${change.from} (kaldırıldı)`;
  return `${change.from} → ${change.to}`;
}

/**
 * SCR-119: who changed what, when (owner). Filter chips by group in the address (?grup=), older
 * entries with ?once= (the last entry's time), so a filtered view can be shared and reloaded.
 */
export default async function AuditPage({
  params,
  searchParams,
}: {
  params: Promise<{ mekan: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { mekan } = await params;
  const { venue, allowed } = await requireVenuePage(mekan, "audit.view");
  if (!allowed) return <NoPermission title="İşlem geçmişi" />;

  const query = await searchParams;
  const group = AUDIT_GROUPS.find((entry) => entry.key === query.grup)?.key;
  const beforeValue = typeof query.once === "string" ? new Date(query.once) : undefined;
  const before = beforeValue && !Number.isNaN(beforeValue.getTime()) ? beforeValue : undefined;
  const entries = await auditView(venue.id, { group, before });
  const base = `/panel/${venue.slug}/gecmis`;
  const href = (params: Record<string, string | undefined>) => {
    const search = new URLSearchParams(
      Object.entries(params).filter((entry): entry is [string, string] => Boolean(entry[1])),
    ).toString();
    return search ? `${base}?${search}` : base;
  };
  const last = entries.at(-1);

  return (
    <>
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">İşlem geçmişi</h1>
        <p className="mt-1 text-muted-foreground">
          Paneldeki her değişiklik: kim, ne zaman, ne değişti.
        </p>
      </header>

      <nav aria-label="Süz" className="mt-6 flex flex-wrap gap-2">
        {[{ key: undefined, label: "Tümü" }, ...AUDIT_GROUPS].map((entry) => (
          <Link
            key={entry.label}
            href={href({ grup: entry.key }) as never}
            aria-current={entry.key === group ? "page" : undefined}
            className="inline-flex min-h-11 items-center rounded-full border border-control-border px-4 text-sm aria-[current=page]:border-primary aria-[current=page]:bg-primary aria-[current=page]:text-primary-foreground"
          >
            {entry.label}
          </Link>
        ))}
      </nav>

      {entries.length === 0 ? (
        <p className="mt-6 rounded-lg border border-dashed border-control-border bg-surface p-6 text-muted-foreground">
          {before || group
            ? "Bu süzgeçle kayıt yok."
            : "Henüz kayıt yok. Panelde yapılan her değişiklik burada görünür."}
        </p>
      ) : (
        <ol className="mt-6 flex flex-col divide-y divide-border rounded-lg border border-border bg-surface">
          {entries.map((entry) => (
            <li key={entry.id} className="flex flex-col gap-1.5 px-4 py-3 md:px-6">
              <p>
                <span className="font-medium">{entry.actor}</span> {entry.action}
                {entry.subject ? <span className="font-medium"> · {entry.subject}</span> : null}
              </p>
              <p className="text-sm text-muted-foreground tabular-nums">
                <time dateTime={entry.at.toISOString()}>{formatDateTime(entry.at)}</time>
              </p>
              {entry.changes.length > 0 ? (
                <ul className="flex flex-col gap-0.5 text-sm">
                  {entry.changes.map((change) => (
                    <li key={change.field} className="break-words">
                      <span className="text-muted-foreground">{change.field}:</span>{" "}
                      {describe(change)}
                    </li>
                  ))}
                </ul>
              ) : null}
            </li>
          ))}
        </ol>
      )}

      {entries.length === AUDIT_PAGE && last ? (
        <Link
          href={href({ grup: group, once: last.at.toISOString() }) as never}
          className={buttonClass("secondary", "mt-4")}
        >
          Daha eski kayıtlar
        </Link>
      ) : null}
    </>
  );
}
