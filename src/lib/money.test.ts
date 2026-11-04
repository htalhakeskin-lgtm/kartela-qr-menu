import { describe, expect, it } from "vitest";

import { parseMoney, percentOf } from "./money";

describe("parseMoney", () => {
  it.each([
    ["1.234,56", 123456],
    ["1234,5", 123450],
    ["1.250", 125000],
    ["12.5", 1250],
    ["₺ 99", 9900],
    ["185.000.000 TL", 18500000000],
    ["0,05", 5],
  ])("%s → %i", (input, expected) => {
    expect(parseMoney(input)).toBe(expected);
  });

  it.each(["", "abc", "1,234,5", "12,345", "1.23.4", "-5"])("rejects %j", (input) => {
    expect(parseMoney(input)).toBeNull();
  });

  it("accepts negatives only when allowed", () => {
    expect(parseMoney("-12,50", { allowNegative: true })).toBe(-1250);
  });
});

describe("percentOf", () => {
  it("rounds half away from zero", () => {
    expect(percentOf(1005, 50)).toBe(503);
    expect(percentOf(-1005, 50)).toBe(-503);
    expect(percentOf(100000, 20)).toBe(20000);
  });
});
