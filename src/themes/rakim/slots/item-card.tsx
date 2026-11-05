import Image from "next/image";

import { uiText } from "@/platform/i18n/ui";
import { AvailabilityNote, BaseItemCard } from "@/platform/theme/base/item-card";
import { DIMMED, T } from "@/platform/theme/base/text";
import type { ImageFallbackProps, ItemCardProps, PriceProps } from "@/platform/theme/contract";

import { RakimDataLine } from "./data-line";

/**
 * Rakım's ledger (plan §11.5): rows separated by a 1 px rule, no cards; the name in Schibsted
 * Grotesk 18 / 600, the price and the data line in Plex Mono with tabular figures; a 72 px photo
 * at the end of the row when the product has one. The featured product spans the column with a
 * 4:3 photo (the page's LCP). A product without a photo gets the "veri kartı" (K-23): its kind and
 * its data on paper, never a letter avatar.
 */

/** Price slot: Plex Mono, tabular, the unit label in the text face before it. */
export function RakimPrice({ price }: PriceProps) {
  return (
    <span className="inline-flex shrink-0 items-baseline gap-1.5" dir="ltr">
      {price.label ? <span className="text-sm text-muted-foreground">{price.label}</span> : null}
      <span className="font-mono text-base text-foreground tabular-nums">{price.amount}</span>
    </span>
  );
}

const KIND_LABEL = {
  tr: { dish: "Tabak", drink: "İçecek", bean: "Çekirdek", set: "Takım", tasting: "Tadım" },
  en: { dish: "Plate", drink: "Drink", bean: "Beans", set: "Set", tasting: "Tasting" },
} as const;

/** The data card: kind, name and the data line on paper with one accent rule. */
export function RakimImageFallback({ item, venue }: ImageFallbackProps) {
  const labels = KIND_LABEL[venue.locale === "tr" ? "tr" : "en"];
  return (
    <div
      aria-hidden="true"
      className="flex h-full flex-col justify-between border-t-2 border-accent bg-surface p-4"
    >
      <span className="font-mono text-xs text-muted-foreground">{labels[item.kind]}</span>
      <span className="flex flex-col gap-2">
        <span className="line-clamp-2 text-lg leading-snug font-semibold text-foreground">
          {item.name.text}
        </span>
        <RakimDataLine item={item} venue={venue} />
      </span>
    </div>
  );
}

export function RakimItemCard(props: ItemCardProps) {
  const { item, variant, venue, status, onOpen } = props;
  if (variant !== "satir" && variant !== "one-cikan") return <BaseItemCard {...props} />;
  const unavailable =
    Boolean(status?.soldOut) || (status?.season ? !status.season.inSeason : false);
  const price = item.defaultPrice ? <RakimPrice price={item.defaultPrice} /> : null;
  const description = item.description ? (
    <T
      text={item.description}
      page={venue.locale}
      className="line-clamp-2 text-[0.9375rem] leading-snug text-muted-foreground"
    />
  ) : null;

  if (variant === "one-cikan") {
    return (
      <button
        type="button"
        onClick={onOpen}
        className={`flex w-full flex-col text-start ${unavailable ? DIMMED : ""}`}
      >
        <span className="relative -mx-4 block aspect-[4/3] overflow-hidden md:mx-0 md:aspect-[16/9] md:rounded-[6px]">
          {item.image ? (
            <Image
              src={item.image.src}
              alt={item.image.alt.text}
              fill
              priority
              sizes="(min-width: 768px) 720px, 100vw"
              quality={85}
              className="object-cover"
              style={{
                objectPosition: `${String(item.image.focalX)}% ${String(item.image.focalY)}%`,
              }}
            />
          ) : (
            <RakimImageFallback item={item} venue={venue} />
          )}
        </span>
        <span className="flex flex-col gap-2 pt-4">
          <span className="font-mono text-xs text-muted-foreground">
            {uiText(venue.locale).featured}
          </span>
          <span className="flex items-baseline justify-between gap-4">
            <T
              text={item.name}
              page={venue.locale}
              className="text-[1.375rem] leading-tight font-bold tracking-tight text-foreground"
            />
            {price}
          </span>
          {description}
          <RakimDataLine item={item} venue={venue} />
          <AvailabilityNote status={status} venue={venue} />
        </span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onOpen}
      className={`flex w-full items-start gap-4 py-4 text-start ${unavailable ? DIMMED : ""}`}
    >
      <span className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="flex items-baseline justify-between gap-4">
          <T
            text={item.name}
            page={venue.locale}
            className="text-[1.0625rem] leading-snug font-semibold text-foreground"
          />
          {price}
        </span>
        {description}
        <RakimDataLine item={item} venue={venue} />
        <AvailabilityNote status={status} venue={venue} />
      </span>
      {item.image ? (
        <Image
          src={item.image.src}
          alt={item.image.alt.text}
          width={72}
          height={72}
          sizes="72px"
          quality={75}
          className="size-18 shrink-0 rounded-[4px] object-cover"
          style={{
            objectPosition: `${String(item.image.focalX)}% ${String(item.image.focalY)}%`,
          }}
        />
      ) : null}
    </button>
  );
}
