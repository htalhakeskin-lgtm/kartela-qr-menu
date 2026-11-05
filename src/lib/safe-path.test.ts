import { describe, expect, it } from "vitest";

import { PANEL_HOME, safeReturnPath } from "./safe-path";

describe("safeReturnPath (11-guvenlik §7: no open redirect after sign-in)", () => {
  it.each(["/panel", "/panel/rakim", "/panel/rakim/ayarlar?sekme=saatler", "/panel#icerik"])(
    "keeps the panel path %s",
    (path) => {
      expect(safeReturnPath(path)).toBe(path);
    },
  );

  it.each([
    undefined,
    "",
    "https://evil.example.com/panel",
    "//evil.example.com/panel",
    "/\\evil.example.com",
    "/panel//evil.example.com",
    "/panel/%2F%2Fevil.example.com",
    "/panelx",
    "/kvkk",
    "/panel/giris",
    "/panel/giris/dogrula",
    "/panel/ rakim",
    "/panel/" + "a".repeat(600),
  ])("falls back to the panel home for %s", (path) => {
    expect(safeReturnPath(path)).toBe(PANEL_HOME);
  });
});
