import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { env } from "@/lib/env";
import { pageMetadata } from "@/lib/seo";

/**
 * Style tile of the platform and panel look (20-gorsel-kalite §2, plan §11.8). Each venue theme
 * has its own /stil in its theme tree (D-10, D-14). Demo / preview only; 404 on a live platform.
 * A missing token shows as a hatched swatch.
 */
export const metadata: Metadata = pageMetadata({
  title: "Stil karosu",
  description: "Kartela platformunun ve panelinin token'ları, yazı ölçeği ve temel bileşenleri.",
  path: "/stil",
  noindex: true,
});

const COLOR_TOKENS = [
  "background",
  "surface",
  "surface-muted",
  "foreground",
  "muted-foreground",
  "border",
  "control-border",
  "primary",
  "primary-foreground",
  "warning",
  "danger",
  "info",
] as const;

const TYPE_SCALE = [
  ["text-6xl", "Her mekâna kendi menüsü"],
  ["text-4xl", "Bölüm başlığı · Şık İç Mekân"],
  ["text-2xl", "Alt başlık: ğ ş ı İ ç ö ü"],
  ["text-lg", "Giriş paragrafı: kısa, somut, fayda odaklı bir cümle."],
  ["text-base", "Gövde metni 16 px; satır uzunluğu 60–75 karakter, satır yüksekliği 1,6."],
  ["text-sm", "Yardımcı metin, form açıklaması"],
  ["text-xs", "rozet · etiket"],
] as const;

const MISSING = "repeating-linear-gradient(45deg, #ccc 0 6px, #fff 6px 12px)";

export default function StyleTilePage() {
  if (!env.PLATFORM_DEMO) notFound();

  return (
    <main className="mx-auto max-w-6xl px-4 py-12 md:px-8">
      <p className="font-mono text-xs tracking-[0.12em] text-muted-foreground">stil karosu</p>
      <h1 className="mt-2 text-4xl font-semibold tracking-tight md:text-6xl">Kartela</h1>
      <p className="mt-4 max-w-[42rem] text-lg leading-relaxed text-muted-foreground">
        Platformun ve yönetim panelinin görünümü: kırık beyaz zemin, mürekkep metin, tek hâkim renk
        olarak derin yeşil. Mekân siteleri bu token&apos;ları kullanmaz; her temanın kendi stil
        karosu vardır.
      </p>

      <h2 className="mt-16 text-2xl font-semibold">Renkler</h2>
      <ul className="mt-6 grid grid-cols-[repeat(auto-fill,minmax(10rem,1fr))] gap-4">
        {COLOR_TOKENS.map((token) => (
          <li key={token} className="text-sm">
            <span
              className="block h-20 rounded-md border border-border"
              style={{ background: `var(--${token}, ${MISSING})` }}
            />
            <code className="mt-2 block">--{token}</code>
          </li>
        ))}
      </ul>

      <h2 className="mt-16 text-2xl font-semibold">Yazı ölçeği</h2>
      <div className="mt-6 flex flex-col gap-4">
        {TYPE_SCALE.map(([size, sample]) => (
          <div
            key={size}
            className="flex flex-col gap-1 border-b border-border pb-4 md:flex-row md:items-baseline md:gap-8"
          >
            <code className="w-28 shrink-0 text-xs text-muted-foreground">{size}</code>
            <span className={`${size} font-semibold tracking-tight`}>{sample}</span>
          </div>
        ))}
      </div>

      <h2 className="mt-16 text-2xl font-semibold">Düğmeler</h2>
      <div className="mt-6 flex flex-wrap gap-4">
        <button
          type="button"
          className="min-h-11 rounded-md bg-primary px-5 font-medium text-primary-foreground"
        >
          Birincil eylem
        </button>
        <button
          type="button"
          className="min-h-11 rounded-md border border-control-border px-5 font-medium"
        >
          İkincil (çerçeveli)
        </button>
        <button type="button" className="min-h-11 px-2 font-medium underline underline-offset-4">
          Metin bağlantısı
        </button>
      </div>

      <h2 className="mt-16 text-2xl font-semibold">Liste kartı (panel)</h2>
      <article className="mt-6 max-w-sm rounded-lg border border-border bg-surface p-5">
        <p className="font-mono text-xs text-muted-foreground">rakim · filtre</p>
        <h3 className="mt-2 text-lg font-semibold">V60 · Etiyopya Guji</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          240 ₺ · yayında · bileşen ve enerji tam
        </p>
      </article>
    </main>
  );
}
