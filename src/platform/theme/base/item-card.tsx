import Image from "next/image";

import { uiText } from "../../i18n/ui";
import type { AvailabilityStatus } from "../../menu/availability";
import type { ItemView, VenueView } from "../../menu/view";
import type { ImageFallbackProps, ItemCardProps } from "../contract";
import { BasePrice } from "./price";
import { DIMMED, T } from "./text";

/**
 * Item card slot (REQ-003, K-23), four variants on the same data:
 * - satir: a ledger row — name, short description, data line; a 72 px photo at the end if any
 * - kart: a card with a 4:3 photo or the typographic card
 * - izgara: a compact tile for two columns on a phone
 * - one-cikan: the featured product, full width
 *
 * A product without a photo is not "missing" anything: the typographic card (K-23) is designed
 * for every variant. The whole card is one button that opens the item sheet.
 */

/** The data line under a name: portion / volume, spice; never energy (K-24). */
function dataParts(item: ItemView, venue: VenueView): string[] {
  const ui = uiText(venue.locale);
  const parts: string[] = [];
  if (item.portionG !== null) parts.push(`${String(item.portionG)} g`);
  if (item.volumeMl !== null) parts.push(`${String(item.volumeMl)} ml`);
  if (item.spiceLevel > 0) parts.push(ui.spiceLevels[item.spiceLevel]);
  return parts;
}

/** Each part isolated (<bdi>): "300 g" stays "300 g" on a right-to-left page. */
export function DataLine({ item, venue }: { item: ItemView; venue: VenueView }) {
  const parts = dataParts(item, venue);
  if (parts.length === 0) return null;
  return (
    <span className="text-xs text-muted-foreground tabular-nums">
      {parts.map((part, index) => (
        <span key={part}>
          {index > 0 ? " · " : null}
          <bdi>{part}</bdi>
        </span>
      ))}
    </span>
  );
}

/** A short status under the name: sold out, last portions, next batch, out of season. */
export function AvailabilityNote({
  status,
  venue,
}: {
  status: AvailabilityStatus | null;
  venue: VenueView;
}) {
  if (!status) return null;
  const ui = uiText(venue.locale);
  let note: string | null = null;
  if (status.soldOut) note = ui.soldOut;
  else if (status.season && !status.season.inSeason) {
    const months = status.season.months
      .map(({ from, to }) => `${ui.months[from - 1] ?? ""}–${ui.months[to - 1] ?? ""}`)
      .join(", ");
    note = `${ui.inSeason}: ${months}`;
  } else if (status.remaining !== null && status.remaining <= 3)
    note = ui.remainingToday(status.remaining);
  else if (status.nextRelease)
    note = ui.nextRelease(status.nextRelease.time, status.nextRelease.inDays === 1);
  if (!note) return null;
  return (
    <span
      className={
        status.soldOut ? "text-sold-out text-sm font-medium" : "text-sm text-muted-foreground"
      }
    >
      {note}
    </span>
  );
}

/** The typographic card of a product without a photo (K-23): name large, data, one accent rule. */
export function BaseImageFallback({ item, venue }: ImageFallbackProps) {
  return (
    <div
      aria-hidden="true"
      className="flex h-full flex-col justify-end gap-2 border-s-2 border-accent bg-surface px-4 py-4"
    >
      <span className="line-clamp-3 text-lg leading-snug font-semibold text-foreground">
        {item.name.text}
      </span>
      <DataLine item={item} venue={venue} />
    </div>
  );
}

export function BaseItemCard({ item, variant, venue, status, onOpen }: ItemCardProps) {
  const unavailable =
    Boolean(status?.soldOut) || (status?.season ? !status.season.inSeason : false);
  const price = item.defaultPrice ? <BasePrice price={item.defaultPrice} /> : null;
  const description =
    item.description && variant !== "izgara" ? (
      <T
        text={item.description}
        page={venue.locale}
        className="line-clamp-2 text-sm leading-relaxed text-muted-foreground"
      />
    ) : null;

  if (variant === "satir") {
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
              className="text-base font-semibold text-foreground"
            />
            {price}
          </span>
          {description}
          <DataLine item={item} venue={venue} />
          <AvailabilityNote status={status} venue={venue} />
        </span>
        {item.image ? (
          <Image
            src={item.image.src}
            alt={item.image.alt.text}
            width={72}
            height={72}
            sizes="72px"
            className="size-18 shrink-0 rounded-md object-cover"
            style={{
              objectPosition: `${String(item.image.focalX)}% ${String(item.image.focalY)}%`,
            }}
          />
        ) : null}
      </button>
    );
  }

  const featured = variant === "one-cikan";
  const label = featured ? (
    <span className="text-xs font-medium tracking-wide text-accent">
      {uiText(venue.locale).featured}
    </span>
  ) : null;
  const name = (
    <T
      text={item.name}
      page={venue.locale}
      className={
        featured
          ? "text-xl font-semibold text-foreground"
          : "text-base font-semibold text-foreground"
      }
    />
  );
  const footer = (
    <span className="mt-auto flex items-baseline justify-between gap-2 pt-2">
      <AvailabilityNote status={status} venue={venue} />
      <span className="ms-auto">{price}</span>
    </span>
  );

  if (!item.image) {
    // K-23: the typographic card is a design of its own, not an empty photo frame.
    return (
      <button
        type="button"
        onClick={onOpen}
        className={`flex h-full w-full flex-col gap-1 rounded-md border border-s-2 border-border border-s-accent bg-surface p-4 text-start ${unavailable ? DIMMED : ""}`}
      >
        {label}
        <T
          text={item.name}
          page={venue.locale}
          className={
            featured || variant === "kart"
              ? "text-xl leading-snug font-semibold text-foreground"
              : "text-lg leading-snug font-semibold text-foreground"
          }
        />
        {description}
        <DataLine item={item} venue={venue} />
        {footer}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onOpen}
      className={`flex h-full w-full flex-col overflow-hidden rounded-md border border-border bg-background text-start ${unavailable ? DIMMED : ""}`}
    >
      <span
        className={`relative block w-full ${variant === "izgara" ? "aspect-square" : "aspect-[4/3]"}`}
      >
        <Image
          src={item.image.src}
          alt={item.image.alt.text}
          fill
          sizes={featured ? "(min-width: 768px) 720px, 100vw" : "(min-width: 768px) 360px, 50vw"}
          className="object-cover"
          style={{ objectPosition: `${String(item.image.focalX)}% ${String(item.image.focalY)}%` }}
          priority={featured}
        />
      </span>
      <span className="flex flex-1 flex-col gap-1 p-4">
        {label}
        {name}
        {description}
        {footer}
      </span>
    </button>
  );
}
