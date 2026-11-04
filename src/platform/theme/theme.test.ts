import { readFileSync } from "node:fs";
import path from "node:path";
import vm from "node:vm";

import { describe, expect, it } from "vitest";

import { themeMeta } from "@/themes/meta";

import { THEMES } from "../tenant/registry-schema";
import type { ThemeTokens } from "./contract";
import { COLOUR_STORAGE_KEY, prePaintSource } from "./pre-paint";

/** --surface-muted ← surfaceMuted */
const cssName = (token: string) => `--${token.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)}`;

/** Custom properties of the first CSS block whose selector matches. */
function cssBlock(css: string, selector: RegExp): Record<string, string> {
  // The selector may be one of a comma-separated list (":root[a], :root[b] {").
  const match = new RegExp(`${selector.source}[^{]*\\{([^}]*)\\}`).exec(css);
  if (!match?.[1]) throw new Error(`No block for ${String(selector)}`);
  const declared: Record<string, string> = {};
  for (const [, name = "", value = ""] of match[1].matchAll(/(--[a-z-]+)\s*:\s*([^;]+);/g)) {
    declared[name] = value.trim();
  }
  return declared;
}

const expectSame = (
  tokens: ThemeTokens["color"],
  declared: Record<string, string>,
  label: string,
) => {
  for (const [token, value] of Object.entries(tokens)) {
    expect(declared[cssName(token)], `${label} ${cssName(token)}`).toBe(value);
  }
};

describe("BR-TMA-002: theme conformance (contract ↔ CSS)", () => {
  it.each(THEMES)(
    "%s: every colour token of the contract is declared in its CSS with the same value",
    (id) => {
      const meta = themeMeta[id];
      expect(meta.id).toBe(id);
      const css = readFileSync(path.join(process.cwd(), "src", "themes", id, `${id}.css`), "utf8");
      expectSame(meta.tokens.color, cssBlock(css, /:root/), `${id} day`);
      if (meta.tokenVariants?.dark && meta.tokenVariants.darkDayparts?.length) {
        const daypart = meta.tokenVariants.darkDayparts[0]!;
        expectSame(
          meta.tokenVariants.dark,
          cssBlock(css, new RegExp(`:root\\[data-gun-dilimi="${daypart}"\\]`)),
          `${id} ${daypart}`,
        );
      }
    },
  );

  it("the ready-made theme supports right-to-left and all three quick layouts", () => {
    expect(themeMeta.sade.supports).toEqual({
      rtl: true,
      layouts: { quick: ["liste", "kart", "izgara"], explore: ["akis", "dergi"] },
    });
  });
});

describe("pre-paint script", () => {
  /** Runs the inline script against a fake <html> at an Istanbul wall-clock time. */
  function run(localTime: string, stored: string | null = null) {
    const attributes: Record<string, string> = {};
    const fixed = new Date(`${localTime}:00+03:00`).getTime();
    class FixedDate extends Date {
      constructor() {
        super(fixed);
      }
    }
    vm.runInNewContext(prePaintSource("Europe/Istanbul"), {
      Intl,
      Number,
      Date: FixedDate,
      document: {
        documentElement: { setAttribute: (k: string, v: string) => (attributes[k] = v) },
      },
      localStorage: { getItem: (k: string) => (k === COLOUR_STORAGE_KEY ? stored : null) },
    });
    return attributes;
  }

  it.each([
    ["2026-11-06T04:59", "gece"],
    ["2026-11-06T05:00", "sabah"],
    ["2026-11-06T11:59", "sabah"],
    ["2026-11-06T12:00", "ogle"],
    ["2026-11-06T18:59", "ogle"],
    ["2026-11-06T19:00", "aksam"],
    ["2026-11-06T22:59", "aksam"],
    ["2026-11-06T23:00", "gece"],
  ])("at %s Istanbul time the daypart is %s", (local, daypart) => {
    expect(run(local)["data-gun-dilimi"]).toBe(daypart);
  });

  it("applies the guest's colour choice; anything else leaves the system preference", () => {
    expect(run("2026-11-06T12:00", "koyu")["data-renk"]).toBe("koyu");
    expect(run("2026-11-06T12:00", "mor")["data-renk"]).toBeUndefined();
  });

  it("never throws when storage is blocked", () => {
    expect(() => {
      vm.runInNewContext(prePaintSource(), {
        Intl,
        Number,
        Date,
        document: { documentElement: { setAttribute: () => undefined } },
        localStorage: {
          getItem: () => {
            throw new Error("blocked");
          },
        },
      });
    }).not.toThrow();
  });
});
