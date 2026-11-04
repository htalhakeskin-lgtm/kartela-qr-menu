import { describe, expect, it } from "vitest";

import {
  formatArea,
  formatDate,
  formatDateTime,
  formatMoney,
  formatNumber,
  formatPercent,
  formatPhone,
  formatRelativeTime,
  formatTime,
} from "./format";

const NBSP = " ";

describe("formatMoney", () => {
  it.each([
    [123456, `1.234,56${NBSP}₺`],
    [0, `0,00${NBSP}₺`],
    [5, `0,05${NBSP}₺`],
    [-250000, `-2.500,00${NBSP}₺`],
    [18500000000, `185.000.000,00${NBSP}₺`],
  ])("formats %i kuruş as %s", (minor, expected) => {
    expect(formatMoney(minor)).toBe(expected);
  });

  it("drops zero kuruş with decimals: auto", () => {
    expect(formatMoney(18500000000, { decimals: "auto" })).toBe(`185.000.000${NBSP}₺`);
    expect(formatMoney(125050, { decimals: "auto" })).toBe(`1.250,50${NBSP}₺`);
  });

  it("puts the symbol after the amount for other currencies", () => {
    expect(formatMoney(99900, { currency: "EUR" })).toBe(`999,00${NBSP}€`);
  });

  it("rejects non-integer minor units", () => {
    expect(() => formatMoney(12.5)).toThrow(RangeError);
  });
});

describe("numbers", () => {
  it("uses Turkish separators", () => {
    expect(formatNumber(1234.5)).toBe("1.234,5");
  });

  it("puts the percent sign first", () => {
    expect(formatPercent(15)).toBe("%15");
    expect(formatPercent(7.5)).toBe("%7,5");
    expect(formatPercent(-3)).toBe("-%3");
  });

  it("formats area", () => {
    expect(formatArea(120)).toBe(`120${NBSP}m²`);
  });
});

describe("dates (Europe/Istanbul, regardless of process time zone)", () => {
  // 2026-10-15 21:30 UTC is 2026-10-16 00:30 in Istanbul (UTC+3): the day must roll over.
  const lateUtc = new Date("2026-10-15T21:30:00Z");

  it("formats long and short dates in Istanbul time", () => {
    expect(formatDate(lateUtc)).toBe("16 Ekim 2026");
    expect(formatDate(lateUtc, "short")).toBe("16.10.2026");
  });

  it("formats time in 24-hour clock", () => {
    expect(formatTime(lateUtc)).toBe("00:30");
    expect(formatDateTime(new Date("2026-03-16T06:00:00Z"))).toBe("16 Mart 2026 09:00");
  });

  it("includes the Turkish weekday", () => {
    expect(formatDate(new Date("2026-10-15T09:00:00Z"), "withWeekday")).toBe(
      "15 Ekim 2026 Perşembe",
    );
  });

  it("formats relative time against an injected now", () => {
    const now = new Date("2026-10-16T09:00:00Z");
    expect(formatRelativeTime(new Date("2026-10-13T09:00:00Z"), now)).toBe("3 gün önce");
    expect(formatRelativeTime(new Date("2026-10-17T09:00:00Z"), now)).toBe("yarın");
  });
});

describe("formatPhone", () => {
  it.each([
    ["+905321234567", "0532 123 45 67"],
    ["+902121234567", "0212 123 45 67"],
    ["+4930123456", "+4930123456"],
  ])("%s → %s", (input, expected) => {
    expect(formatPhone(input)).toBe(expected);
  });
});
