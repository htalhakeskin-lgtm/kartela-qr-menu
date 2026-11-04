import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { SiteCredit } from "@/components/layout/site-credit";
import { formatMoney } from "@/lib/format";
import { getVenue, isVenueRoute } from "@/platform/tenant/registry";

/**
 * D-01 skeleton page of the Sade tree. Only the test fixture venue (`ornek`, not in the production
 * build) uses Sade until D-39, so this page proves routing, the shared tree and right-to-left
 * layout. D-09 replaces it with the theme's quick menu on the menu engine.
 */
export const metadata: Metadata = {
  title: "Menü · Örnek Mekân",
  description: "Kartela hazır teması Sade ile açılan test mekânı.",
};

const TEXT: Record<
  "tr" | "en" | "ar",
  { heading: string; rows: [string, number][]; note: string }
> = {
  tr: {
    heading: "Menü",
    rows: [
      ["Mercimek çorbası", 12000],
      ["Kuru fasulye · yarım", 14000],
      ["Sütlaç", 11000],
    ],
    note: "Fiyatlara KDV dahildir. Servis, masa ya da kuver ücreti alınmaz.",
  },
  en: {
    heading: "Menu",
    rows: [
      ["Red lentil soup", 12000],
      ["White bean stew · half", 14000],
      ["Rice pudding", 11000],
    ],
    note: "Prices include VAT. No service, table or cover charge.",
  },
  ar: {
    heading: "القائمة",
    rows: [
      ["شوربة العدس", 12000],
      ["فاصوليا بيضاء · نصف حصة", 14000],
      ["مهلبية بالأرز", 11000],
    ],
    note: "الأسعار تشمل ضريبة القيمة المضافة. لا توجد رسوم خدمة أو طاولة.",
  },
};

export default async function SadeSkeletonPage({
  params,
}: {
  params: Promise<{ mekan: string; dil: string }>;
}) {
  const { mekan, dil } = await params;
  const venue = getVenue(mekan);
  if (!venue || !isVenueRoute("sade", mekan, dil)) notFound();
  const text = TEXT[(dil in TEXT ? dil : "tr") as keyof typeof TEXT];

  return (
    <main className="mx-auto max-w-[40rem] px-4 py-10">
      <p className="text-sm text-muted-foreground">{venue.name}</p>
      <h1 className="mt-1 text-3xl font-semibold tracking-tight">{text.heading}</h1>
      <ul className="mt-6">
        {text.rows.map(([name, price]) => (
          <li
            key={name}
            className="flex items-baseline justify-between gap-4 border-t border-border py-4"
          >
            <span className="text-lg">{name}</span>
            <span className="shrink-0 font-mono tabular-nums" dir="ltr">
              {formatMoney(price, { decimals: "auto" })}
            </span>
          </li>
        ))}
      </ul>
      <footer className="mt-10 border-t border-border pt-6 text-sm text-muted-foreground">
        <p>{text.note}</p>
        <div className="mt-4 flex flex-col gap-2 text-xs sm:flex-row sm:justify-between">
          <p lang="tr" dir="ltr">
            Gösterim amaçlı test mekânı.
          </p>
          <SiteCredit className="shrink-0 font-mono text-xs text-muted-foreground" />
        </div>
      </footer>
    </main>
  );
}
