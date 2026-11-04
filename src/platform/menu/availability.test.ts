import { describe, expect, it } from "vitest";

import {
  availabilityStatus,
  businessDate,
  dailyEntries,
  type ItemAvailability,
  nextDayEnd,
} from "./availability";

const TZ = "Europe/Istanbul";
const at = (local: string) => new Date(`${local}:00+03:00`);

const plain: ItemAvailability = {
  soldOutUntil: null,
  soldOutIndefinitely: false,
  dailyLimit: null,
  remaining: null,
  remainingOn: null,
  releaseTimes: [],
  seasons: null,
  outsideSeason: "dim",
};

describe("P-01: the business day ends at 04:00", () => {
  it.each([
    ["2026-11-06T23:59", "2026-11-06"],
    ["2026-11-07T03:59", "2026-11-06"],
    ["2026-11-07T04:00", "2026-11-07"],
    ["2027-01-01T02:00", "2026-12-31"],
  ])("%s belongs to %s", (local, expected) => {
    expect(businessDate(at(local), TZ)).toBe(expected);
  });

  it.each([
    ["2026-11-06T15:00", "2026-11-07T04:00"],
    ["2026-11-07T02:30", "2026-11-07T04:00"],
    ["2026-12-31T23:00", "2027-01-01T04:00"],
  ])("BR-MST-001: a sold-out mark set at %s ends at %s by default", (local, end) => {
    expect(nextDayEnd(at(local), TZ).toISOString()).toBe(at(end).toISOString());
  });
});

describe("BR-MST-001: sold-out marks", () => {
  const marked = { ...plain, soldOutUntil: at("2026-11-07T04:00").toISOString() };

  it.each([
    ["2026-11-06T23:00", true],
    ["2026-11-07T03:59", true],
    ["2026-11-07T04:00", false],
  ])("marked until 04:00, at %s sold out: %s", (local, soldOut) => {
    expect(availabilityStatus(marked, at(local), TZ).soldOut !== null).toBe(soldOut);
  });

  it("an indefinite mark stays until the panel clears it", () => {
    expect(
      availabilityStatus({ ...plain, soldOutIndefinitely: true }, at("2027-03-01T12:00"), TZ)
        .soldOut,
    ).toEqual({ reason: "marked", until: null });
  });
});

describe("BR-MST-002: daily count", () => {
  const geisha = { ...plain, dailyLimit: 12, remaining: 0, remainingOn: "2026-11-06" };

  it("reaching zero makes the product sold out for the rest of the business day", () => {
    expect(availabilityStatus(geisha, at("2026-11-06T18:00"), TZ)).toMatchObject({
      soldOut: { reason: "count" },
      remaining: 0,
    });
    expect(availabilityStatus(geisha, at("2026-11-07T03:59"), TZ).soldOut).toEqual({
      reason: "count",
    });
  });

  it("a new business day starts from the full count again", () => {
    expect(availabilityStatus(geisha, at("2026-11-07T04:00"), TZ)).toMatchObject({
      soldOut: null,
      remaining: 12,
    });
  });

  it("portions left today are reported", () => {
    const today = { ...geisha, remaining: 3 };
    expect(availabilityStatus(today, at("2026-11-06T10:00"), TZ).remaining).toBe(3);
  });
});

describe("BR-MST-003: release times", () => {
  const bakery = { ...plain, releaseTimes: ["07:00", "11:00", "15:00"] };

  it.each([
    ["2026-11-06T06:00", { time: "07:00", inDays: 0 }],
    ["2026-11-06T10:00", { time: "11:00", inDays: 0 }],
    ["2026-11-06T11:00", { time: "15:00", inDays: 0 }],
    ["2026-11-06T16:00", { time: "07:00", inDays: 1 }],
  ])("at %s the next release is %o", (local, expected) => {
    expect(availabilityStatus(bakery, at(local), TZ).nextRelease).toEqual(expected);
  });
});

describe("BR-MST-004: seasons", () => {
  const salep = { ...plain, seasons: [{ from: 10, to: 3 }] };

  it.each([
    ["2026-11-06T12:00", true],
    ["2027-03-31T12:00", true],
    ["2027-04-01T12:00", false],
    ["2027-07-15T12:00", false],
  ])("a winter drink (October–March) at %s in season: %s", (local, inSeason) => {
    expect(availabilityStatus(salep, at(local), TZ).season?.inSeason).toBe(inSeason);
  });

  it("off season, dim keeps it visible with its months; hide removes it", () => {
    const july = at("2027-07-15T12:00");
    expect(availabilityStatus(salep, july, TZ)).toMatchObject({
      visible: true,
      season: { display: "dim", months: [{ from: 10, to: 3 }] },
    });
    expect(availabilityStatus({ ...salep, outsideSeason: "hide" }, july, TZ).visible).toBe(false);
  });
});

describe("BR-MST-005: the daily menu", () => {
  const entries = [
    { onDate: "2026-11-06", itemId: "kuru-fasulye" },
    { onDate: "2026-11-07", itemId: "karniyarik" },
  ];

  it("shows only the business date's entries; a day without entries is empty", () => {
    expect(dailyEntries(entries, businessDate(at("2026-11-07T02:00"), TZ))).toEqual([entries[0]]);
    expect(dailyEntries(entries, "2026-11-08")).toEqual([]);
  });

  it("a product without availability data is simply available", () => {
    expect(availabilityStatus(null, at("2026-11-06T12:00"), TZ)).toEqual({
      soldOut: null,
      remaining: null,
      nextRelease: null,
      season: null,
      visible: true,
    });
  });
});
