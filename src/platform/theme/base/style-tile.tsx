"use client";

import { contrastRatio } from "../../../lib/contrast";
import { formatNumber } from "../../../lib/format";
import type { AvailabilityStatus } from "../../menu/availability";
import type { VenueView } from "../../menu/view";
import type { ThemeMeta, ThemeTokens } from "../contract";
import type { QuickMenuSlots } from "./slots";

/**
 * Style tile (SCR-007, D-10): a theme's tokens with their contrast, its type scale and its slots on
 * the venue's own products — the page a designer and a reviewer look at before the menu. Not
 * indexed; reachable on a venue host and in previews.
 */
const TOKEN_LABELS: Record<keyof ThemeTokens["color"], string> = {
  background: "background",
  surface: "surface",
  surfaceMuted: "surface-muted",
  foreground: "foreground",
  mutedForeground: "muted-foreground",
  border: "border",
  primary: "primary",
  primaryForeground: "primary-foreground",
  accent: "accent",
  accentForeground: "accent-foreground",
  soldOut: "sold-out",
  focus: "focus",
};

function Swatches({ title, colors }: { title: string; colors: ThemeTokens["color"] }) {
  return (
    <section className="mt-10">
      <h2 className="text-xl font-semibold">{title}</h2>
      <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {(Object.keys(TOKEN_LABELS) as (keyof ThemeTokens["color"])[]).map((key) => (
          <li key={key} className="overflow-hidden rounded-md border border-border">
            <span className="block h-14" style={{ background: colors[key] }} aria-hidden="true" />
            <span className="block p-3 text-xs">
              <span className="block font-medium">{TOKEN_LABELS[key]}</span>
              <span className="block text-muted-foreground tabular-nums">
                {colors[key]} · {formatNumber(contrastRatio(colors[key], colors.background), 1)}:1
              </span>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function StyleTile({
  venue,
  meta,
  slots,
}: {
  venue: VenueView;
  meta: ThemeMeta;
  slots: QuickMenuSlots;
}) {
  const withPhoto = venue.items.find((item) => item.image !== null);
  const photoless = venue.items.find((item) => item.image === null && item.kind !== "tasting");
  const soldOut: AvailabilityStatus = {
    soldOut: { reason: "count" },
    remaining: 0,
    nextRelease: null,
    season: null,
    visible: true,
  };
  const noop = () => undefined;
  return (
    <main className="mx-auto max-w-[64rem] px-4 py-10">
      <p className="text-sm text-muted-foreground">
        {meta.id} · {meta.kind === "hazir" ? "hazır tema" : "özel tema"} · {meta.version}
      </p>
      <h1 className="mt-1 text-4xl font-semibold tracking-tight md:text-6xl">{venue.name}</h1>

      <Swatches title="Gündüz" colors={meta.tokens.color} />
      {meta.tokenVariants?.dark ? <Swatches title="Koyu" colors={meta.tokenVariants.dark} /> : null}

      <section className="mt-10">
        <h2 className="text-xl font-semibold">Yazı ölçeği</h2>
        <div className="mt-4 flex flex-col gap-3">
          <p className="text-6xl font-semibold tracking-tight">Keşfet 64</p>
          <p className="text-4xl font-semibold tracking-tight">Başlık 36</p>
          <p className="text-2xl font-semibold">Menü başlığı 24</p>
          <p className="text-lg font-semibold">Bölüm 18</p>
          <p className="text-base">Gövde 16 · Çğıİöşü ÇĞIİÖŞÜ</p>
          <p className="text-sm text-muted-foreground">Açıklama 14</p>
          <p className="text-xs text-muted-foreground tabular-nums">Veri 12 · 300 g · 1.234,56 ₺</p>
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-semibold">Ürün</h2>
        <div className="mt-4 grid gap-6 lg:grid-cols-2">
          {withPhoto ? (
            <div className="flex flex-col gap-3">
              <slots.ItemCard
                item={withPhoto}
                variant="one-cikan"
                venue={venue}
                status={null}
                onOpen={noop}
              />
              <ul className="divide-y divide-border border-y border-border">
                <li>
                  <slots.ItemCard
                    item={withPhoto}
                    variant="satir"
                    venue={venue}
                    status={null}
                    onOpen={noop}
                  />
                </li>
                {photoless ? (
                  <li>
                    <slots.ItemCard
                      item={photoless}
                      variant="satir"
                      venue={venue}
                      status={soldOut}
                      onOpen={noop}
                    />
                  </li>
                ) : null}
              </ul>
            </div>
          ) : null}
          {photoless ? (
            <div className="grid grid-cols-2 gap-3">
              <slots.ItemCard
                item={photoless}
                variant="kart"
                venue={venue}
                status={null}
                onOpen={noop}
              />
              <slots.ItemCard
                item={photoless}
                variant="izgara"
                venue={venue}
                status={null}
                onOpen={noop}
              />
              {withPhoto ? (
                <slots.ItemCard
                  item={withPhoto}
                  variant="izgara"
                  venue={venue}
                  status={null}
                  onOpen={noop}
                />
              ) : null}
              <slots.ItemCard
                item={photoless}
                variant="izgara"
                venue={venue}
                status={soldOut}
                onOpen={noop}
              />
            </div>
          ) : null}
        </div>
      </section>

      {photoless ? (
        <section className="mt-10 max-w-[40rem]">
          <h2 className="text-xl font-semibold">Ürün bilgisi</h2>
          <div className="mt-4">
            <slots.ItemFacts item={photoless} venue={venue} />
          </div>
        </section>
      ) : null}

      <slots.LegalNote venue={venue} />
    </main>
  );
}
