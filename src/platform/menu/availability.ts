import { DAY_END_HOUR } from "../../config/limits";
import { localTime, parseClock } from "./clock";
import type { OutsideWindow } from "./schedule";

/**
 * Availability of a product (REQ-008, BR-MST-001…005, D-06). The menu page is static (ADR-0005):
 * the panel's last write is in the page, the browser applies the clock — a sold-out mark that
 * expired at 04:00, the daily count of a new business day, the next bake time, the season.
 *
 * The business day ends at 04:00 venue time (P-01): 02:00 on Saturday still belongs to Friday.
 */

/** Month range, inclusive; from > to crosses the year end (9–3 = September to March). */
export type MonthRange = { from: number; to: number };

export type ItemAvailability = {
  /** ISO instant the sold-out mark ends; null = not marked (or indefinite, below). */
  soldOutUntil: string | null;
  soldOutIndefinitely: boolean;
  /** Portions per business day; null = unlimited. */
  dailyLimit: number | null;
  /** Portions left on `remainingOn`; another day means a full count again (BR-MST-002). */
  remaining: number | null;
  remainingOn: string | null;
  /** "HH:MM" bake / release times, sorted (BR-MST-003). */
  releaseTimes: string[];
  /** Null = all year (BR-MST-004). */
  seasons: MonthRange[] | null;
  outsideSeason: OutsideWindow;
};

export type AvailabilityStatus = {
  soldOut: null | { reason: "marked"; until: string | null } | { reason: "count" };
  /** Portions left today when the product has a daily limit. */
  remaining: number | null;
  /** The next release today (inDays 0) or tomorrow's first (inDays 1). */
  nextRelease: null | { time: string; inDays: 0 | 1 };
  season: null | { inSeason: boolean; display: OutsideWindow; months: MonthRange[] };
  /** False only for an off-season product whose display is "hide". */
  visible: boolean;
};

const pad = (value: number) => String(value).padStart(2, "0");

/** The business date ("YYYY-MM-DD") of an instant: before 04:00 it is still the previous day. */
export function businessDate(now: Date, timeZone: string): string {
  const shifted = localTime(new Date(now.getTime() - DAY_END_HOUR * 3_600_000), timeZone);
  return `${String(shifted.year)}-${pad(shifted.month)}-${pad(shifted.day)}`;
}

/**
 * Default end of a sold-out mark set now (BR-MST-001): the next 04:00 in the venue's zone.
 * The zone offset is read for that day, so it holds across daylight saving changes elsewhere.
 */
export function nextDayEnd(now: Date, timeZone: string): Date {
  const local = localTime(now, timeZone);
  const offset = (instant: Date) => {
    const at = localTime(instant, timeZone);
    const asUtc = Date.UTC(
      at.year,
      at.month - 1,
      at.day,
      Math.floor(at.minutes / 60),
      at.minutes % 60,
    );
    return asUtc - Math.floor(instant.getTime() / 60_000) * 60_000;
  };
  const dayOffset = local.minutes < DAY_END_HOUR * 60 ? 0 : 1;
  const target = Date.UTC(local.year, local.month - 1, local.day + dayOffset, DAY_END_HOUR, 0);
  return new Date(target - offset(new Date(target)));
}

export function inMonths(ranges: readonly MonthRange[], month: number): boolean {
  return ranges.some(({ from, to }) =>
    from <= to ? month >= from && month <= to : month >= from || month <= to,
  );
}

export function availabilityStatus(
  availability: ItemAvailability | null,
  now: Date,
  timeZone: string,
): AvailabilityStatus {
  if (!availability) {
    return { soldOut: null, remaining: null, nextRelease: null, season: null, visible: true };
  }
  const local = localTime(now, timeZone);

  let remaining: number | null = null;
  if (availability.dailyLimit !== null) {
    remaining =
      availability.remainingOn === businessDate(now, timeZone) && availability.remaining !== null
        ? availability.remaining
        : availability.dailyLimit;
  }

  let soldOut: AvailabilityStatus["soldOut"] = null;
  if (availability.soldOutIndefinitely) soldOut = { reason: "marked", until: null };
  else if (availability.soldOutUntil && now < new Date(availability.soldOutUntil)) {
    soldOut = { reason: "marked", until: availability.soldOutUntil };
  } else if (remaining !== null && remaining <= 0) soldOut = { reason: "count" };

  let nextRelease: AvailabilityStatus["nextRelease"] = null;
  if (availability.releaseTimes.length > 0) {
    const later = availability.releaseTimes.find((time) => parseClock(time) > local.minutes);
    const first = availability.releaseTimes[0];
    if (later) nextRelease = { time: later, inDays: 0 };
    else if (first) nextRelease = { time: first, inDays: 1 };
  }

  let season: AvailabilityStatus["season"] = null;
  if (availability.seasons && availability.seasons.length > 0) {
    season = {
      inSeason: inMonths(availability.seasons, local.month),
      display: availability.outsideSeason,
      months: availability.seasons,
    };
  }

  return {
    soldOut,
    remaining,
    nextRelease,
    season,
    visible: !(season && !season.inSeason && season.display === "hide"),
  };
}

/** BR-MST-005: a daily menu shows only the business date's entries; none = an empty section. */
export function dailyEntries<T extends { onDate: string }>(
  entries: readonly T[],
  today: string,
): T[] {
  return entries.filter((entry) => entry.onDate === today);
}
