import { formatNumber } from "@/lib/format";
import { beanAttributes, brewAttributes, brewTime } from "@/platform/menu/attributes";
import type { ItemView, VenueView } from "@/platform/menu/view";

/**
 * Rakım's data line (plan §11.1: "rakım, oran, sıcaklık ve gram tablo rakamlı monospace ile veri
 * gibi dizilir"): the brew recipe of a drink, the facts of a bean, otherwise portion and volume.
 * Set in IBM Plex Mono with tabular figures; each part isolated so it reads left to right.
 */

const PROCESS: Record<string, { tr: string; en: string }> = {
  washed: { tr: "yıkanmış", en: "washed" },
  natural: { tr: "doğal", en: "natural" },
  honey: { tr: "bal işleme", en: "honey" },
  anaerobic: { tr: "anaerobik", en: "anaerobic" },
};

const SECONDS = { tr: "sn", en: "s" };

function lang(venue: VenueView): "tr" | "en" {
  return venue.locale === "tr" ? "tr" : "en";
}

export function dataParts(item: ItemView, venue: VenueView): string[] {
  const l = lang(venue);
  const bean = beanAttributes(item.attributes);
  if (bean) {
    const { min, max } = bean.altitude;
    const altitude =
      min === max ? `${formatNumber(min)} m` : `${formatNumber(min)}–${formatNumber(max)} m`;
    return [
      bean.region,
      altitude,
      PROCESS[bean.process]?.[l] ?? bean.process,
      `${String(bean.weightG)} g`,
    ];
  }
  const brew = brewAttributes(item.attributes);
  if (brew) {
    if (brew.method === "espresso" && brew.doseG && brew.yieldG) {
      const parts = [`${formatNumber(brew.doseG)} g → ${formatNumber(brew.yieldG)} g`];
      if (brew.timeS) parts.push(`${String(brew.timeS)} ${SECONDS[l]}`);
      return parts;
    }
    const parts: string[] = [];
    if (brew.doseG) parts.push(`${formatNumber(brew.doseG)} g`);
    if (brew.waterMl) parts.push(`${String(brew.waterMl)} ml`);
    if (brew.tempC) parts.push(`${String(brew.tempC)} °C`);
    if (brew.timeS) parts.push(brewTime(brew.timeS));
    return parts;
  }
  const parts: string[] = [];
  if (item.portionG !== null) parts.push(`${String(item.portionG)} g`);
  if (item.volumeMl !== null) parts.push(`${String(item.volumeMl)} ml`);
  return parts;
}

export function RakimDataLine({ item, venue }: { item: ItemView; venue: VenueView }) {
  const parts = dataParts(item, venue);
  if (parts.length === 0) return null;
  return (
    <span className="font-mono text-xs text-muted-foreground tabular-nums">
      {parts.map((part, index) => (
        <span key={part}>
          {index > 0 ? " · " : null}
          <bdi>{part}</bdi>
        </span>
      ))}
    </span>
  );
}
