/**
 * Wall-clock time of a venue (BR-MNU-001). Menu pages are static; the browser computes "now" in
 * the venue's time zone (ADR-0005), so this uses Intl only (no date library in the menu bundle).
 */

/** ISO weekday: 1 = Monday … 7 = Sunday. */
export type IsoWeekday = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export type LocalTime = {
  weekday: IsoWeekday;
  /** Minutes since local midnight, 0–1439. */
  minutes: number;
  month: number; // 1–12
  day: number; // 1–31
};

const WEEKDAYS: Record<string, IsoWeekday> = {
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
  Sun: 7,
};

const formatters = new Map<string, Intl.DateTimeFormat>();

function formatterFor(timeZone: string): Intl.DateTimeFormat {
  let formatter = formatters.get(timeZone);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat("en-US", {
      timeZone,
      weekday: "short",
      month: "numeric",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      hourCycle: "h23",
    });
    formatters.set(timeZone, formatter);
  }
  return formatter;
}

export function localTime(now: Date, timeZone: string): LocalTime {
  const parts = Object.fromEntries(
    formatterFor(timeZone)
      .formatToParts(now)
      .map((part) => [part.type, part.value]),
  );
  const weekday = WEEKDAYS[parts.weekday ?? ""];
  if (!weekday) throw new Error(`Unexpected weekday for ${timeZone}`);
  return {
    weekday,
    minutes: Number(parts.hour) * 60 + Number(parts.minute),
    month: Number(parts.month),
    day: Number(parts.day),
  };
}

/** "08:30" → 510. Throws on anything that is not a 24-hour HH:MM. */
export function parseClock(value: string): number {
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(value);
  if (!match) throw new Error(`Not a HH:MM time: ${value}`);
  return Number(match[1]) * 60 + Number(match[2]);
}

export function previousWeekday(day: IsoWeekday): IsoWeekday {
  return (day === 1 ? 7 : day - 1) as IsoWeekday;
}
