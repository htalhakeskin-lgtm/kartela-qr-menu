import { type IsoWeekday, localTime, parseClock, previousWeekday } from "./clock";

/**
 * Menu time windows (BR-MNU-001, BR-MNU-002, REQ-003). Evaluated in the browser against the
 * venue's time zone (ADR-0005); the static page carries the schedule, not the result.
 *
 * - windows: daily time windows, "HH:MM"–"HH:MM". An end at or before the start crosses midnight
 *   (22:00–02:00) and belongs to the day it starts on. No windows = all day.
 * - days: ISO weekdays a window may start on. None = every day.
 * - seasons: "MM-DD"–"MM-DD" date ranges, inclusive; from > to crosses the year end (11-15–02-28).
 *   None = all year.
 */
export type TimeWindow = { start: string; end: string };
export type SeasonRange = { from: string; to: string };
export type MenuSchedule = {
  days?: IsoWeekday[];
  windows?: TimeWindow[];
  seasons?: SeasonRange[];
};

/** What a menu shows outside its window: dimmed with its start time, or nothing. */
export type OutsideWindow = "dim" | "hide";

export type MenuStatus =
  /** `until`: the end of the window the menu is open in ("12:00"); absent for all-day menus. */
  | { state: "open"; until?: string }
  /** Starts at `startsAt` in `inDays` days (0 = later today) on `weekday`. */
  | {
      state: "later";
      display: OutsideWindow;
      startsAt: string;
      inDays: number;
      weekday: IsoWeekday;
    }
  /** Out of season, or no window starts within a week. */
  | { state: "closed"; display: OutsideWindow };

const monthDay = (month: number, day: number) => month * 100 + day;

function parseMonthDay(value: string): number {
  const match = /^(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/.exec(value);
  if (!match) throw new Error(`Not a MM-DD date: ${value}`);
  return monthDay(Number(match[1]), Number(match[2]));
}

export function inSeason(seasons: readonly SeasonRange[] | undefined, month: number, day: number) {
  if (!seasons || seasons.length === 0) return true;
  const today = monthDay(month, day);
  return seasons.some(({ from, to }) => {
    const [start, end] = [parseMonthDay(from), parseMonthDay(to)];
    return start <= end ? today >= start && today <= end : today >= start || today <= end;
  });
}

export function menuStatus(
  schedule: MenuSchedule | null | undefined,
  outsideWindow: OutsideWindow,
  now: Date,
  timeZone: string,
): MenuStatus {
  const local = localTime(now, timeZone);
  const closed = { state: "closed", display: outsideWindow } as const;
  if (!schedule) return { state: "open" };
  if (!inSeason(schedule.seasons, local.month, local.day)) return closed;

  const days = schedule.days && schedule.days.length > 0 ? new Set(schedule.days) : null;
  const startsOn = (day: IsoWeekday) => days === null || days.has(day);
  const windows = (schedule.windows ?? [])
    .map((window) => ({ ...window, from: parseClock(window.start), to: parseClock(window.end) }))
    .sort((a, b) => a.from - b.from);

  if (windows.length === 0) {
    if (startsOn(local.weekday)) return { state: "open" };
    return nextStart(closed, local.weekday, local.minutes, [{ start: "00:00", from: 0 }], startsOn);
  }

  const current = windows.find(({ from, to }) =>
    from < to
      ? startsOn(local.weekday) && local.minutes >= from && local.minutes < to
      : (startsOn(local.weekday) && local.minutes >= from) ||
        (startsOn(previousWeekday(local.weekday)) && local.minutes < to),
  );
  if (current) return { state: "open", until: current.end };
  return nextStart(closed, local.weekday, local.minutes, windows, startsOn);
}

function nextStart(
  closed: { state: "closed"; display: OutsideWindow },
  today: IsoWeekday,
  minutes: number,
  windows: readonly { start: string; from: number }[],
  startsOn: (day: IsoWeekday) => boolean,
): MenuStatus {
  for (let inDays = 0; inDays <= 7; inDays += 1) {
    const weekday = (((today - 1 + inDays) % 7) + 1) as IsoWeekday;
    if (!startsOn(weekday)) continue;
    const window = windows.find(({ from }) => inDays > 0 || from > minutes);
    if (window) {
      return { state: "later", display: closed.display, startsAt: window.start, inDays, weekday };
    }
  }
  return closed;
}

/**
 * Menus in serving order (REQ-020): open ones first, the rest after, each group in the venue's
 * own order. The server renders this order when it builds the page and the browser keeps it, so
 * the list does not move after the first paint (D-17; D-15 measured CLS 0.64 when it did).
 */
export function orderMenus<
  M extends { schedule: MenuSchedule | null; outsideWindow: OutsideWindow },
>(menus: readonly M[], now: Date, timeZone: string): { menu: M; status: MenuStatus }[] {
  const rated = menus.map((menu) => ({
    menu,
    status: menuStatus(menu.schedule, menu.outsideWindow, now, timeZone),
  }));
  return [
    ...rated.filter((entry) => entry.status.state === "open"),
    ...rated.filter((entry) => entry.status.state !== "open"),
  ];
}

/**
 * Seconds until the next window starts or ends in the venue's day, or null when no menu has a
 * window. The menu page is rebuilt then, so its serving order matches the clock (D-17).
 */
export function secondsToNextBoundary(
  schedules: readonly (MenuSchedule | null)[],
  now: Date,
  timeZone: string,
): number | null {
  const clocks = schedules.flatMap((schedule) =>
    (schedule?.windows ?? []).flatMap((window) => [
      parseClock(window.start),
      parseClock(window.end),
    ]),
  );
  if (clocks.length === 0) return null;
  const local = localTime(now, timeZone);
  const later = clocks.filter((minute) => minute > local.minutes);
  const next = later.length > 0 ? Math.min(...later) : Math.min(...clocks) + 24 * 60;
  return (next - local.minutes) * 60 - now.getUTCSeconds();
}
