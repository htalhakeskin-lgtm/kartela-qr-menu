import type { Metadata } from "next";

import { platformDefaults } from "@/config/platform-defaults";
import { formatMoney } from "@/lib/format";
import { pageMetadata } from "@/lib/seo";

/**
 * Platform home (Faz 3 shell). The full introduction / case study page arrives in D-38; this
 * version states what Kartela is and shows the idea — one menu engine, different looks — as a
 * typographic "colour card" of themes instead of a stock photo.
 */
export const metadata: Metadata = pageMetadata({
  title: "Kartela · Çok mekânlı QR menü",
  description: platformDefaults.seo.defaultDescription,
  path: "/",
});

type Swatch = {
  name: string;
  note: string;
  background: string;
  foreground: string;
  muted: string;
  accent: string;
  rule: string;
  font: string;
  rows: readonly (readonly [string, number])[];
};

// The same three rows rendered in three themes: Rakım by day, Rakım's evening set and Sade.
const SWATCHES: readonly Swatch[] = [
  {
    name: "Rakım · gündüz",
    note: "Demleme Defteri",
    background: "#f3f1ec",
    foreground: "#1f1d1a",
    muted: "#5e5a54",
    accent: "#b4441b",
    rule: "#dad5cc",
    font: "ui-monospace, Menlo, Consolas, monospace",
    rows: [
      ["V60 · Etiyopya Guji", 24000],
      ["Cortado", 19000],
      ["Tereyağlı kruvasan", 17500],
    ],
  },
  {
    name: "Rakım · akşam",
    note: "Gece defteri",
    background: "#161a1d",
    foreground: "#ece6da",
    muted: "#b3ac9f",
    accent: "#e8955f",
    rule: "#2c3236",
    font: "ui-monospace, Menlo, Consolas, monospace",
    rows: [
      ["Kafeinsiz V60", 23000],
      ["Espresso tonik", 21000],
      ["Fıstıklı kurabiye", 9500],
    ],
  },
  {
    name: "Sade · hazır tema",
    note: "Token'larla her mekâna",
    background: "#ffffff",
    foreground: "#18181b",
    muted: "#5b5b63",
    accent: "#1f5f4a",
    rule: "#e4e4df",
    font: "inherit",
    rows: [
      ["Günün çorbası", 12000],
      ["Kuru fasulye · yarım", 14000],
      ["Sütlaç", 11000],
    ],
  },
];

const STEPS = [
  {
    title: "Alan adı mekânı bulur",
    text: "Her mekân kendi adresinde açılır. Gelen alan adı derleme anında üretilen bir haritadan çözülür; menünün açılması veritabanını beklemez.",
  },
  {
    title: "Tema kendi rota ağacında",
    text: "Her temanın yazı tipi, renkleri ve etkileşimleri yalnızca kendi sayfalarına yüklenir. Bir mekânın teması başka mekânın paketine girmez.",
  },
  {
    title: "Veri mekâna kapalı",
    text: "Sorgu kapsamı, veritabanındaki bileşik anahtarlar ve satır düzeyi güvenlik birlikte çalışır; mekânlar arası sızıntı testlerle kanıtlanır.",
  },
] as const;

export default function PlatformHome() {
  return (
    <main>
      <section className="mx-auto grid max-w-6xl gap-12 px-4 pt-12 pb-16 md:px-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:items-center lg:pt-20">
        <div>
          <p className="font-mono text-xs tracking-[0.12em] text-muted-foreground">
            kafe · restoran · bar
          </p>
          <h1 className="mt-4 text-4xl leading-[1.05] font-semibold tracking-tight text-balance md:text-6xl">
            Her mekâna kendi menüsü, tek altyapıdan.
          </h1>
          <p className="mt-6 max-w-[34rem] text-lg leading-relaxed text-muted-foreground">
            {platformDefaults.description}
          </p>
        </div>

        <figure>
          <div aria-hidden="true" className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {SWATCHES.map((swatch) => (
              <div
                key={swatch.name}
                className="rounded-[1.75rem] p-5 shadow-[0_1px_0_rgb(0_0_0/0.04)] ring-1 ring-black/10"
                style={{ background: swatch.background, color: swatch.foreground }}
              >
                <p className="text-sm font-semibold">{swatch.name}</p>
                <p className="mt-1 text-xs" style={{ color: swatch.muted }}>
                  {swatch.note}
                </p>
                <ul className="mt-6">
                  {swatch.rows.map(([label, price]) => (
                    <li
                      key={label}
                      className="flex items-baseline justify-between gap-3 py-2.5 text-sm"
                      style={{ borderTop: `1px solid ${swatch.rule}` }}
                    >
                      <span>{label}</span>
                      <span style={{ fontFamily: swatch.font, color: swatch.accent }}>
                        {formatMoney(price, { decimals: "auto" })}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <figcaption className="mt-4 text-sm text-muted-foreground">
            Aynı menü motoru, üç ayrı görünüm: Rakım&apos;ın gündüz ve akşam takımları ile hazır
            tema Sade.
          </figcaption>
        </figure>
      </section>

      <section className="border-t border-border">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 md:px-8 lg:grid-cols-[minmax(0,4fr)_minmax(0,8fr)]">
          <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">Nasıl çalışır</h2>
          <ol className="divide-y divide-border">
            {STEPS.map((step, index) => (
              <li key={step.title} className="grid gap-2 py-6 first:pt-0 sm:grid-cols-[3rem_1fr]">
                <span className="font-mono text-sm text-muted-foreground">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div>
                  <h3 className="text-lg font-semibold">{step.title}</h3>
                  <p className="mt-2 max-w-[42rem] leading-relaxed text-muted-foreground">
                    {step.text}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>
    </main>
  );
}
