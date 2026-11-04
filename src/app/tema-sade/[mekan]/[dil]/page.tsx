import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { SiteCredit } from "@/components/layout/site-credit";
import type { SectionView, Text } from "@/platform/menu/view";
import { itemIndex } from "@/platform/menu/view";
import { isVenueRoute } from "@/platform/tenant/registry";
import type { Locale } from "@/platform/tenant/registry-schema";
import { getVenueView } from "@/server/menu/venue-view";

/**
 * Skeleton page of the Sade tree, now fed by the menu engine (D-08): the venue's menus, sections
 * and products come from the database through getVenueView, in the page language with fallbacks
 * marked. Only the test fixture venue (`ornek`, not in the production build) uses Sade until D-39;
 * D-09 replaces this page with the theme's quick menu.
 */
export const metadata: Metadata = {
  title: "Menü · Örnek Mekân",
  description: "Kartela hazır teması Sade ile açılan test mekânı.",
};

const TEXT: Record<"tr" | "en" | "ar", { heading: string; note: string }> = {
  tr: { heading: "Menü", note: "Fiyatlara KDV dahildir. Servis, masa ya da kuver ücreti alınmaz." },
  en: { heading: "Menu", note: "Prices include VAT. No service, table or cover charge." },
  ar: {
    heading: "القائمة",
    note: "الأسعار تشمل ضريبة القيمة المضافة. لا توجد رسوم خدمة أو طاولة.",
  },
};

/** lang="…" only where the text fell back to another language (BR-MNU-003). */
const langOf = (text: Text, locale: string) => (text.lang === locale ? undefined : text.lang);

export default async function SadeSkeletonPage({
  params,
}: {
  params: Promise<{ mekan: string; dil: string }>;
}) {
  const { mekan, dil } = await params;
  if (!isVenueRoute("sade", mekan, dil)) notFound();
  const view = await getVenueView(mekan, dil as Locale);
  if (!view) notFound();
  const text = TEXT[(dil in TEXT ? dil : "tr") as keyof typeof TEXT];
  const items = itemIndex(view);

  const renderSection = (section: SectionView, depth: number) => (
    <section key={section.id} className="mt-6" aria-labelledby={`bolum-${section.id}`}>
      {depth === 0 ? (
        <h3
          id={`bolum-${section.id}`}
          className="text-lg font-semibold"
          lang={langOf(section.name, dil)}
        >
          {section.name.text}
        </h3>
      ) : (
        <h4
          id={`bolum-${section.id}`}
          className="text-base font-semibold"
          lang={langOf(section.name, dil)}
        >
          {section.name.text}
        </h4>
      )}
      <ul className="mt-2">
        {section.items.map(({ itemId }) => {
          const item = items.get(itemId);
          if (!item) return null;
          return (
            <li
              key={itemId}
              className="flex items-baseline justify-between gap-4 border-t border-border py-3"
            >
              <span lang={langOf(item.name, dil)}>{item.name.text}</span>
              {item.defaultPrice ? (
                <span className="shrink-0 font-mono tabular-nums" dir="ltr">
                  {item.defaultPrice.label ? `${item.defaultPrice.label} · ` : ""}
                  {item.defaultPrice.amount}
                </span>
              ) : null}
            </li>
          );
        })}
      </ul>
      {section.children.map((child) => renderSection(child, depth + 1))}
    </section>
  );

  return (
    <main className="mx-auto max-w-[40rem] px-4 py-10">
      <p className="text-sm text-muted-foreground">{view.name}</p>
      <h1 className="mt-1 text-3xl font-semibold tracking-tight">{text.heading}</h1>
      {view.menus
        .filter((menu) => menu.sections.length > 0)
        .map((menu) => (
          <section key={menu.id} className="mt-10" aria-labelledby={`menu-${menu.id}`}>
            <h2
              id={`menu-${menu.id}`}
              className="text-2xl font-semibold"
              lang={langOf(menu.name, dil)}
            >
              {menu.name.text}
            </h2>
            {menu.sections.map((section) => renderSection(section, 0))}
          </section>
        ))}
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
