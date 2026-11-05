import { describe, expect, it } from "vitest";

import { beanAttributes, brewAttributes, brewTime } from "./attributes";

describe("D-14: reading a product's kind-specific facts", () => {
  it("a bean's facts come back; anything else is not a bean", () => {
    const facts = {
      region: "Huila",
      altitude: { min: 1700, max: 1900 },
      process: "washed",
      varieties: ["Caturra"],
      notes: [{ tr: "karamel" }, { tr: "elma" }],
      roast: "omni",
      weightG: 250,
    };
    expect(beanAttributes(facts)).toEqual(facts);
    expect(beanAttributes({})).toBeNull();
    expect(beanAttributes({ region: "Huila" })).toBeNull();
  });

  it("a drink's recipe comes back when it has one", () => {
    expect(brewAttributes({ brew: { method: "v60", doseG: 15, timeS: 195 } })).toEqual({
      method: "v60",
      doseG: 15,
      timeS: 195,
    });
    expect(brewAttributes({})).toBeNull();
    expect(brewAttributes({ brew: "v60" })).toBeNull();
  });

  it("brew times read as minutes and seconds", () => {
    expect(brewTime(195)).toBe("3:15");
    expect(brewTime(28)).toBe("0:28");
    expect(brewTime(270)).toBe("4:30");
  });
});
