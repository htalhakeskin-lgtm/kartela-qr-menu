import type { Metadata } from "next";
import Image from "next/image";

import { SiteCredit } from "@/components/layout/site-credit";
import { formatMoney } from "@/lib/format";
import { featured, type MeasureItem, sections } from "@/themes/rakim/olcum";

/**
 * Faz 3 measurement page (RSK-01, plan K-27): Rakım's quick-menu first screen as plan §11.5
 * describes it, rendered on the server with no client component, so `pnpm olcum:js` reads the
 * framework baseline and Lighthouse sees realistic fonts, LCP photo and rows.
 * Replaced in D-15 by the theme's real page on the menu engine.
 */
export const metadata: Metadata = {
  title: "Menü · Rakım Kahve Kavurma",
  description:
    "Rakım Kahve Kavurma, Moda: filtre kahve, espresso ve fırından ürünler. Fiyatlara KDV dahildir.",
};

const price = (minor: number) => formatMoney(minor, { decimals: "auto" });

function Row({ item }: { item: MeasureItem }) {
  return (
    <li className="flex gap-4 border-t border-border py-4 first:border-t-0">
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-3">
          <h3 className="text-[1.0625rem] leading-snug font-semibold">{item.name}</h3>
          <span className="tabular shrink-0 font-mono text-base">{price(item.priceMinor)}</span>
        </div>
        <p className="mt-1 text-[0.9375rem] leading-snug text-muted-foreground">
          {item.description}
        </p>
        <p className="tabular mt-2 font-mono text-xs text-muted-foreground">{item.data}</p>
      </div>
      {item.image ? (
        <Image
          src={item.image.src}
          alt={item.image.alt}
          width={72}
          height={72}
          sizes="72px"
          quality={75}
          className="size-[72px] shrink-0 rounded-[4px] object-cover"
        />
      ) : null}
    </li>
  );
}

export default function MeasurementMenuPage() {
  return (
    <>
      <header className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur-none">
        <div className="mx-auto flex h-14 max-w-[720px] items-center justify-between gap-3 px-4">
          <p className="text-lg font-bold tracking-tight">Rakım</p>
          <p className="truncate text-sm text-muted-foreground">
            Sabah <span aria-hidden="true">·</span>{" "}
            <span className="tabular font-mono text-accent">12:00</span>&apos;ye kadar
          </p>
          <p className="font-mono text-xs text-muted-foreground" lang="en">
            TR · EN
          </p>
        </div>
        <nav aria-label="Kategoriler" className="mx-auto max-w-[720px]">
          <ul className="flex gap-1 overflow-x-auto px-2 pb-1">
            {sections.map((section, index) => (
              <li key={section.id}>
                <a
                  href={`#${section.id}`}
                  aria-current={index === 0 ? "true" : undefined}
                  className="inline-flex min-h-11 items-center border-b-2 border-transparent px-3 text-sm font-medium aria-[current=true]:border-accent"
                >
                  {section.title}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </header>

      <main className="mx-auto max-w-[720px] pb-16">
        <h1 className="sr-only">Rakım Kahve Kavurma menüsü</h1>

        <article className="pb-6">
          <div className="relative aspect-[4/3] w-full overflow-hidden md:mt-6 md:rounded-[6px]">
            <Image
              src={featured.image.src}
              alt={featured.image.alt}
              fill
              priority
              sizes="(min-width: 720px) 720px, 100vw"
              quality={85}
              className="object-cover"
            />
          </div>
          <div className="px-4 pt-4">
            <p className="font-mono text-xs text-muted-foreground">{featured.label}</p>
            <div className="mt-1 flex items-baseline justify-between gap-3">
              <h2 className="text-[1.375rem] leading-tight font-bold tracking-tight">
                {featured.name}
              </h2>
              <span className="tabular shrink-0 font-mono text-base">
                {price(featured.priceMinor)}
              </span>
            </div>
            <p className="mt-2 text-[0.9375rem] leading-snug text-muted-foreground">
              {featured.description}
            </p>
            <p className="tabular mt-2 font-mono text-xs text-muted-foreground">{featured.data}</p>
          </div>
        </article>

        {sections.map((section) => (
          <section key={section.id} id={section.id} className="scroll-mt-28 px-4 pt-6">
            <h2 className="text-[1.375rem] font-bold tracking-tight">{section.title}</h2>
            <ul className="mt-2">
              {section.items.map((item) => (
                <Row key={item.name} item={item} />
              ))}
            </ul>
          </section>
        ))}

        <footer className="mt-12 border-t border-border px-4 pt-6 text-sm leading-relaxed text-muted-foreground">
          <p>Fiyatlara KDV dahildir. Servis, masa ya da kuver ücreti alınmaz.</p>
          <p className="mt-2">Basılı fiyat listesini garsonumuzdan isteyebilirsiniz.</p>
          <p className="mt-2">
            Ürünlerimiz süt, gluten ve sert kabuklu meyve içerebilir; alerjen bilgisi her ürünün
            ayrıntısındadır.
          </p>
          <div className="mt-6 flex flex-col gap-2 text-xs sm:flex-row sm:justify-between">
            <p>Gösterim amaçlı demo; mekân ve fiyatlar kurgusaldır.</p>
            <SiteCredit className="shrink-0 font-mono text-xs text-muted-foreground" />
          </div>
        </footer>
      </main>
    </>
  );
}
