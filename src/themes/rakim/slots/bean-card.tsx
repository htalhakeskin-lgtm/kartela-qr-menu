import Image from "next/image";

import { formatNumber } from "@/lib/format";
import { type BeanAttributes, beanAttributes } from "@/platform/menu/attributes";
import { t } from "@/platform/menu/view";
import { AvailabilityNote } from "@/platform/theme/base/item-card";
import { DIMMED, T } from "@/platform/theme/base/text";
import type { ItemCardProps } from "@/platform/theme/contract";

import { RakimDataLine } from "./data-line";
import { RakimPrice } from "./price";

/**
 * Rakım's bean card (plan §11.5, REQ-020, D-17): in Çekirdekler a row becomes a card — no origin
 * flag; the region, the altitude line (the farm's height on a 0–2.500 m scale, the range in the
 * accent), the tasting notes as chips and a brewing suggestion by roast. Still one button that
 * opens the product panel.
 */

const SCALE_M = 2500;

const TEXT = {
  tr: {
    altitude: "Rakım",
    brew: "Önerilen demleme",
    roast: {
      filter: "V60 · Chemex · AeroPress",
      espresso: "Espresso · Moka",
      omni: "Filtre · Espresso",
    },
  },
  en: {
    altitude: "Altitude",
    brew: "Brew with",
    roast: {
      filter: "V60 · Chemex · AeroPress",
      espresso: "Espresso · Moka pot",
      omni: "Filter · Espresso",
    },
  },
} as const;

function AltitudeLine({ bean, label }: { bean: BeanAttributes; label: string }) {
  const { min, max } = bean.altitude;
  const range =
    min === max ? `${formatNumber(min)} m` : `${formatNumber(min)}–${formatNumber(max)} m`;
  const left = (Math.min(min, SCALE_M) / SCALE_M) * 100;
  const width = Math.max(1.5, ((Math.min(max, SCALE_M) - Math.min(min, SCALE_M)) / SCALE_M) * 100);
  return (
    <span role="img" aria-label={`${label}: ${range}`} className="mt-1 block w-full">
      <span aria-hidden="true" className="relative block h-3">
        <span className="absolute inset-x-0 top-1/2 h-px bg-border" />
        {[0, 1000, 2000].map((tick) => (
          <span
            key={tick}
            className="absolute top-1/2 h-2 w-px -translate-y-1/2 bg-border"
            style={{ left: `${String((tick / SCALE_M) * 100)}%` }}
          />
        ))}
        <span
          className="absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-accent"
          style={{ left: `${String(left)}%`, width: `${String(width)}%` }}
        />
      </span>
      <span
        aria-hidden="true"
        className="flex justify-between font-mono text-[0.6875rem] text-muted-foreground tabular-nums"
      >
        <span>0 m</span>
        <span>{formatNumber(SCALE_M)} m</span>
      </span>
    </span>
  );
}

export function RakimBeanCard({ item, venue, status, onOpen }: ItemCardProps) {
  const bean = beanAttributes(item.attributes);
  const text = TEXT[venue.locale === "tr" ? "tr" : "en"];
  const unavailable = Boolean(status?.soldOut);
  return (
    <button
      type="button"
      onClick={onOpen}
      className={`flex w-full items-start gap-4 py-4 text-start ${unavailable ? DIMMED : ""}`}
    >
      <span className="flex min-w-0 flex-1 flex-col gap-1.5">
        <span className="flex items-baseline justify-between gap-4">
          <T
            text={item.name}
            page={venue.locale}
            className="text-[1.0625rem] leading-snug font-semibold text-foreground"
          />
          {item.defaultPrice ? <RakimPrice price={item.defaultPrice} /> : null}
        </span>
        {item.description ? (
          <T
            text={item.description}
            page={venue.locale}
            className="line-clamp-2 text-[0.9375rem] leading-snug text-muted-foreground"
          />
        ) : null}
        <RakimDataLine item={item} venue={venue} />
        {bean ? (
          <>
            <AltitudeLine bean={bean} label={text.altitude} />
            <span className="flex flex-wrap gap-1.5 pt-1">
              {bean.notes.map((note) => {
                const value = t(note, venue.locale, venue.defaultLocale);
                return (
                  <span
                    key={value.text}
                    lang={value.lang}
                    className="rounded-full bg-surface-muted px-2.5 py-0.5 text-xs text-foreground"
                  >
                    {value.text}
                  </span>
                );
              })}
            </span>
            <span className="font-mono text-xs text-muted-foreground">
              {text.brew}: {text.roast[bean.roast]}
            </span>
          </>
        ) : null}
        <AvailabilityNote status={status} venue={venue} />
      </span>
      {item.image ? (
        <Image
          src={item.image.src}
          alt={item.image.alt.text}
          width={72}
          height={90}
          sizes="72px"
          quality={75}
          data-urun-gorseli={item.slug}
          className="h-[90px] w-18 shrink-0 rounded-[4px] object-cover"
          style={{
            objectPosition: `${String(item.image.focalX)}% ${String(item.image.focalY)}%`,
          }}
        />
      ) : null}
    </button>
  );
}
