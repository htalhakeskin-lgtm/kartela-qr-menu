import { describe, expect, it } from "vitest";

import { localTime } from "./clock";
import {
  inSeason,
  type MenuSchedule,
  menuStatus,
  orderMenus,
  secondsToNextBoundary,
} from "./schedule";

const TZ = "Europe/Istanbul";
/** Istanbul wall-clock time; Turkey keeps UTC+3 all year (no DST). */
const at = (local: string) => new Date(`${local}:00+03:00`);

// 2026-11-06 is a Friday, 2026-11-07 a Saturday, 2026-11-09 a Monday.
const breakfast: MenuSchedule = { windows: [{ start: "08:00", end: "12:00" }] };
const night: MenuSchedule = { days: [5, 6], windows: [{ start: "22:00", end: "02:00" }] };

describe("BR-MNU-001: menu windows in Istanbul time", () => {
  it("reads the wall clock in the venue's zone, whatever the server's zone", () => {
    expect(localTime(new Date("2026-11-06T05:00:00Z"), TZ)).toEqual({
      weekday: 5,
      minutes: 8 * 60,
      year: 2026,
      month: 11,
      day: 6,
    });
  });

  it.each([
    ["2026-11-06T07:59", "later"],
    ["2026-11-06T08:00", "open"],
    ["2026-11-06T11:59", "open"],
    ["2026-11-06T12:00", "later"],
    ["2026-11-06T23:59", "later"],
    ["2026-11-07T00:00", "later"],
  ])("breakfast 08:00–12:00 at %s is %s", (local, state) => {
    expect(menuStatus(breakfast, "dim", at(local), TZ).state).toBe(state);
  });

  it.each([
    ["2026-11-06T21:59", "later"], // Friday, before the start
    ["2026-11-06T22:00", "open"],
    ["2026-11-06T23:59", "open"],
    ["2026-11-07T00:00", "open"], // Saturday after midnight: Friday's window still runs
    ["2026-11-07T01:59", "open"],
    ["2026-11-07T02:00", "later"],
    ["2026-11-08T01:00", "open"], // Sunday 01:00 belongs to Saturday's window
    ["2026-11-09T01:00", "later"], // Monday 01:00: Sunday has no window
  ])("a night window 22:00–02:00 on Fri/Sat at %s is %s", (local, state) => {
    expect(menuStatus(night, "dim", at(local), TZ).state).toBe(state);
  });

  it("a menu without a schedule is always open", () => {
    expect(menuStatus(null, "hide", at("2026-11-06T03:00"), TZ)).toEqual({ state: "open" });
  });

  it("an all-day menu on weekdays is open on Monday and starts Monday on Saturday", () => {
    const weekdays: MenuSchedule = { days: [1, 2, 3, 4, 5] };
    expect(menuStatus(weekdays, "dim", at("2026-11-09T15:00"), TZ).state).toBe("open");
    expect(menuStatus(weekdays, "dim", at("2026-11-07T15:00"), TZ)).toMatchObject({
      state: "later",
      startsAt: "00:00",
      inDays: 2,
      weekday: 1,
    });
  });
});

describe("BR-MNU-002: outside its window a menu dims with its start time, or hides", () => {
  it("before the window: starts later today", () => {
    expect(menuStatus(breakfast, "dim", at("2026-11-06T07:30"), TZ)).toEqual({
      state: "later",
      display: "dim",
      startsAt: "08:00",
      inDays: 0,
      weekday: 5,
    });
  });

  it("after the window: starts tomorrow, and the display choice is kept", () => {
    expect(menuStatus(breakfast, "hide", at("2026-11-06T13:00"), TZ)).toEqual({
      state: "later",
      display: "hide",
      startsAt: "08:00",
      inDays: 1,
      weekday: 6,
    });
  });

  it("with several windows, the next one of the day is reported", () => {
    const split: MenuSchedule = {
      windows: [
        { start: "18:00", end: "23:00" },
        { start: "12:00", end: "15:00" },
      ],
    };
    expect(menuStatus(split, "dim", at("2026-11-06T16:00"), TZ)).toMatchObject({
      startsAt: "18:00",
      inDays: 0,
    });
  });

  it("the night menu on Monday afternoon starts on Friday", () => {
    expect(menuStatus(night, "dim", at("2026-11-09T15:00"), TZ)).toMatchObject({
      state: "later",
      startsAt: "22:00",
      inDays: 4,
      weekday: 5,
    });
  });

  it("out of season the menu is closed (no start time to promise)", () => {
    const summer: MenuSchedule = { seasons: [{ from: "06-01", to: "09-15" }] };
    expect(menuStatus(summer, "dim", at("2026-11-06T12:00"), TZ)).toEqual({
      state: "closed",
      display: "dim",
    });
  });
});

describe("seasons", () => {
  it.each([
    [12, 31, true],
    [1, 1, true],
    [2, 28, true],
    [3, 1, false],
    [11, 14, false],
    [11, 15, true],
  ])("a winter season 11-15–02-28 crosses the year end: %i/%i → %s", (month, day, expected) => {
    expect(inSeason([{ from: "11-15", to: "02-28" }], month, day)).toBe(expected);
  });

  it("no season means all year", () => {
    expect(inSeason(undefined, 7, 1)).toBe(true);
    expect(inSeason([], 7, 1)).toBe(true);
  });
});

describe("REQ-020: serving order and the next boundary (D-17)", () => {
  const menus = [
    { slug: "sabah", schedule: breakfast, outsideWindow: "dim" as const },
    { slug: "gun-boyu", schedule: null, outsideWindow: "dim" as const },
  ];

  it("an open window says until when it runs; an all-day menu does not", () => {
    expect(menuStatus(breakfast, "dim", at("2026-11-06T09:30"), TZ)).toEqual({
      state: "open",
      until: "12:00",
    });
    expect(menuStatus(night, "dim", at("2026-11-07T01:00"), TZ)).toEqual({
      state: "open",
      until: "02:00",
    });
    expect(menuStatus(null, "dim", at("2026-11-06T09:30"), TZ)).toEqual({ state: "open" });
  });

  it("open menus come first, each group in the venue's order", () => {
    const order = (local: string) =>
      orderMenus(menus, at(local), TZ).map((entry) => entry.menu.slug);
    expect(order("2026-11-06T09:00")).toEqual(["sabah", "gun-boyu"]);
    expect(order("2026-11-06T13:00")).toEqual(["gun-boyu", "sabah"]);
  });

  it("the page is rebuilt when the next window starts or ends, in the venue's day", () => {
    const schedules = menus.map((menu) => menu.schedule);
    expect(secondsToNextBoundary(schedules, at("2026-11-06T09:30"), TZ)).toBe(150 * 60);
    expect(secondsToNextBoundary(schedules, at("2026-11-06T07:00"), TZ)).toBe(60 * 60);
    // After the last boundary of the day: tomorrow's first start.
    expect(secondsToNextBoundary(schedules, at("2026-11-06T13:00"), TZ)).toBe(19 * 60 * 60);
    expect(secondsToNextBoundary([null], at("2026-11-06T13:00"), TZ)).toBeNull();
  });
});
